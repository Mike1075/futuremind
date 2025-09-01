import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 使用已导入的supabase实例
    
    const { data, error } = await supabase
      .from('project_modules')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ modules: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { module_id, preview_url } = body

    if (!module_id) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    // 使用已导入的supabase实例
    
    const { data, error } = await supabase
      .from('project_modules')
      .upsert({
        module_id,
        preview_url: preview_url || '',
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}