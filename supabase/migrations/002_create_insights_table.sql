-- 创建 insights 表
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'guild')),
    guild_id UUID REFERENCES public.explorer_guilds(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON public.insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_visibility ON public.insights(visibility);
CREATE INDEX IF NOT EXISTS idx_insights_status ON public.insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_guild_id ON public.insights(guild_id);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON public.insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_tags ON public.insights USING GIN(tags);

-- 启用 RLS
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己的所有洞见
CREATE POLICY "Users can view their own insights" ON public.insights
    FOR SELECT USING (auth.uid() = user_id);

-- RLS 策略：用户可以查看公开的洞见
CREATE POLICY "Anyone can view public insights" ON public.insights
    FOR SELECT USING (visibility = 'public' AND status = 'published');

-- RLS 策略：用户可以查看同联盟的洞见（如果设置了 guild 可见性）
CREATE POLICY "Users can view guild insights" ON public.insights
    FOR SELECT USING (
        visibility = 'guild' 
        AND status = 'published' 
        AND guild_id IN (
            SELECT guild_id FROM public.guild_members 
            WHERE user_id = auth.uid()
        )
    );

-- RLS 策略：用户可以创建自己的洞见
CREATE POLICY "Users can create their own insights" ON public.insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户可以更新自己的洞见
CREATE POLICY "Users can update their own insights" ON public.insights
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS 策略：用户可以删除自己的洞见
CREATE POLICY "Users can delete their own insights" ON public.insights
    FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insights_updated_at 
    BEFORE UPDATE ON public.insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
