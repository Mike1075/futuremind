/**
 * 文件类型验证工具
 * 使用 magic bytes（文件头签名）验证真实文件类型
 * 比 MIME type 更安全，因为 MIME type 可以被伪造
 */

// 文件类型签名（magic bytes）
const FILE_SIGNATURES: Record<string, { signature: number[]; offset?: number }[]> = {
  // 图片格式
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF] }
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }  // GIF89a
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46], offset: 0 },  // RIFF
    // 需要额外检查 offset 8-11 为 WEBP
  ],
  'image/svg+xml': [
    { signature: [0x3C, 0x3F, 0x78, 0x6D, 0x6C] }, // <?xml
    { signature: [0x3C, 0x73, 0x76, 0x67] }         // <svg
  ],

  // 视频格式
  'video/mp4': [
    { signature: [0x66, 0x74, 0x79, 0x70], offset: 4 } // ftyp at offset 4
  ],
  'video/webm': [
    { signature: [0x1A, 0x45, 0xDF, 0xA3] }
  ],
  'video/quicktime': [
    { signature: [0x66, 0x74, 0x79, 0x70, 0x71, 0x74], offset: 4 } // ftypqt
  ],

  // 音频格式
  'audio/mpeg': [
    { signature: [0xFF, 0xFB] }, // MP3 frame sync
    { signature: [0xFF, 0xFA] },
    { signature: [0xFF, 0xF3] },
    { signature: [0x49, 0x44, 0x33] } // ID3 tag
  ],
  'audio/wav': [
    { signature: [0x52, 0x49, 0x46, 0x46] } // RIFF
  ],
  'audio/ogg': [
    { signature: [0x4F, 0x67, 0x67, 0x53] } // OggS
  ],

  // 文档格式
  'application/pdf': [
    { signature: [0x25, 0x50, 0x44, 0x46] } // %PDF
  ],
  'application/zip': [
    { signature: [0x50, 0x4B, 0x03, 0x04] }, // PK..
    { signature: [0x50, 0x4B, 0x05, 0x06] }, // PK (empty archive)
    { signature: [0x50, 0x4B, 0x07, 0x08] }  // PK (spanned archive)
  ],
  // Office 格式（docx, xlsx, pptx 都是 zip 格式）
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { signature: [0x50, 0x4B, 0x03, 0x04] }
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    { signature: [0x50, 0x4B, 0x03, 0x04] }
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    { signature: [0x50, 0x4B, 0x03, 0x04] }
  ],
  // 旧版 Office 格式
  'application/msword': [
    { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] } // OLE compound
  ],
  'application/vnd.ms-excel': [
    { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1] }
  ]
}

/**
 * 验证文件的 magic bytes 是否与声明的 MIME 类型匹配
 * @param file - File 对象
 * @param declaredMimeType - 声明的 MIME 类型
 * @returns 验证结果
 */
export async function validateFileMagicBytes(
  file: File,
  declaredMimeType: string
): Promise<{ valid: boolean; detectedType?: string; message?: string }> {
  try {
    // 读取文件头部（前 16 字节足够识别大部分格式）
    const headerSize = 16
    const buffer = await file.slice(0, headerSize).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // 文本文件特殊处理（没有固定签名）
    const textTypes = ['text/plain', 'text/csv', 'text/markdown', 'text/html']
    if (textTypes.includes(declaredMimeType)) {
      // 检查是否包含二进制字符（非 UTF-8 兼容）
      const hasBinaryContent = bytes.some(byte =>
        byte < 0x09 || (byte > 0x0D && byte < 0x20 && byte !== 0x1B)
      )
      if (hasBinaryContent) {
        return {
          valid: false,
          message: '文件内容与文本格式不符，可能是二进制文件'
        }
      }
      return { valid: true }
    }

    // 检查已知文件类型的签名
    const signatures = FILE_SIGNATURES[declaredMimeType]
    if (!signatures) {
      // 未知类型，跳过验证但记录警告
      return {
        valid: true,
        message: '未知文件类型，跳过 magic bytes 验证'
      }
    }

    // 检查是否匹配任一签名
    for (const { signature, offset = 0 } of signatures) {
      if (matchesSignature(bytes, signature, offset)) {
        return { valid: true, detectedType: declaredMimeType }
      }
    }

    // 尝试检测实际文件类型
    const detectedType = detectFileType(bytes)

    return {
      valid: false,
      detectedType,
      message: detectedType
        ? `文件实际类型为 ${detectedType}，与声明的 ${declaredMimeType} 不符`
        : `文件签名与声明的 ${declaredMimeType} 类型不匹配`
    }
  } catch (error) {
    return {
      valid: false,
      message: '文件读取失败，无法验证类型'
    }
  }
}

/**
 * 检查字节数组是否匹配签名
 */
function matchesSignature(bytes: Uint8Array, signature: number[], offset: number): boolean {
  if (bytes.length < offset + signature.length) {
    return false
  }
  return signature.every((byte, index) => bytes[offset + index] === byte)
}

/**
 * 尝试检测文件的实际类型
 */
function detectFileType(bytes: Uint8Array): string | undefined {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const { signature, offset = 0 } of signatures) {
      if (matchesSignature(bytes, signature, offset)) {
        return mimeType
      }
    }
  }
  return undefined
}

/**
 * 获取文件的友好类型名称
 */
export function getFileTypeName(mimeType: string): string {
  const typeNames: Record<string, string> = {
    'image/jpeg': 'JPEG 图片',
    'image/png': 'PNG 图片',
    'image/gif': 'GIF 图片',
    'image/webp': 'WebP 图片',
    'image/svg+xml': 'SVG 图片',
    'video/mp4': 'MP4 视频',
    'video/webm': 'WebM 视频',
    'audio/mpeg': 'MP3 音频',
    'audio/wav': 'WAV 音频',
    'audio/ogg': 'OGG 音频',
    'application/pdf': 'PDF 文档',
    'application/msword': 'Word 文档',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 文档',
    'application/vnd.ms-excel': 'Excel 表格',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 表格',
    'text/plain': '文本文件',
    'text/csv': 'CSV 文件',
    'text/markdown': 'Markdown 文件'
  }
  return typeNames[mimeType] || mimeType
}
