import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 使用服务角色密钥来执行管理操作
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('Starting database migration...')

    // 执行迁移SQL
    const migrationSQL = `
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
    `

    // 执行迁移
    const { error: migrationError } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (migrationError) {
      console.error('Migration error:', migrationError)
      // 如果RPC不可用，尝试直接执行
      return NextResponse.json({
        success: false,
        error: 'Migration failed - please run migrations manually in Supabase dashboard',
        details: migrationError.message,
        sql: migrationSQL
      }, { status: 500 })
    }

    // 插入初始数据
    const { error: seasonError } = await supabaseAdmin
      .from('seasons')
      .upsert([{
        title: '第一季：声音的交响',
        description: '一场关于声音、寂静与实相的旅程。探索声音如何连接我们与宇宙的深层智慧。',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
      }], { onConflict: 'title' })

    if (seasonError) {
      console.error('Season insert error:', seasonError)
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}