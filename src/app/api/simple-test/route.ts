import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 测试最基本的连接
    const { data, error } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      hasSession: !!data.session,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}