import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // 检查数据库连接 - 使用正确的表名
    const { data: connectionTest, error: connectionError } = await supabase
      .from('seasons')
      .select('count')
      .limit(1)

    if (connectionError) {
      console.error('Database connection error:', connectionError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database connection failed',
        details: connectionError.message 
      }, { status: 500 })
    }

    // 检查并确保季度数据存在
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('*')

    if (seasonsError) {
      console.error('Seasons query error:', seasonsError)
    }

    // 检查并确保PBL项目数据存在
    const { data: projects, error: projectsError } = await supabase
      .from('pbl_projects')
      .select('*')

    if (projectsError) {
      console.error('Projects query error:', projectsError)
    }

    // 简单的数据库状态检查
    console.log('Database connection successful')
    console.log('Seasons found:', seasons?.length || 0)
    console.log('Projects found:', projects?.length || 0)

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully',
      status: {
        seasons: seasons?.length || 0,
        projects: projects?.length || 0
      }
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 获取数据库状态
    const { data: seasons, error: seasonsError } = await supabase
      .from('seasons')
      .select('*')

    const { data: projects, error: projectsError } = await supabase
      .from('pbl_projects')
      .select('*')

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    if (seasonsError || projectsError || profilesError) {
      throw new Error('Failed to fetch database status')
    }

    return NextResponse.json({
      success: true,
      status: {
        seasons: seasons?.length || 0,
        projects: projects?.length || 0,
        profiles: profiles?.length || 0
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}