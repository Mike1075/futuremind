/**
 * 上传文件的文本提取
 *
 * 原先这一步由 N8N 的 Extract from File 节点完成，现改为项目内实现。
 */

import { logger } from '@/lib/logger'

// pdf-parse 没有默认导出，使用动态导入（与 app/api/admin/gaia-kb 的用法一致）
async function pdfParse(buffer: Buffer) {
  const pdf = await import('pdf-parse').then(m => (m as any).default || m)
  return pdf(buffer)
}

/**
 * 从上传的文件里提取纯文本
 *
 * PDF 走 pdf-parse，其余（md / txt / 未知类型）按 UTF-8 文本读取。
 * 二进制的 doc/docx 目前不支持，会得到乱码——调用方应提示用户转成 txt/md/pdf。
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    const data = await pdfParse(buffer)
    logger.debug('[rag-extract] PDF 解析成功', {
      pages: data.numpages,
      textLength: data.text?.length || 0
    })
    return data.text || ''
  }

  return buffer.toString('utf-8')
}

/** 支持的文本类扩展名（用于给用户更清楚的报错） */
export function isSupportedTextFile(fileName: string): boolean {
  return /\.(pdf|txt|md|markdown|csv|json)$/i.test(fileName)
}
