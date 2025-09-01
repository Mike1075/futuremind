-- 添加用户角色和小组管理功能
-- 扩展profiles表，添加用户角色
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student', 'guest'));

-- 创建小组表
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 20,
    current_members INTEGER DEFAULT 1,
    status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'completed', 'archived')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建小组成员表
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 创建小组申请表
CREATE TABLE IF NOT EXISTS public.group_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    UNIQUE(group_id, user_id)
);

-- 扩展pbl_projects表，添加创建者和更多字段
ALTER TABLE public.pbl_projects 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS estimated_duration TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建课程表
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB,
    instructor_id UUID REFERENCES public.profiles(id),
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    duration_hours INTEGER DEFAULT 1,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建课程注册表
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, user_id)
);

-- 启用行级安全
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 小组相关策略
CREATE POLICY "Anyone can view groups" ON public.groups
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Group creators can update their groups" ON public.groups
    FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Group creators can delete their groups" ON public.groups
    FOR DELETE USING (auth.uid() = creator_id);

-- 小组成员策略
CREATE POLICY "Anyone can view group members" ON public.group_members
    FOR SELECT USING (true);

CREATE POLICY "Group leaders can manage members" ON public.group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid() 
            AND gm.role = 'leader'
        )
    );

CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 小组申请策略
CREATE POLICY "Users can view applications for their groups" ON public.group_applications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM public.groups g 
            WHERE g.id = group_applications.group_id 
            AND g.creator_id = auth.uid()
        )
    );

CREATE POLICY "Users can create applications" ON public.group_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group creators can update applications" ON public.group_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.groups g 
            WHERE g.id = group_applications.group_id 
            AND g.creator_id = auth.uid()
        )
    );

-- 课程策略
CREATE POLICY "Anyone can view published courses" ON public.courses
    FOR SELECT USING (status = 'published' OR auth.uid() = instructor_id);

CREATE POLICY "Instructors and admins can create courses" ON public.courses
    FOR INSERT WITH CHECK (
        auth.uid() = instructor_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "Instructors and admins can update courses" ON public.courses
    FOR UPDATE USING (
        auth.uid() = instructor_id OR 
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- 课程注册策略
CREATE POLICY "Users can view their enrollments" ON public.course_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON public.course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their enrollment progress" ON public.course_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- 管理员策略：管理员可以查看和管理所有内容
CREATE POLICY "Admins can manage all groups" ON public.groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- 创建函数：更新小组成员数量
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.groups 
        SET current_members = current_members + 1,
            updated_at = NOW()
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.groups 
        SET current_members = current_members - 1,
            updated_at = NOW()
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_group_member_change ON public.group_members;
CREATE TRIGGER on_group_member_change
    AFTER INSERT OR DELETE ON public.group_members
    FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- 创建函数：自动将创建者添加为小组领导者
CREATE OR REPLACE FUNCTION public.add_group_creator_as_leader()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.creator_id, 'leader');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
    AFTER INSERT ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.add_group_creator_as_leader();

-- 插入默认管理员用户（需要手动设置）
-- 注意：这需要在有真实用户注册后手动执行
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@futuremind.com';

-- 插入示例课程数据
INSERT INTO public.courses (title, description, content, difficulty_level, duration_hours, tags, status) VALUES
(
    '意识觉醒基础',
    '探索意识的本质，了解觉醒的基本概念和实践方法',
    '{"modules": [{"title": "什么是意识", "content": "..."}, {"title": "觉醒的层次", "content": "..."}]}',
    1,
    2,
    ARRAY['基础', '意识', '觉醒'],
    'published'
),
(
    '冥想与内观',
    '深入学习冥想技巧，培养内观能力',
    '{"modules": [{"title": "冥想基础", "content": "..."}, {"title": "内观练习", "content": "..."}]}',
    2,
    3,
    ARRAY['冥想', '内观', '实践'],
    'published'
),
(
    '集体意识探索',
    '研究集体意识现象，参与群体觉醒实验',
    '{"modules": [{"title": "集体意识理论", "content": "..."}, {"title": "群体实验", "content": "..."}]}',
    3,
    4,
    ARRAY['集体意识', '实验', '高级'],
    'published'
) ON CONFLICT DO NOTHING;
