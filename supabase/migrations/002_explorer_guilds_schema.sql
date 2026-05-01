-- 探索者联盟功能数据库迁移
-- 创建时间: 2024-12-19
-- 描述: 实现基于AI驱动的意识共振协作平台

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. 探索者联盟表
CREATE TABLE IF NOT EXISTS explorer_guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(name) >= 3 AND length(name) <= 100),
    theme TEXT NOT NULL CHECK (length(theme) >= 5 AND length(theme) <= 200),
    description TEXT CHECK (length(description) <= 1000),
    status TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed', 'archived')),
    max_members INTEGER NOT NULL DEFAULT 6 CHECK (max_members >= 2 AND max_members <= 20),
    current_members INTEGER NOT NULL DEFAULT 0 CHECK (current_members >= 0),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 添加约束
    CONSTRAINT guild_name_unique UNIQUE (name),
    CONSTRAINT guild_members_limit CHECK (current_members <= max_members)
);

-- 2. 联盟成员表
CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES explorer_guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'explorer' CHECK (role IN ('explorer', 'coordinator', 'founder')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invitation_response TEXT DEFAULT 'pending' CHECK (invitation_response IN ('pending', 'accepted', 'declined')),
    is_active BOOLEAN DEFAULT true,
    
    -- 添加约束
    UNIQUE(guild_id, user_id),
    CONSTRAINT member_role_valid CHECK (
        (role = 'founder' AND invitation_response = 'accepted') OR
        (role IN ('explorer', 'coordinator'))
    )
);

-- 3. 兴趣引力场表（AI分析用户兴趣相似度）
CREATE TABLE IF NOT EXISTS interest_gravity_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme TEXT NOT NULL,
    keywords TEXT[] NOT NULL CHECK (array_length(keywords, 1) > 0),
    user_ids UUID[] NOT NULL CHECK (array_length(user_ids, 1) >= 2),
    strength FLOAT NOT NULL CHECK (strength >= 0.0 AND strength <= 1.0),
    confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 添加约束
    CONSTRAINT gravity_field_unique UNIQUE (theme, array_to_string(keywords, ','))
);

-- 4. 神秘邀请表
CREATE TABLE IF NOT EXISTS mystical_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guild_id UUID NOT NULL REFERENCES explorer_guilds(id) ON DELETE CASCADE,
    invitation_text TEXT NOT NULL CHECK (length(invitation_text) >= 50 AND length(invitation_text) <= 1000),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response TEXT DEFAULT 'pending' CHECK (response IN ('pending', 'accepted', 'declined')),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- 添加约束
    UNIQUE(user_id, guild_id),
    CONSTRAINT invitation_not_expired CHECK (expires_at > NOW())
);

