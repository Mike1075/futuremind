// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await request.json()

    logger.debug('收到文本文件webhook:', body)

    const {
      filename,
      content,
      size,
      type = 'text/plain',
      module_id,
      item_id
    } = body

    if (!filename || !content) {
      return NextResponse.json({
        error: 'Missing required fields: filename, content'
      }, { status: 400 })
    }

    // 1. 将文本内容保存到Supabase Storage
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `documents/${timestamp}_${sanitizedFilename}`

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('media')
      .upload(storagePath, content, {
        contentType: type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      logger.error('Storage upload error:', uploadError)
      return NextResponse.json({
        error: 'Failed to upload to storage: ' + uploadError.message
      }, { status: 500 })
    }

    // 2. 获取公开URL
    const { data: urlData } = admin.storage
      .from('media')
      .getPublicUrl(storagePath)

    // 3. 保存到media_asset表
    const { data: assetData, error: dbError } = await admin
      .from('media_asset')
      .insert({
        url: urlData.publicUrl,
        type: 'document',
        module_id: module_id || null,
        item_id: item_id || null,
        meta: {
          originalName: filename,
          size: size || content.length,
          mimetype: type,
          uploadPath: storagePath,
          source: 'webhook',
          processed_at: new Date().toISOString(),
          content_preview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
        }
      })
      .select()
      .single()

    if (dbError) {
      logger.error('Database error:', dbError)
      // 清理已上传的文件
      await admin.storage.from('media').remove([storagePath])
      return NextResponse.json({
        error: 'Failed to save to database: ' + dbError.message
      }, { status: 500 })
    }

    // 4. 如果指定了模块或条目，创建关联
    let associationResult = null
    if (module_id || item_id) {
      // 这里可以添加额外的关联逻辑
      associationResult = {
        module_id,
        item_id,
        asset_id: assetData.id
      }
    }

    logger.info('文本文件处理成功:', {
      filename,
      asset_id: assetData.id,
      url: urlData.publicUrl,
      size: size || content.length
    })

    return NextResponse.json({
      success: true,
      message: 'Text file processed successfully',
      data: {
        asset: assetData,
        association: associationResult,
        storage_path: storagePath,
        public_url: urlData.publicUrl
      }
    }, { status: 201 })

  } catch (error) {
    logger.error('Webhook processing error:', error)
    return NextResponse.json({
      error: process.env.NODE_ENV === 'development'
        ? 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
        : 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Text upload webhook endpoint',
    usage: 'POST with JSON body containing filename, content, size, type, module_id (optional), item_id (optional)',
    example: {
      filename: 'example.txt',
      content: 'File content here...',
      size: 1024,
      type: 'text/plain',
      module_id: 'uuid-here',
      item_id: 'uuid-here'
    }
  })
}
