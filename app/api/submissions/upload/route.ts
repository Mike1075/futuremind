// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// 配置API路由以支持更大的请求体
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

// Next.js 15的路由配置
export const maxDuration = 60 // 最大执行时间60秒
export const dynamic = 'force-dynamic'

/**
 * POST /api/submissions/upload
 * 专门用于学生提交作业时上传附件（图片、文档等）
 * 返回格式：{ fileUrl, fileName }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 验证用户登录
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 验证文件类型：只允许图片
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!file.type.startsWith('image/') || !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `不支持的文件格式。只支持图片格式: JPG, PNG, GIF, WEBP` },
        { status: 400 }
      )
    }

    // 验证文件大小（10MB限制）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `submissions/${user.id}/${fileName}`

    logger.debug('[提交上传] 上传文件到Supabase Storage', { filePath })

    // 上传到Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      logger.error('[提交上传] 上传失败', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    logger.debug('[提交上传] 上传成功', { url: urlData.publicUrl })

    // 返回前端期望的格式
    return NextResponse.json(
      {
        fileUrl: urlData.publicUrl,
        fileName: file.name
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('[提交上传] API错误', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
