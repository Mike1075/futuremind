import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('[AIP Chat] 未授权访问')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[AIP Chat] 用户:', user.id, user.email)

    const body = await request.json()
    const { chatInput, project_id, organization_id } = body

    console.log('[AIP Chat] 请求参数:', {
      chatInput: chatInput?.substring(0, 100) + (chatInput?.length > 100 ? '...' : ''),
      project_id,
      organization_id,
      user_id: user.id
    })

    if (!chatInput) {
      console.error('[AIP Chat] 缺少chatInput参数')
      return NextResponse.json({ error: 'Missing chatInput' }, { status: 400 })
    }

    // N8N webhook URL - 使用生产环境
    const webhookUrl = 'https://n8n.aifunbox.com/webhook/c3585e19-255f-48ed-a481-b0c4d1c748ac'

    // 直接传递project_id，N8N可以处理字符串或数组
    // 如果project_id是空数组，转换为空字符串
    let projectIdValue: string | string[] = ''
    if (project_id) {
      if (Array.isArray(project_id)) {
        projectIdValue = project_id.length > 0 ? project_id : ''
      } else {
        projectIdValue = project_id
      }
    }

    const n8nPayload = {
      chatInput,
      user_id: user.id,
      project_id: projectIdValue,  // 直接传递数组或字符串
      organization_id: organization_id || ''
    }

    console.log('[AIP Chat] 调用N8N webhook:', webhookUrl)
    console.log('[AIP Chat] N8N payload:', JSON.stringify(n8nPayload, null, 2))

    const n8nStartTime = Date.now()
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload)
    })

    const n8nDuration = Date.now() - n8nStartTime
    console.log('[AIP Chat] N8N响应时间:', n8nDuration, 'ms')
    console.log('[AIP Chat] N8N响应状态:', n8nResponse.status, n8nResponse.statusText)

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text()
      console.error('[AIP Chat] N8N webhook失败:', {
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
        body: errorText
      })

      // 特殊处理404错误 - webhook未注册
      if (n8nResponse.status === 404) {
        let errorMessage = 'N8N webhook未注册或已过期'
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.hint) {
            errorMessage += `\n提示: ${errorData.hint}`
          }
        } catch {}
        throw new Error(`N8N webhook 404错误: ${errorMessage}`)
      }

      throw new Error(`N8N webhook失败 (${n8nResponse.status}): ${errorText}`)
    }

    const responseText = await n8nResponse.text()
    console.log('[AIP Chat] N8N原始响应:', responseText.substring(0, 500))

    let n8nData
    try {
      n8nData = JSON.parse(responseText)
      console.log('[AIP Chat] N8N解析后的数据:', JSON.stringify(n8nData, null, 2).substring(0, 500))
    } catch (parseError) {
      console.error('[AIP Chat] N8N响应JSON解析失败:', parseError)
      console.error('[AIP Chat] 原始响应内容:', responseText)
      throw new Error('N8N返回的不是有效的JSON格式')
    }

    // 提取AI响应 - 尝试多个可能的字段名
    const aiResponse = n8nData.ai_content || n8nData.response || n8nData.output || n8nData.text || n8nData.message
    console.log('[AIP Chat] AI响应内容:', aiResponse?.substring(0, 200))

    // 保存聊天记录到数据库
    console.log('[AIP Chat] 开始保存聊天记录到数据库...')
    const { error: dbError } = await supabase.from('chat_history').insert({
      user_id: user.id,
      content: chatInput,
      role: 'user',
      agent_type: 'member',  // 默认使用member类型
      project_id: Array.isArray(project_id) ? project_id[0] || null : project_id || null,
      ai_content: aiResponse || JSON.stringify(n8nData),
      metadata: {
        organization_id,
        project_ids: project_id,
        n8n_raw_response: n8nData
      }
    })

    if (dbError) {
      console.error('[AIP Chat] 保存聊天记录失败:', dbError)
      // 不阻断流程，继续返回响应
    } else {
      console.log('[AIP Chat] 聊天记录保存成功')
    }

    const totalDuration = Date.now() - startTime
    console.log('[AIP Chat] 总处理时间:', totalDuration, 'ms')

    const finalResponse = aiResponse || '收到您的消息，但AI未返回有效响应'
    console.log('[AIP Chat] 返回给客户端的响应:', finalResponse.substring(0, 100))

    return NextResponse.json({
      response: finalResponse,
      metadata: {
        duration: totalDuration,
        n8n_duration: n8nDuration,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[AIP Chat] ❌ 处理失败 (耗时', totalDuration, 'ms):', error)
    console.error('[AIP Chat] 错误堆栈:', error.stack)

    return NextResponse.json(
      {
        error: 'Failed to process chat',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
