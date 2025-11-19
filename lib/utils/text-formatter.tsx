/**
 * 文本格式化工具函数
 * 用于处理课程内容的显示格式
 */

/**
 * 格式化课程文本
 * - 移除多余的 --- 分隔符
 * - 智能分段（保留有意义的换行）
 * - 清理多余空行
 * - 添加适当的段落间距
 */
export function formatCourseText(text: string | null | undefined): React.ReactNode {
  if (!text) return null

  // 1. 移除 --- 分隔符（前后可能有空格）
  let formatted = text.replace(/\s*---+\s*/g, '\n\n')

  // 2. 移除多余的空行（3个以上连续换行变成2个）
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // 3. 清理首尾空白
  formatted = formatted.trim()

  // 4. 将文本分段，每段用不同样式
  const paragraphs = formatted.split('\n\n')

  return (
    <div className="space-y-6">
      {paragraphs.map((paragraph, index) => {
        // 处理列表项（以 ** 或 ** 开头）
        if (paragraph.trim().match(/^[*\-•]\s/)) {
          const items = paragraph.split('\n')
          return (
            <ul key={index} className="space-y-2 pl-4">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="text-purple-400 mt-1">✦</span>
                  <span className="flex-1 leading-relaxed">
                    {formatInlineText(item.replace(/^[*\-•]\s/, ''))}
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        // 处理标题（以 ** 包围）
        if (paragraph.includes('**')) {
          return (
            <div key={index} className="text-gray-300 leading-relaxed">
              {formatInlineText(paragraph)}
            </div>
          )
        }

        // 处理引用（以 " 或 「 开头）
        if (paragraph.trim().match(/^["""「『]/)) {
          return (
            <blockquote key={index} className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-500/5 rounded-r-lg">
              <p className="text-gray-300 italic leading-relaxed">
                {formatInlineText(paragraph)}
              </p>
            </blockquote>
          )
        }

        // 普通段落
        return (
          <p key={index} className="text-gray-300 leading-relaxed">
            {formatInlineText(paragraph)}
          </p>
        )
      })}
    </div>
  )
}

/**
 * 处理行内格式
 * - 加粗（**text**）
 * - 斜体（*text*）
 * - 高亮重点
 */
function formatInlineText(text: string): React.ReactNode {
  // 处理加粗 **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/**
 * 简化版格式化（只去除分隔符和清理空行）
 */
export function simpleFormat(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/\s*---+\s*/g, '\n\n') // 移除 ---
    .replace(/\n{3,}/g, '\n\n')      // 清理多余空行
    .trim()
}
