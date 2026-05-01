-- 意识树系统迁移
-- 创建时间: 2024-12-27
-- 描述: 实现基于AI评估的五领域意识成长系统

-- 1. 创建学员领域探索记录表 (事实数据源)
CREATE TABLE IF NOT EXISTS public.user_domain_exploration (
    -- 直接关联到profiles表的用户ID，并作为主键
    user_id UUID NOT NULL PRIMARY KEY,

    -- 使用JSONB存储五个核心领域的累积深度分数
    domain_scores JSONB DEFAULT '{
        "self_awareness": {"depth_score": 0},
        "life_sciences": {"depth_score": 0},
        "universal_laws": {"depth_score": 0},
        "creative_expression": {"depth_score": 0},
        "social_connection": {"depth_score": 0}
    }'::jsonb,

    -- 记录上次评估的时间
    last_evaluated_at TIMESTAMPTZ DEFAULT now(),

    -- 记录总的评估次数
    total_evaluations INTEGER DEFAULT 0,

    -- 创建和更新时间
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- 建立到profiles表的外键关系，确保用户删除时，这条记录也一起删除
    CONSTRAINT user_domain_exploration_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 2. 修改profiles表，添加新的意识树视图字段
-- 首先，安全地重命名旧字段
DO $$
BEGIN
    -- 检查旧字段是否存在，如果存在则重命名
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public'
               AND table_name = 'profiles'
               AND column_name = 'consciousness_tree') THEN
        ALTER TABLE public.profiles RENAME COLUMN consciousness_tree TO consciousness_tree_old;
    END IF;
END $$;

-- 添加新的、结构化的视觉视图字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consciousness_tree_view JSONB DEFAULT '{
    "roots": {
        "main_roots": [
            {"domain": "self_awareness", "length": 0},
            {"domain": "life_sciences", "length": 0},
            {"domain": "universal_laws", "length": 0},
            {"domain": "creative_expression", "length": 0},
            {"domain": "social_connection", "length": 0}
        ]
    },
    "trunk": {
        "thickness": 1,
        "stability": 1
    },
    "branches_and_leaves": {
        "total_leaves": 0
    },
    "fruits": [],
    "last_updated": null
}'::jsonb;

