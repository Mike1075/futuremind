/**
 * 文本格式化工具函数
 * 用于处理课程内容的显示格式
 */

interface FormatOptions {
  addBorderToAll?: boolean  // 是否为所有段落添加左边框（用于深度解读）
  isMeditation?: boolean    // 是否是冥想练习（特殊格式）
  isLifePractice?: boolean  // 是否是生活实践（特殊格式）
}

/**
 * 格式化课程文本
 * - 移除重复的标题行
 * - 智能分段和层级标题
 * - 清理多余空行和*号
 * - 段落结尾添加emoji装饰
 */
export function formatCourseText(
  text: string | null | undefined,
  options: FormatOptions = {}
): React.ReactNode {
  if (!text) return null

  // 1. 移除 --- 分隔符
  let formatted = text.replace(/\s*---+\s*/g, '\n\n')

  // 2. 移除多余的空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // 3. 清理 ** 和 * 标记（会造成显示问题）
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1')
  formatted = formatted.replace(/\*([^*]+)\*/g, '$1')

  // 4. 清理首尾空白
  formatted = formatted.trim()

  // 5. 移除第一行如果是重复的标题（🧘 冥想练习:xxx 或 🌱 生活实践:xxx）
  formatted = formatted.replace(/^[🧘🌱🔍📖]\s*[^:：\n]+[:：][^\n]*\n\n?/, '')

  // 6. 智能分段
  formatted = smartParagraphSplit(formatted)

  // 7. 将文本分段
  const paragraphs = formatted.split('\n\n')

  return (
    <div className="space-y-5">
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim()
        if (!trimmed) return null

        // 冥想/生活实践的副标题（第一行短文本）
        if (index === 0 && trimmed.length < 30 && !trimmed.includes('\n') && !trimmed.match(/[。，！？]/) && !trimmed.match(/^[\d]/)) {
          return (
            <h3 key={index} className="text-xl font-bold text-purple-300 mb-4">
              {trimmed.replace(/[:：]$/, '')}
            </h3>
          )
        }

        // 二级标题（准备阶段、冥想引导、时机、具体步骤、目的 等）
        if (
          trimmed.length < 15 &&
          !trimmed.includes('\n') &&
          !trimmed.match(/[。，！？、；"""''（）《》【】]/) &&
          !trimmed.match(/^[*\-•\d]/)
        ) {
          return (
            <h4 key={index} className="text-lg font-bold text-purple-200 mt-6 mb-3">
              {trimmed.replace(/[:：]$/, '')}
            </h4>
          )
        }

        // 有序号标题（如"1. xxx"开头但文本较短 < 40字符）
        const numberedTitleMatch = trimmed.match(/^(\d+\.)\s*(.{1,40})$/)
        if (numberedTitleMatch && !trimmed.includes('\n')) {
          // 深度解读中的有序号标题 - 不加竖线
          return (
            <h4 key={index} className="text-lg font-semibold text-purple-200 mt-6 mb-3">
              <span className="mr-2">{numberedTitleMatch[1]}</span>
              <span>{numberedTitleMatch[2]}</span>
            </h4>
          )
        }

        // 小标题（如"时机:xxx"、"目的:"）
        const subtitleMatch = trimmed.match(/^([^:：\n]{2,15})[:：]\s*([\s\S]*)$/)
        if (subtitleMatch && subtitleMatch[1].length < 15) {
          const [, title, content] = subtitleMatch
          return (
            <div key={index} className="mt-4">
              <h5 className="text-base font-bold text-purple-100 mb-2">
                {title}
              </h5>
              {content && (
                <div className="text-gray-300 leading-relaxed ml-4">
                  {formatInlineText(content)}
                  {content.length > 40 && <span className="ml-2 opacity-60 text-sm">{getRandomDecorativeEmoji()}</span>}
                </div>
              )}
            </div>
          )
        }

        // 列表项（以 * 或 - 或 • 或 数字. 开头的多行列表）
        if (trimmed.match(/^[\d]+\.\s/) && trimmed.includes('\n')) {
          const items = paragraph.split('\n').filter(line => line.trim())
          return (
            <ol key={index} className="space-y-3 ml-4">
              {items.map((item, i) => {
                const match = item.match(/^(\d+\.)\s*(.*)$/)
                if (match) {
                  return (
                    <li key={i} className="text-gray-300 leading-relaxed">
                      <span className="font-bold text-purple-200 mr-2">{match[1]}</span>
                      <span>{formatInlineText(match[2])}</span>
                    </li>
                  )
                }
                return (
                  <li key={i} className="text-gray-300 leading-relaxed ml-6">
                    {formatInlineText(item)}
                  </li>
                )
              })}
            </ol>
          )
        }

        // 列表项（以 * 或 - 或 • 开头）
        if (trimmed.match(/^[*\-•]\s/)) {
          const items = paragraph.split('\n').filter(line => line.trim())
          return (
            <ul key={index} className="space-y-2 ml-4">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300 leading-relaxed">
                  <span className="text-purple-400 mt-1 text-lg flex-shrink-0">✨</span>
                  <span className="flex-1">
                    {formatInlineText(item.replace(/^[*\-•]\s/, ''))}
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        // 编号段落（如"1. xxxxx一大段文字"）- 深度解读中的内容段落，不加竖线
        const numberedParaMatch = trimmed.match(/^(\d+\.)\s+([\s\S]+)$/)
        if (numberedParaMatch) {
          const content = numberedParaMatch[2]
          const hasMultipleLines = content.includes('\n')

          if (hasMultipleLines) {
            const lines = content.split('\n').filter(line => line.trim())
            return (
              <div key={index}>
                <div className="flex items-start gap-3">
                  <span className="text-purple-300 font-semibold mt-0.5 flex-shrink-0">
                    {numberedParaMatch[1]}
                  </span>
                  <div className="flex-1 space-y-2">
                    {lines.map((line, i) => (
                      <p key={i} className="text-gray-300 leading-relaxed">
                        {formatInlineText(line)}
                        {i === lines.length - 1 && line.length > 40 && (
                          <span className="ml-2 opacity-60 text-sm">{getRandomDecorativeEmoji()}</span>
                        )}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={index} className="flex items-start gap-3">
              <span className="text-purple-300 font-semibold mt-0.5 flex-shrink-0">
                {numberedParaMatch[1]}
              </span>
              <p className="flex-1 text-gray-300 leading-relaxed">
                {formatInlineText(content)}
                {content.length > 40 && <span className="ml-2 opacity-60 text-sm">{getRandomDecorativeEmoji()}</span>}
              </p>
            </div>
          )
        }

        // 冥想引导正文（包含省略号的对话/引导语）- 用斜体+竖线
        if (trimmed.includes('……') || trimmed.includes('...')) {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-green-400/50 pl-4 py-2 bg-green-500/5 rounded-r-lg"
            >
              <p className="text-gray-300 italic leading-relaxed">
                {formatInlineText(trimmed)}
                {trimmed.length > 40 && <span className="ml-2 opacity-60 text-sm">{getRandomDecorativeEmoji()}</span>}
              </p>
            </blockquote>
          )
        }

        // 引用文本（以 " 或 「 开头）
        if (trimmed.match(/^["""「『]/)) {
          return (
            <blockquote key={index} className="border-l-4 border-purple-400 pl-4 py-3 bg-purple-500/5 rounded-r-lg">
              <p className="text-gray-300 italic leading-relaxed">
                {formatInlineText(trimmed)}
                {trimmed.length > 40 && <span className="ml-2 opacity-60 text-sm">{getRandomDecorativeEmoji()}</span>}
              </p>
            </blockquote>
          )
        }

        // 普通段落
        const isLongParagraph = trimmed.length > 40

        return (
          <p
            key={index}
            className={`text-gray-300 leading-relaxed ${
              options.addBorderToAll
                ? 'border-l-4 border-purple-400 pl-4 py-2 bg-purple-500/5'
                : ''
            }`}
          >
            {formatInlineText(trimmed)}
            {isLongParagraph && <span className="ml-2 opacity-60 text-sm">{getRandomDecorativeEmoji()}</span>}
          </p>
        )
      })}
    </div>
  )
}

