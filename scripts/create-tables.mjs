import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔗 Connecting to Supabase:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTables() {
  console.log('\n📊 Creating tables using Supabase REST API...\n')

  // We'll use the REST API endpoint to execute raw SQL
  // Supabase exposes a query endpoint at /rest/v1/rpc/

  const projectRef = 'lvjezsnwesyblnlkkirz'
  const apiUrl = `https://${projectRef}.supabase.co`

  // List of SQL statements to execute
  const sqlStatements = [
    {
      name: 'Create lessons table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.lessons (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          course_system TEXT NOT NULL,
          day_number INTEGER NOT NULL,
          title TEXT,
          original_text TEXT,
          deep_interpretation TEXT,
          meditation_guide TEXT,
          life_practice TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create index on lessons.course_system',
      sql: 'CREATE INDEX IF NOT EXISTS idx_lessons_course_system ON public.lessons(course_system);'
    },
    {
      name: 'Create index on lessons.day_number',
      sql: 'CREATE INDEX IF NOT EXISTS idx_lessons_day_number ON public.lessons(day_number);'
    },
    {
      name: 'Create media_resources table',
      sql: `
        CREATE TABLE IF NOT EXISTS public.media_resources (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT,
          file_size BIGINT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'Create index on media_resources.lesson_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_media_lesson_id ON public.media_resources(lesson_id);'
    },
    {
      name: 'Enable RLS on lessons',
      sql: 'ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Enable RLS on media_resources',
      sql: 'ALTER TABLE public.media_resources ENABLE ROW LEVEL SECURITY;'
    },
    {
      name: 'Policy: Anyone can view lessons',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Anyone can view lessons'
          ) THEN
            CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);
          END IF;
        END $$;
      `
    },
    {
      name: 'Policy: Authenticated users can insert lessons',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Authenticated users can insert lessons'
          ) THEN
            CREATE POLICY "Authenticated users can insert lessons" ON public.lessons
              FOR INSERT WITH CHECK (auth.role() = 'authenticated');
          END IF;
        END $$;
      `
    },
    {
      name: 'Policy: Authenticated users can update lessons',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Authenticated users can update lessons'
          ) THEN
            CREATE POLICY "Authenticated users can update lessons" ON public.lessons
              FOR UPDATE USING (auth.role() = 'authenticated');
          END IF;
        END $$;
      `
    },
    {
      name: 'Policy: Authenticated users can delete lessons',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Authenticated users can delete lessons'
          ) THEN
            CREATE POLICY "Authenticated users can delete lessons" ON public.lessons
              FOR DELETE USING (auth.role() = 'authenticated');
          END IF;
        END $$;
      `
    },
    {
      name: 'Policy: Anyone can view media resources',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'media_resources' AND policyname = 'Anyone can view media resources'
          ) THEN
            CREATE POLICY "Anyone can view media resources" ON public.media_resources FOR SELECT USING (true);
          END IF;
        END $$;
      `
    },
    {
      name: 'Policy: Authenticated users can insert media',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'media_resources' AND policyname = 'Authenticated users can insert media'
          ) THEN
            CREATE POLICY "Authenticated users can insert media" ON public.media_resources
              FOR INSERT WITH CHECK (auth.role() = 'authenticated');
          END IF;
        END $$;
      `
    },
    {
      name: 'Policy: Authenticated users can delete media',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'media_resources' AND policyname = 'Authenticated users can delete media'
          ) THEN
            CREATE POLICY "Authenticated users can delete media" ON public.media_resources
              FOR DELETE USING (auth.role() = 'authenticated');
          END IF;
        END $$;
      `
    }
  ]

  let successCount = 0
  let failCount = 0

  for (const { name, sql } of sqlStatements) {
    try {
      console.log(`⏳ ${name}...`)

      const response = await fetch(`${apiUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: sql })
      })

      if (response.ok || response.status === 201) {
        console.log(`✅ ${name}`)
        successCount++
      } else {
        const error = await response.text()
        console.error(`❌ ${name} - Status ${response.status}:`, error)
        failCount++
      }
    } catch (error) {
      console.error(`❌ ${name} - Error:`, error.message)
      failCount++
    }
  }

  console.log(`\n📈 Results: ${successCount} succeeded, ${failCount} failed`)

  // Insert sample data
  console.log('\n📝 Inserting sample lesson data...')

  try {
    const { data, error } = await supabase
      .from('lessons')
      .upsert([
        {
          course_system: '自在聆听',
          day_number: 1,
          title: '第1天：自在地聆听',
          original_text: '你可曾安静地坐着，既不专注于任何事物，也不费劲地集中注意力，而是非常安详地坐在那里？这时你就会听到各式各样的声响……',
          deep_interpretation: '克里希那穆提以最简单、最直接的日常经验——"聆听"——作为365天智慧之旅的开端，这并非偶然。因为"自在地聆听"正是他所有教诲的核心基石：不带选择的觉察 (Choiceless Awareness)。',
          meditation_guide: '现在，让我们开始……首先，将意识带到你的身体。感受身体与椅子或坐垫接触的感觉……',
          life_practice: '在一天中，选择2-3个过渡的时刻进行"声音暂停"。例如：从办公桌起身去接水时；在等红绿灯时；在泡茶或咖啡等待时。'
        },
        {
          course_system: '自在聆听',
          day_number: 2,
          title: '第2天：放下心中的障碍',
          original_text: '你以何种方式在听？是不是透过自己的企图、欲望、恐惧、焦虑和各种的投射在听？',
          deep_interpretation: '',
          meditation_guide: '',
          life_practice: ''
        },
        {
          course_system: '自在聆听',
          day_number: 3,
          title: '第3天',
          original_text: '',
          deep_interpretation: '',
          meditation_guide: '',
          life_practice: ''
        },
        {
          course_system: '自在聆听',
          day_number: 4,
          title: '第4天',
          original_text: '',
          deep_interpretation: '',
          meditation_guide: '',
          life_practice: ''
        },
        {
          course_system: '自在聆听',
          day_number: 5,
          title: '第5天',
          original_text: '',
          deep_interpretation: '',
          meditation_guide: '',
          life_practice: ''
        }
      ], {
        onConflict: 'course_system,day_number',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('❌ Failed to insert sample data:', error.message)
    } else {
      console.log('✅ Sample lesson data inserted successfully')
    }
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message)
  }

  console.log('\n✨ Migration completed!')
}

createTables().catch(console.error)
