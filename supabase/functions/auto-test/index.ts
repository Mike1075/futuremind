import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testType, url, moduleId } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let testResult = {
      success: false,
      message: '',
      details: {},
      executionTime: 0
    }

    const startTime = Date.now()

    switch (testType) {
      case 'page_load':
        testResult = await testPageLoad(url)
        break
      case 'api_health':
        testResult = await testApiHealth(url)
        break
      case 'performance':
        testResult = await testPerformance(url)
        break
      default:
        testResult = {
          success: false,
          message: 'Unknown test type',
          details: {},
          executionTime: 0
        }
    }

    testResult.executionTime = Date.now() - startTime

    // 记录测试结果到数据库
    if (moduleId) {
      await supabaseClient
        .from('test_records')
        .insert([{
          test_case_id: moduleId,
          status: testResult.success ? 'passed' : 'failed',
          actual_result: testResult.message,
          notes: JSON.stringify(testResult.details),
          tester_name: 'Auto Test System',
          execution_time: testResult.executionTime
        }])
    }

    return new Response(
      JSON.stringify(testResult),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})

async function testPageLoad(url: string) {
  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Supabase-Edge-Function-Test'
      }
    })
    const loadTime = Date.now() - startTime

    const success = response.ok && loadTime < 5000
    
    return {
      success,
      message: success ? 'Page loaded successfully' : 'Page load failed or too slow',
      details: {
        status: response.status,
        loadTime,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      },
      executionTime: loadTime
    }
  } catch (error) {
    return {
      success: false,
      message: `Page load test failed: ${error.message}`,
      details: { error: error.message },
      executionTime: 0
    }
  }
}

async function testApiHealth(url: string) {
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    const success = response.ok && data.success === true
    
    return {
      success,
      message: success ? 'API health check passed' : 'API health check failed',
      details: {
        status: response.status,
        responseData: data
      },
      executionTime: 0
    }
  } catch (error) {
    return {
      success: false,
      message: `API health test failed: ${error.message}`,
      details: { error: error.message },
      executionTime: 0
    }
  }
}

async function testPerformance(url: string) {
  try {
    const tests = []
    
    // 执行多次请求测试性能
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now()
      const response = await fetch(url)
      const loadTime = Date.now() - startTime
      tests.push({
        attempt: i + 1,
        loadTime,
        status: response.status
      })
    }

    const avgLoadTime = tests.reduce((sum, test) => sum + test.loadTime, 0) / tests.length
    const success = avgLoadTime < 3000 && tests.every(test => test.status === 200)

    return {
      success,
      message: success ? 'Performance test passed' : 'Performance test failed',
      details: {
        averageLoadTime: avgLoadTime,
        tests,
        threshold: 3000
      },
      executionTime: 0
    }
  } catch (error) {
    return {
      success: false,
      message: `Performance test failed: ${error.message}`,
      details: { error: error.message },
      executionTime: 0
    }
  }
}