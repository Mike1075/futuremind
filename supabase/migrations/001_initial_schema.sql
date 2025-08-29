-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    consciousness_level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seasons table
CREATE TABLE IF NOT EXISTS public.seasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    current_day INTEGER DEFAULT 1,
    completed_tasks TEXT[] DEFAULT '{}',
    consciousness_growth INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, season_id)
);

-- Create gaia_conversations table
CREATE TABLE IF NOT EXISTS public.gaia_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pbl_projects table
CREATE TABLE IF NOT EXISTS public.pbl_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_participants table
CREATE TABLE IF NOT EXISTS public.project_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.pbl_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'leader', 'mentor')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pbl_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for user_progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for gaia_conversations
CREATE POLICY "Users can view their own conversations" ON public.gaia_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.gaia_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.gaia_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for seasons (public read)
CREATE POLICY "Anyone can view seasons" ON public.seasons
    FOR SELECT USING (true);

-- Create policies for pbl_projects (public read)
CREATE POLICY "Anyone can view projects" ON public.pbl_projects
    FOR SELECT USING (true);

-- Create policies for project_participants
CREATE POLICY "Users can view project participants" ON public.project_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join projects" ON public.project_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave projects" ON public.project_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial season data
INSERT INTO public.seasons (title, description, start_date, end_date, is_active) VALUES
(
    '第一季：声音的交响',
    '一场关于声音、寂静与实相的旅程。探索声音如何连接我们与宇宙的深层智慧。',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    true
) ON CONFLICT DO NOTHING;

-- Insert initial PBL project
INSERT INTO public.pbl_projects (title, description, season_id) VALUES
(
    '伊卡洛斯行动：无形的纽带',
    '探索意识与物质之间的神秘连接。通过集体实验和深度对话，我们将一起研究意念如何影响现实。',
    (SELECT id FROM public.seasons WHERE title = '第一季：声音的交响' LIMIT 1)
) ON CONFLICT DO NOTHING;
