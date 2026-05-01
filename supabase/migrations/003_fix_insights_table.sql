-- 修复 insights 表 - 如果表不存在则创建
DO $$ 
BEGIN
    -- 检查表是否存在
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'insights') THEN
        -- 创建 insights 表
        CREATE TABLE public.insights (
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
        CREATE INDEX idx_insights_user_id ON public.insights(user_id);
        CREATE INDEX idx_insights_visibility ON public.insights(visibility);
        CREATE INDEX idx_insights_status ON public.insights(status);
        CREATE INDEX idx_insights_created_at ON public.insights(created_at DESC);
        CREATE INDEX idx_insights_tags ON public.insights USING GIN(tags);

        -- 启用 RLS
        ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

        -- 创建 RLS 策略
        CREATE POLICY "Users can view their own insights" ON public.insights
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Anyone can view public insights" ON public.insights
            FOR SELECT USING (visibility = 'public' AND status = 'published');

        CREATE POLICY "Users can create their own insights" ON public.insights
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own insights" ON public.insights
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own insights" ON public.insights
            FOR DELETE USING (auth.uid() = user_id);

        RAISE NOTICE 'insights 表创建成功';
    ELSE
        RAISE NOTICE 'insights 表已存在';
    END IF;
END $$;