-- 3. 创建自动化触发器
-- 创建触发器函数，为新用户自动初始化成长档案
CREATE OR REPLACE FUNCTION public.handle_new_user_exploration_record()
RETURNS TRIGGER AS $$
BEGIN
    -- 在 user_domain_exploration 表中为新用户插入一行初始数据
    INSERT INTO public.user_domain_exploration (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 将触发器绑定到 profiles 表
DROP TRIGGER IF EXISTS on_profile_created_exploration ON public.profiles;
CREATE TRIGGER on_profile_created_exploration
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_exploration_record();

-- 4. 创建数据库函数 (RPC): update_exploration_and_tree_view
-- 这个函数是保证数据一致性的关键，它将所有写操作封装在一个原子事务中
CREATE OR REPLACE FUNCTION public.update_exploration_and_tree_view(
    p_user_id UUID,
    p_growth_scores_json JSONB
)
RETURNS JSONB AS $$
DECLARE
    current_scores JSONB;
    new_scores JSONB;
    tree_view JSONB;
    growth_result JSONB;
BEGIN
    -- 在一个事务中执行所有操作

    -- 1. 更新"事实数据源" (user_domain_exploration)
    -- 获取当前分数
    SELECT domain_scores INTO current_scores
    FROM public.user_domain_exploration
    WHERE user_id = p_user_id;

    -- 如果用户不存在探索记录，先创建
    IF current_scores IS NULL THEN
        INSERT INTO public.user_domain_exploration (user_id)
        VALUES (p_user_id)
        ON CONFLICT (user_id) DO NOTHING;

        SELECT domain_scores INTO current_scores
        FROM public.user_domain_exploration
        WHERE user_id = p_user_id;
    END IF;

    -- 累加新的增长分数
    new_scores := jsonb_build_object(
        'self_awareness', jsonb_build_object(
            'depth_score',
            COALESCE((current_scores->'self_awareness'->>'depth_score')::int, 0) +
            COALESCE((p_growth_scores_json->>'self_awareness_growth')::int, 0)
        ),
        'life_sciences', jsonb_build_object(
            'depth_score',
            COALESCE((current_scores->'life_sciences'->>'depth_score')::int, 0) +
            COALESCE((p_growth_scores_json->>'life_sciences_growth')::int, 0)
        ),
        'universal_laws', jsonb_build_object(
            'depth_score',
            COALESCE((current_scores->'universal_laws'->>'depth_score')::int, 0) +
            COALESCE((p_growth_scores_json->>'universal_laws_growth')::int, 0)
        ),
        'creative_expression', jsonb_build_object(
            'depth_score',
            COALESCE((current_scores->'creative_expression'->>'depth_score')::int, 0) +
            COALESCE((p_growth_scores_json->>'creative_expression_growth')::int, 0)
        ),
        'social_connection', jsonb_build_object(
            'depth_score',
            COALESCE((current_scores->'social_connection'->>'depth_score')::int, 0) +
            COALESCE((p_growth_scores_json->>'social_connection_growth')::int, 0)
        )
    );

    -- 更新探索记录
    UPDATE public.user_domain_exploration
    SET
        domain_scores = new_scores,
        last_evaluated_at = now(),
        total_evaluations = total_evaluations + 1,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- 2. 重新生成"视觉视图" (consciousness_tree_view)
    -- 根据最新的总分，应用视觉转换公式
    tree_view := jsonb_build_object(
        'roots', jsonb_build_object(
            'main_roots', jsonb_build_array(
                jsonb_build_object(
                    'domain', 'self_awareness',
                    'length', GREATEST(0, (new_scores->'self_awareness'->>'depth_score')::int * 0.5)
                ),
                jsonb_build_object(
                    'domain', 'life_sciences',
                    'length', GREATEST(0, (new_scores->'life_sciences'->>'depth_score')::int * 0.5)
                ),
                jsonb_build_object(
                    'domain', 'universal_laws',
                    'length', GREATEST(0, (new_scores->'universal_laws'->>'depth_score')::int * 0.5)
                ),
                jsonb_build_object(
                    'domain', 'creative_expression',
                    'length', GREATEST(0, (new_scores->'creative_expression'->>'depth_score')::int * 0.5)
                ),
                jsonb_build_object(
                    'domain', 'social_connection',
                    'length', GREATEST(0, (new_scores->'social_connection'->>'depth_score')::int * 0.5)
                )
            )
        ),
        'trunk', jsonb_build_object(
            'thickness', GREATEST(1, (
                (new_scores->'self_awareness'->>'depth_score')::int +
                (new_scores->'life_sciences'->>'depth_score')::int +
                (new_scores->'universal_laws'->>'depth_score')::int +
                (new_scores->'creative_expression'->>'depth_score')::int +
                (new_scores->'social_connection'->>'depth_score')::int
            ) / 50),
            'stability', LEAST(10, GREATEST(1, (
                (new_scores->'self_awareness'->>'depth_score')::int +
                (new_scores->'life_sciences'->>'depth_score')::int +
                (new_scores->'universal_laws'->>'depth_score')::int +
                (new_scores->'creative_expression'->>'depth_score')::int +
                (new_scores->'social_connection'->>'depth_score')::int
            ) / 20))
        ),
        'branches_and_leaves', jsonb_build_object(
            'total_leaves', (
                (new_scores->'self_awareness'->>'depth_score')::int +
                (new_scores->'life_sciences'->>'depth_score')::int +
                (new_scores->'universal_laws'->>'depth_score')::int +
                (new_scores->'creative_expression'->>'depth_score')::int +
                (new_scores->'social_connection'->>'depth_score')::int
            ) / 5
        ),
        'fruits', '[]'::jsonb,
        'last_updated', to_jsonb(now())
    );

    -- 3. 更新profiles表
    UPDATE public.profiles
    SET consciousness_tree_view = tree_view
    WHERE id = p_user_id;

    -- 返回处理结果
    growth_result := jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'previous_scores', current_scores,
        'new_scores', new_scores,
        'growth_applied', p_growth_scores_json,
        'tree_view', tree_view,
        'timestamp', now()
    );

    RETURN growth_result;

EXCEPTION WHEN OTHERS THEN
    -- 如果出错，返回错误信息
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_domain_exploration_user_id ON public.user_domain_exploration(user_id);
CREATE INDEX IF NOT EXISTS idx_user_domain_exploration_last_evaluated ON public.user_domain_exploration(last_evaluated_at);
CREATE INDEX IF NOT EXISTS idx_user_domain_exploration_domain_scores ON public.user_domain_exploration USING GIN(domain_scores);

-- 6. 设置Row Level Security (RLS)
ALTER TABLE public.user_domain_exploration ENABLE ROW LEVEL SECURITY;

-- RLS策略：用户只能查看和修改自己的探索记录
CREATE POLICY "Users can view their own exploration records" ON public.user_domain_exploration
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own exploration records" ON public.user_domain_exploration
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exploration records" ON public.user_domain_exploration
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. 授予必要的权限
GRANT SELECT, UPDATE ON public.user_domain_exploration TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_exploration_and_tree_view(UUID, JSONB) TO authenticated;

-- 8. 为现有用户初始化探索记录
INSERT INTO public.user_domain_exploration (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 9. 创建评论
COMMENT ON TABLE public.user_domain_exploration IS '学员领域探索记录表，存储五个核心领域的累积深度分数';
COMMENT ON FUNCTION public.update_exploration_and_tree_view(UUID, JSONB) IS 'AI评估后更新探索记录和意识树视图的原子操作函数';

-- 迁移完成通知
DO $$
BEGIN
    RAISE NOTICE '意识树系统迁移完成！';
    RAISE NOTICE '- 创建了user_domain_exploration表作为事实数据源';
    RAISE NOTICE '- 更新了profiles表的consciousness_tree_view字段';
    RAISE NOTICE '- 创建了自动化触发器和RPC函数';
    RAISE NOTICE '- 为现有用户初始化了探索记录';
END $$;