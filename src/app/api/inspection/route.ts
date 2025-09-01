import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const { module_id, results } = await request.json()

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 计算总分
    const totalScore = results.reduce((sum: number, result: any) => sum + result.score, 0) / results.length

    // 创建检测记录
    const { data: record, error: recordError } = await supabase
      .from('inspection_records')
      .insert({
        module_id,
        inspector_id: user.id,
        overall_score: totalScore,
        status: 'completed'
      })
      .select()
      .single() as { data: any, error: any }

    if (recordError) {
      console.error('Error creating inspection record:', recordError)
      return NextResponse.json({ error: recordError.message }, { status: 500 })
    }

    // 插入详细结果
    const detailResults = results.map((result: any) => ({
      record_id: record.id,
      criteria_id: result.criteria_id,
      score: result.score,
      passed: result.score >= result.pass_threshold,
      notes: result.notes,
      evidence_url: result.evidence_url
    }))

    const { error: resultsError } = await supabase
      .from('inspection_results')
      .insert(detailResults)

    if (resultsError) {
      console.error('Error saving inspection results:', resultsError)
      return NextResponse.json({ error: resultsError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      record_id: record.id, 
      overall_score: totalScore,
      message: 'Inspection completed successfully' 
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const moduleId = searchParams.get('module_id')
  
  try {
    let query = supabase
      .from('inspection_records')
      .select(`
        *,
        project_modules(name, module_type),
        inspection_results(
          *,
          inspection_criteria(criteria_name, criteria_description)
        )
      `)
      .order('created_at', { ascending: false })

    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data: records, error } = await query

    if (error) {
      console.error('Error fetching inspection records:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}