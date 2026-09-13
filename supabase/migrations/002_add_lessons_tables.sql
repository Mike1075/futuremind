-- 创建 lessons 表（课程内容表）
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_system TEXT NOT NULL,  -- 课程体系名称（如：自在聆听、欢迎来到地球、伊卡洛斯计划）
  day_number INTEGER NOT NULL,  -- 第几天
  title TEXT,                   -- 标题
  original_text TEXT,           -- 原文摘录
  deep_interpretation TEXT,     -- 深度解读
  meditation_guide TEXT,        -- 冥想练习与引导
  life_practice TEXT,           -- 生活中的小练习
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_lessons_course_system ON public.lessons(course_system);
CREATE INDEX IF NOT EXISTS idx_lessons_day_number ON public.lessons(day_number);

-- 创建 media_resources 表（媒体资源表）
CREATE TABLE IF NOT EXISTS public.media_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_media_lesson_id ON public.media_resources(lesson_id);

-- Enable Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for lessons (管理员可以管理，所有人可以查看)
CREATE POLICY "Anyone can view lessons" ON public.lessons
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert lessons" ON public.lessons
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update lessons" ON public.lessons
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete lessons" ON public.lessons
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for media_resources
CREATE POLICY "Anyone can view media resources" ON public.media_resources
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert media" ON public.media_resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete media" ON public.media_resources
    FOR DELETE USING (auth.role() = 'authenticated');

-- 插入自在聆听课程的示例数据
INSERT INTO public.lessons (course_system, day_number, title, original_text, deep_interpretation, meditation_guide, life_practice)
VALUES
  ('自在聆听', 1, '第1天：自在地聆听',
   '你可曾安静地坐着，既不专注于任何事物，也不费劲地集中注意力，而是非常安详地坐在那里？这时你就会听到各式各样的声响……',
   '克里希那穆提以最简单、最直接的日常经验——"聆听"——作为365天智慧之旅的开端，这并非偶然。因为"自在地聆听"正是他所有教诲的核心基石：不带选择的觉察 (Choiceless Awareness)。',
   '现在，让我们开始……首先，将意识带到你的身体。感受身体与椅子或坐垫接触的感觉……',
   '在一天中，选择2-3个过渡的时刻进行"声音暂停"。例如：从办公桌起身去接水时；在等红绿灯时；在泡茶或咖啡等待时。'
  ),
  ('自在聆听', 2, '第2天：放下心中的障碍',
   '你以何种方式在听？是不是透过自己的企图、欲望、恐惧、焦虑和各种的投射在听？',
   '',
   '',
   ''
  ),
  ('自在聆听', 3, '第3天',
   '',
   '',
   '',
   ''
  ),
  ('自在聆听', 4, '第4天',
   '',
   '',
   '',
   ''
  ),
  ('自在聆听', 5, '第5天',
   '',
   '',
   '',
   ''
  )
ON CONFLICT DO NOTHING;
