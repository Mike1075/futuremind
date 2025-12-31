// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// 创建上传速率限制器
const uploadLimiter = rateLimit(rateLimitConfigs.upload)

/**
 * POST /api/aip/upload-document
 * AIP文档上传API - 代理到N8N webhook处理
 * 支持审核功能：普通成员上传的文件需要发起人/管理员审核
 */
export async function POST(request: NextRequest) {
  // 检查速率限制
  const limitResult = await uploadLimiter(request)
  if (limitResult instanceof NextResponse) {
    return limitResult
  }

  try {
    // 1. 验证用户身份
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 获取FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string
    const title = formData.get('title') as string

    if (!file || !projectId || !title) {
      return NextResponse.json({
        error: 'Missing required fields: file, project_id, or title'
      }, { status: 400 })
    }

    // 3. 检查用户在项目中的角色
    const { data: membership } = await supabase
      .from('project_members')
      .select('role_in_project')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: '您不是该项目成员' }, { status: 403 })
    }

    const isManagerOrOwner = membership.role_in_project === 'owner' || membership.role_in_project === 'manager'
    // 管理员/发起人上传自动通过，普通成员需要审核
    const reviewStatus = isManagerOrOwner ? 'approved' : 'pending'

    logger.info('[AIP Upload] 接收到上传请求', {
      filename: file.name,
      size: file.size,
      type: file.type,
      project_id: projectId,
      user_id: user.id,
      title,
      role: membership.role_in_project,
      review_status: reviewStatus
    })

    // 4. 只有已通过审核的文件才发送到N8N处理（进入知识库）
    if (reviewStatus === 'approved') {
      const n8nFormData = new FormData()
      n8nFormData.append('file', file)
      n8nFormData.append('project_id', projectId)
      n8nFormData.append('user_id', user.id)
      n8nFormData.append('title', title)

      // SEC-03: N8N webhook URL必须通过环境变量配置
      // 探索者联盟使用专用的 AIP 上传 webhook
      const webhookUrl = process.env.N8N_AIP_UPLOAD_WEBHOOK
      if (!webhookUrl) {
        logger.error('[AIP Upload] N8N_AIP_UPLOAD_WEBHOOK环境变量未配置')
        return NextResponse.json({ error: 'Service configuration error' }, { status: 503 })
      }

      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        body: n8nFormData
      })

      const responseText = await n8nResponse.text()
      logger.info('[AIP Upload] N8N响应', {
        status: n8nResponse.status,
        ok: n8nResponse.ok,
        response: responseText.substring(0, 500) // 只记录前500字符
      })

      // 注意：N8N 使用 lastNode 模式时，即使工作流成功，
      // 向量存储节点的响应可能不是标准 HTTP 格式
      // 所以我们只在明确的错误状态码时才报错
      if (n8nResponse.status >= 400 && n8nResponse.status < 500) {
        logger.error('[AIP Upload] N8N返回客户端错误', { response: responseText })
        return NextResponse.json({
          error: 'Processing failed - invalid request'
        }, { status: 500 })
      }
    }

    // 5. 在 project_files 表中记录原始文件信息（包含审核状态）
    const { data: fileRecord, error: insertError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        user_id: user.id,
        title: title,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        review_status: reviewStatus,
        // 如果自动通过，记录审核信息
        ...(reviewStatus === 'approved' ? {
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        } : {})
      } as any)  // 使用 any 绕过类型检查（新字段在数据库中已存在）
      .select()
      .single()

    if (insertError) {
      logger.error('[AIP Upload] 记录文件信息失败', insertError)
      return NextResponse.json({ error: '保存文件记录失败' }, { status: 500 })
    }

    // 6. 如果是待审核文件，发送通知给项目管理员
    if (reviewStatus === 'pending') {
      // 获取上传者名称
      const { data: uploaderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // 获取项目信息
      const { data: project } = await supabase
        .from('projects')
        .select('name, creator_id')
        .eq('id', projectId)
        .single()

      // 获取所有管理员
      const { data: managers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .in('role_in_project', ['owner', 'manager'])

      if (managers && managers.length > 0) {
        const uploaderName = uploaderProfile?.full_name || '项目成员'
        const projectName = project?.name || '项目'

        // 为每个管理员创建通知
        const notifications = managers.map(manager => ({
          user_id: manager.user_id,
          type: 'file_review_request',
          title: '新文档待审核',
          message: `${uploaderName} 在「${projectName}」中上传了文档「${title}」，请审核`,
          is_read: false,
          metadata: {
            project_id: projectId,
            file_id: fileRecord?.id,
            uploader_id: user.id,
            file_title: title
          }
        }))

        const { error: notifyError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notifyError) {
          logger.error('[AIP Upload] 发送通知失败', notifyError)
          // 不影响上传成功
        }
      }
    }

    // 7. 返回成功响应
    return NextResponse.json({
      success: true,
      message: reviewStatus === 'approved' ? '文档上传成功' : '文档已提交，等待审核',
      filename: file.name,
      review_status: reviewStatus
    })

  } catch (error) {
    logger.error('[AIP Upload] 上传失败', error)
    return NextResponse.json({
      error: 'Upload failed'
    }, { status: 500 })
  }
}
