import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { testType, url, moduleId } = await request.json()

    // 调用Supabase Edge Function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auto-test`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        testType,
        url,
        moduleId
      })
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      testResult: result
    })

  } catch (error) {
    console.error('Auto test execution error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  // 获取可用的测试类型
  return NextResponse.json({
    availableTests: [
      {
        type: 'page_load',
        name: '页面加载测试',
        description: '测试页面加载时间和响应状态'
      },
      {
        type: 'api_health',
        name: 'API健康检查',
        description: '检查API端点的可用性'
      },
      {
        type: 'performance',
        name: '性能测试',
        description: '多次请求测试平均响应时间'
      }
    ]
  })
}