-- 5. 联盟活动记录表
CREATE TABLE IF NOT EXISTS guild_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES explorer_guilds(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('message', 'project_update', 'milestone', 'file_share', 'meeting')),
    content TEXT NOT NULL CHECK (length(content) > 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 联盟成就表
CREATE TABLE IF NOT EXISTS guild_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES explorer_guilds(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL CHECK (achievement_type IN ('milestone', 'collaboration', 'innovation', 'community')),
    title TEXT NOT NULL CHECK (length(title) >= 5 AND length(title) <= 100),
    description TEXT CHECK (length(description) <= 500),
    icon_name TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_explorer_guilds_status ON explorer_guilds(status);
CREATE INDEX IF NOT EXISTS idx_explorer_guilds_theme ON explorer_guilds USING gin(to_tsvector('english', theme));
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_role ON guild_members(role);
CREATE INDEX IF NOT EXISTS idx_interest_gravity_fields_theme ON interest_gravity_fields USING gin(to_tsvector('english', theme));
CREATE INDEX IF NOT EXISTS idx_interest_gravity_fields_keywords ON interest_gravity_fields USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_mystical_invitations_user_id ON mystical_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_mystical_invitations_guild_id ON mystical_invitations(guild_id);
CREATE INDEX IF NOT EXISTS idx_mystical_invitations_status ON mystical_invitations(response);
CREATE INDEX IF NOT EXISTS idx_guild_activities_guild_id ON guild_activities(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_activities_user_id ON guild_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_activities_type ON guild_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_guild_achievements_guild_id ON guild_achievements(guild_id);

-- 创建全文搜索索引
CREATE INDEX IF NOT EXISTS idx_explorer_guilds_search ON explorer_guilds USING gin(
    to_tsvector('english', name || ' ' || theme || ' ' || COALESCE(description, ''))
);

-- 创建触发器函数来更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要更新时间戳的表创建触发器
CREATE TRIGGER update_explorer_guilds_updated_at 
    BEFORE UPDATE ON explorer_guilds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interest_gravity_fields_updated_at 
    BEFORE UPDATE ON interest_gravity_fields 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器函数来维护成员计数
CREATE OR REPLACE FUNCTION update_guild_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE explorer_guilds 
        SET current_members = current_members + 1 
        WHERE id = NEW.guild_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE explorer_guilds 
        SET current_members = current_members - 1 
        WHERE id = OLD.guild_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 为成员表创建触发器
CREATE TRIGGER trigger_update_guild_member_count
    AFTER INSERT OR DELETE ON guild_members
    FOR EACH ROW EXECUTE FUNCTION update_guild_member_count();

-- 设置Row Level Security (RLS)
ALTER TABLE explorer_guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_gravity_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE mystical_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_achievements ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 探索者联盟策略
CREATE POLICY "Users can view public guilds" ON explorer_guilds
    FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "Users can create guilds" ON explorer_guilds
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Guild creators can update their guilds" ON explorer_guilds
    FOR UPDATE USING (auth.uid() = created_by);

-- 联盟成员策略
CREATE POLICY "Users can view guild members" ON guild_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM explorer_guilds 
            WHERE id = guild_id AND status IN ('active', 'completed')
        )
    );

CREATE POLICY "Users can join guilds" ON guild_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON guild_members
    FOR UPDATE USING (auth.uid() = user_id);

-- 神秘邀请策略
CREATE POLICY "Users can view their own invitations" ON mystical_invitations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Guild creators can send invitations" ON mystical_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM explorer_guilds 
            WHERE id = guild_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can respond to their invitations" ON mystical_invitations
    FOR UPDATE USING (auth.uid() = user_id);

-- 联盟活动策略
CREATE POLICY "Guild members can view activities" ON guild_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM guild_members 
            WHERE guild_id = guild_activities.guild_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Guild members can create activities" ON guild_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM guild_members 
            WHERE guild_id = guild_activities.guild_id AND user_id = auth.uid()
        )
    );

-- 联盟成就策略
CREATE POLICY "Users can view guild achievements" ON guild_achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM explorer_guilds 
            WHERE id = guild_id AND status IN ('active', 'completed')
        )
    );

-- 兴趣引力场策略（只允许系统访问）
CREATE POLICY "System only access to interest fields" ON interest_gravity_fields
    FOR ALL USING (false);

-- 创建视图来简化常用查询
CREATE OR REPLACE VIEW guild_overview AS
SELECT 
    eg.id,
    eg.name,
    eg.theme,
    eg.description,
    eg.status,
    eg.max_members,
    eg.current_members,
    eg.created_at,
    u.email as creator_email,
    COUNT(gm.id) as active_members_count
FROM explorer_guilds eg
LEFT JOIN auth.users u ON eg.created_by = u.id
LEFT JOIN guild_members gm ON eg.id = gm.guild_id AND gm.is_active = true
GROUP BY eg.id, eg.name, eg.theme, eg.description, eg.status, eg.max_members, eg.current_members, eg.created_at, u.email;

-- 创建视图来显示用户的联盟状态
CREATE OR REPLACE VIEW user_guild_status AS
SELECT 
    u.id as user_id,
    u.email,
    eg.id as guild_id,
    eg.name as guild_name,
    eg.theme as guild_theme,
    gm.role as user_role,
    gm.joined_at,
    gm.is_active
FROM auth.users u
LEFT JOIN guild_members gm ON u.id = gm.user_id
LEFT JOIN explorer_guilds eg ON gm.guild_id = eg.id
WHERE gm.is_active = true OR gm.is_active IS NULL;