/**
 * 智能分段：将过长的段落按句子分段
 */
function smartParagraphSplit(text: string): string {
  const paragraphs = text.split('\n\n')
  const result: string[] = []

  for (const para of paragraphs) {
    // 如果段落超过200字且包含多个句子，尝试分段
    if (para.length > 200 && (para.match(/[。！？]/g) || []).length > 1) {
      const sentences = para.split(/([。！？])/g)
      let currentPara = ''

      for (let i = 0; i < sentences.length; i++) {
        currentPara += sentences[i]

        if ((sentences[i] === '。' || sentences[i] === '！' || sentences[i] === '？') && currentPara.length > 100) {
          result.push(currentPara.trim())
          currentPara = ''
        }
      }

      if (currentPara.trim()) {
        result.push(currentPara.trim())
      }
    } else {
      result.push(para)
    }
  }

  return result.join('\n\n')
}

/**
 * 处理行内格式
 * - 增强emoji显示
 */
function formatInlineText(text: string): React.ReactNode {
  // 扩展的emoji正则表达式
  const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])/gu
  const segments = text.split(emojiRegex)

  return (
    <span>
      {segments.map((segment, i) => {
        const testRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])/gu
        if (testRegex.test(segment)) {
          return (
            <span key={i} className="inline-block text-lg mx-0.5">
              {segment}
            </span>
          )
        }
        return segment
      })}
    </span>
  )
}

/**
 * 获取随机装饰emoji
 */
function getRandomDecorativeEmoji(): string {
  const decorativeEmojis = [
    '✨', '💫', '🌟', '⭐', '🌸', '🌺', '🌼', '🌻',
    '🍀', '🌿', '🌱', '🌾', '💮', '🏵️', '🌷', '🌹',
    '🦋', '🐚', '💎', '🔮', '🎐', '🎋', '🎍', '🎑',
    '🍃', '🌊', '☘️', '🌴', '🎨', '🎭', '🎪', '🎯'
  ]
  return decorativeEmojis[Math.floor(Math.random() * decorativeEmojis.length)]
}

/**
 * 简化版格式化（只去除分隔符和清理空行）
 */
export function simpleFormat(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/\s*---+\s*/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
