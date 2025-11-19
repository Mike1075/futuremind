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
 * - 增强emoji显示效果
 * - 加粗小标题
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
        // 处理带emoji的章节标题（如 📖 原文摘录）
        if (paragraph.trim().match(/^[📖🔍🧘🌱💡✨🎯🌟🎨🔥⭐️🌈🎵🎭🏆🎪🎬🎤🎧🎸🎹🎺🎻🥁🎲🎯🎰🎳🏀🏈⚾️⚽️🏐🏉🎾🏸🥊🥋🥅🥌🏏🏑🏒🏓🏸🥏]\s*.+/)) {
          const match = paragraph.match(/^([📖🔍🧘🌱💡✨🎯🌟🎨🔥⭐️🌈🎵🎭🏆🎪🎬🎤🎧🎸🎹🎺🎻🥁🎲🎯🎰🎳🏀🏈⚾️⚽️🏐🏉🎾🏸🥊🥋🥅🥌🏏🏑🏒🏓🏸🥏])\s*(.+)/)
          if (match) {
            return (
              <div key={index} className="flex items-center gap-3 mb-4 mt-6">
                <span className="text-3xl animate-pulse">{match[1]}</span>
                <h3 className="text-xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {match[2]}
                </h3>
              </div>
            )
          }
        }

        // 处理独立的小标题（不带emoji但单独一行的短文本，通常是章节标题）
        if (paragraph.trim().length < 30 && paragraph.trim().length > 0 && !paragraph.includes('\n') && !paragraph.match(/^[*\-•]/)) {
          // 检查是否看起来像标题（结尾没有标点符号，或以冒号结尾）
          if (!paragraph.match(/[。，！？、；："""''（）《》【】]/)) {
            return (
              <h4 key={index} className="text-lg font-bold text-purple-300 mt-6 mb-3">
                {formatInlineText(paragraph)}
              </h4>
            )
          }
        }

        // 处理列表项（以 * 或 - 开头）
        if (paragraph.trim().match(/^[*\-•]\s/)) {
          const items = paragraph.split('\n')
          return (
            <ul key={index} className="space-y-3 pl-4">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="text-purple-400 mt-1 text-lg flex-shrink-0">✨</span>
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
            <blockquote key={index} className="border-l-4 border-purple-400 pl-4 py-3 bg-purple-500/5 rounded-r-lg hover:bg-purple-500/10 transition-colors">
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
 * - 增强emoji显示
 */
function formatInlineText(text: string): React.ReactNode {
  // 处理加粗 **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {part.slice(2, -2)}
        </strong>
      )
    }

    // 扩展的emoji正则表达式，包含更多Unicode范围
    // 包括：基本emoji、补充符号、杂项符号、装饰符号、表情符号等
    const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])/gu
    const segments = part.split(emojiRegex)

    return (
      <span key={index}>
        {segments.map((segment, i) => {
          // 重新创建regex实例以重置lastIndex
          const testRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])/gu
          if (testRegex.test(segment)) {
            return (
              <span key={i} className="inline-block text-xl mx-0.5 hover:scale-125 transition-transform">
                {segment}
              </span>
            )
          }
          return segment
        })}
      </span>
    )
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