-- 插入一些示例数据用于测试
INSERT INTO explorer_guilds (name, theme, description, created_by) VALUES
('量子意识探索者', '探索意识与量子物理的神秘联系', '我们将在量子力学的奇妙世界中，探索意识如何影响现实，以及集体意识能否创造新的物理现象。', auth.uid()),
('声音疗愈联盟', '声音、频率与意识疗愈的深度探索', '通过声音、音乐和频率的探索，研究声波如何影响意识状态，以及如何利用声音进行深层疗愈。', auth.uid()),
('时空旅者', '时间、空间与意识的非线性关系', '探索时间的主观性、空间的相对性，以及意识如何超越常规的时空限制，体验更高维度的存在。', auth.uid())
ON CONFLICT (name) DO NOTHING;

-- 创建函数来获取推荐联盟
CREATE OR REPLACE FUNCTION get_recommended_guilds(user_uuid UUID)
RETURNS TABLE (
    guild_id UUID,
    guild_name TEXT,
    guild_theme TEXT,
    match_score FLOAT,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eg.id,
        eg.name,
        eg.theme,
        CASE 
            WHEN igf.strength IS NOT NULL THEN igf.strength
            ELSE 0.5
        END as match_score,
        CASE 
            WHEN igf.strength IS NOT NULL THEN '基于你的兴趣匹配'
            ELSE '推荐探索的新领域'
        END as reason
    FROM explorer_guilds eg
    LEFT JOIN interest_gravity_fields igf ON 
        eg.theme ILIKE '%' || ANY(igf.keywords) || '%' 
        AND user_uuid = ANY(igf.user_ids)
    WHERE eg.status = 'forming' 
        AND eg.current_members < eg.max_members
        AND NOT EXISTS (
            SELECT 1 FROM guild_members gm 
            WHERE gm.guild_id = eg.id AND gm.user_id = user_uuid
        )
    ORDER BY match_score DESC, eg.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数来生成神秘邀请
CREATE OR REPLACE FUNCTION generate_mystical_invitation(
    target_user_id UUID,
    guild_id UUID,
    custom_message TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    guild_info RECORD;
    invitation_text TEXT;
BEGIN
    -- 获取联盟信息
    SELECT name, theme, description INTO guild_info
    FROM explorer_guilds
    WHERE id = guild_id;
    
    -- 生成邀请文本
    IF custom_message IS NOT NULL THEN
        invitation_text := custom_message;
    ELSE
        invitation_text := format(
            '我感知到，宇宙中有一个关于"%s"的探索正在召唤它的探索者。%s 你，愿意与其他探索者一同揭开这个宇宙最深的秘密吗？',
            guild_info.theme,
            COALESCE(guild_info.description, '')
        );
    END IF;
    
    -- 插入邀请记录
    INSERT INTO mystical_invitations (user_id, guild_id, invitation_text)
    VALUES (target_user_id, guild_id, invitation_text);
    
    RETURN invitation_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予必要的权限
GRANT SELECT ON guild_overview TO authenticated;
GRANT SELECT ON user_guild_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_guilds(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_mystical_invitation(UUID, UUID, TEXT) TO authenticated;

-- 创建评论
COMMENT ON TABLE explorer_guilds IS '探索者联盟主表，存储联盟的基本信息和状态';
COMMENT ON TABLE guild_members IS '联盟成员关系表，记录用户与联盟的关联';
COMMENT ON TABLE interest_gravity_fields IS 'AI分析的兴趣引力场，用于智能匹配用户';
COMMENT ON TABLE mystical_invitations IS '神秘邀请系统，实现个性化的联盟邀请';
COMMENT ON TABLE guild_activities IS '联盟活动记录，跟踪协作过程';
COMMENT ON TABLE guild_achievements IS '联盟成就系统，激励持续探索';

COMMENT ON FUNCTION get_recommended_guilds(UUID) IS '获取用户推荐的联盟列表';
COMMENT ON FUNCTION generate_mystical_invitation(UUID, UUID, TEXT) IS '生成个性化的神秘邀请';
