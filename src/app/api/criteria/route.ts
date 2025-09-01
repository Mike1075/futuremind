import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const moduleType = searchParams.get('module_type')
  
  try {
    let query = supabase
      .from('inspection_criteria')
      .select('*')
      .order('criteria_name', { ascending: true })

    if (moduleType) {
      query = query.eq('module_type', moduleType)
    }

    const { data: criteria, error } = await query

    if (error) {
      console.error('Error fetching criteria:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ criteria })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}