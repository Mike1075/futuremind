/**
 * 文本格式化工具函数
 * 用于处理课程内容的显示格式
 * 按照原版排版格式设计
 */

interface FormatOptions {
  addBorderToAll?: boolean
}

/**
 * 格式化课程文本
 * 按照原版格式：
 * - 时机：xxx 和 目的：xxx 在同一行显示
 * - 具体步骤 作为独立小标题
 * - 1. 停止：xxx 格式的步骤
 * - 准备阶段、冥想引导 作为小标题
 */
export function formatCourseText(
  text: string | null | undefined,
  options: FormatOptions = {}
): React.ReactNode {
  if (!text) return null

  // 0. 将字面量 \n 转换为真正的换行符（数据库中部分数据存储的是转义字符串）
  let formatted = text.replace(/\\n/g, '\n')

  // 1. 移除 --- 分隔符
  formatted = formatted.replace(/\s*---+\s*/g, '\n\n')

  // 2. 移除多余的空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // 3. 清理首尾空白
  formatted = formatted.trim()

  // 4. 移除第一行如果是重复的标题（🧘 冥想练习:xxx 或 🌱 生活实践:xxx 或 【生活实修...】）
  formatted = formatted.replace(/^[🧘🌱🔍📖]\s*[^:：\n]+[:：][^\n]*\n\n?/, '')
  formatted = formatted.replace(/^【生活实修[^】]*】\s*\n?/, '')  // 移除【生活实修:xxx】格式的标题
  formatted = formatted.replace(/^第三部分[：:][^\n]*\*{0,2}\s*\n\n?/, '')  // 移除 energy_alchemy 的"第三部分：生活中的小练习**"

  // 5. 处理 *(建议时长：xxx)* 格式 - 移除星号，只保留括号内容
  formatted = formatted.replace(/\*\(([^)]+)\)\*/g, '($1)')

  // 6a. 处理冥想主题标题：**【冥想主题：xxx】** → 独立段落标题
  formatted = formatted.replace(/\*\*【冥想主题[：:]([^】]+)】\*\*/g, '\n\n【冥想主题：$1】\n\n')

  // 6b. 处理练习名称标题：**【练习名称：xxx】** → 独立段落标题
  formatted = formatted.replace(/\*\*【练习名称[：:]([^】]+)】\*\*/g, '\n\n【练习名称：$1】\n\n')

  // 7. 处理 **准备阶段：** 和 **引导语：** 等标签 → 独立段落
  formatted = formatted.replace(/\*\*(准备阶段|引导语|建议时长)[：:]\*\*\s*/g, '\n\n**$1：**')

  // 8. 处理生活实践的分行格式：
  // Variant A: * **标签：** content (冒号在**内)
  // Variant B: * **标签**：content (冒号在**外)
  formatted = formatted.replace(/\*\s*\*\*([^*:：]+)(?:[:：]\*\*|\*\*[:：])\s*/g, '\n\n**$1：**')

  // 9. 确保编号列表项（1. 2. 3. 等）前有段落分隔符
  // 修复：标签（如 做法：）后跟编号列表时，编号项之间只有单 \n，被当成一段处理
  // 将 \n + 数字. 升级为 \n\n + 数字.，使每个编号项成为独立段落
  formatted = formatted.replace(/\n(\d+\.\s)/g, '\n\n$1')

  // 10. 再次清理可能产生的多余空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // 5. 将文本分段（按双换行）
  const paragraphs = formatted.split('\n\n')

  // 6. 预处理：标记哪些段落属于冥想引导区域
  // 检测"冥想引导"标签后的所有内容，直到遇到下一个小标题
  let inMeditationGuide = false
  const meditationGuideFlags: boolean[] = []
  const sectionTitlePattern = /^(准备阶段|冥想引导|具体步骤|聆听练习|结束阶段|生活中的小练习|声音的暂停)[:：]?$/

  for (let i = 0; i < paragraphs.length; i++) {
    const trimmed = paragraphs[i].trim()

    // 检测是否是"冥想引导"标签
    if (/^冥想引导[:：]?$/.test(trimmed)) {
      inMeditationGuide = true
      meditationGuideFlags[i] = false // 标题本身不是斜体
    }
    // 检测是否是其他小标题（结束冥想引导区域）
    else if (sectionTitlePattern.test(trimmed) && inMeditationGuide) {
      inMeditationGuide = false
      meditationGuideFlags[i] = false
    }
    // 在冥想引导区域内的段落
    else if (inMeditationGuide) {
      meditationGuideFlags[i] = true
    }
    else {
      meditationGuideFlags[i] = false
    }
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim()
        if (!trimmed) return null

        // === 副标题（第一行短文本，如"声音的暂停"、"无名之境"）===
        if (index === 0 && trimmed.length < 30 && !trimmed.includes('\n') && !trimmed.match(/[。，！？]/) && !trimmed.match(/^[\d]/) && !trimmed.includes('：')) {
          return (
            <h3 key={index} className="text-xl font-bold text-purple-300 mb-4">
              {trimmed}
            </h3>
          )
        }

        // === 冥想主题标题（【冥想主题：xxx】）===
        const meditationThemeMatch = trimmed.match(/^【冥想主题[：:](.+?)】$/)
        if (meditationThemeMatch) {
          return (
            <h3 key={index} className="text-xl font-bold text-amber-300 mt-6 mb-3">
              【冥想主题：{meditationThemeMatch[1]}】
            </h3>
          )
        }

        // === 练习名称标题（【练习名称：xxx】）===
        const practiceNameMatch = trimmed.match(/^【练习名称[：:](.+?)】$/)
        if (practiceNameMatch) {
          return (
            <h3 key={index} className="text-xl font-bold text-emerald-300 mt-2 mb-3">
              【练习名称：{practiceNameMatch[1]}】
            </h3>
          )
        }

        // === 独立小标题（准备阶段、冥想引导、具体步骤）===
        const standaloneTitle = trimmed.match(/^(准备阶段|冥想引导|具体步骤|聆听练习|结束阶段)[:：]?$/)
        if (standaloneTitle) {
          return (
            <h4 key={index} className="text-lg font-bold text-purple-200 mt-6 mb-3">
              {standaloneTitle[1]}
            </h4>
          )
        }

        // === 带冒号的标签行（时机：xxx、目的：xxx）- 标签加粗，内容同行 ===
        const labelMatch = trimmed.match(/^(时机|目的|练习方法|核心要点|注意事项)[:：]\s*([\s\S]+)$/)
        if (labelMatch) {
          const [, label, content] = labelMatch
          return (
            <p key={index} className="text-gray-300 leading-relaxed">
              <strong className="text-purple-200 font-bold">{label}：</strong>
              {formatInlineText(content)}
            </p>
          )
        }

        // === 步骤列表（多行，每行 1. 停止：xxx 格式）===
        if (trimmed.includes('\n') && trimmed.match(/^\d+\.\s*[^：:]+[:：]/)) {
          const lines = trimmed.split('\n').filter(line => line.trim())
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, i) => {
                const lineTrimmed = line.trim()
                const stepMatch = lineTrimmed.match(/^(\d+)\.\s*([^：:]+)[:：]\s*(.*)$/)
                if (stepMatch) {
                  const [, num, rawStepTitle, stepContent] = stepMatch
                  // 去除 Markdown **加粗** 标记，避免显示为文字
                  const stepTitle = rawStepTitle.replace(/\*\*/g, '')
                  return (
                    <p key={i} className="text-gray-300 leading-relaxed">
                      <span className="text-purple-300 font-semibold">{num}. </span>
                      <strong className="text-purple-200">{stepTitle}：</strong>
                      {formatInlineText(stepContent)}
                    </p>
                  )
                }
                // 子项（以 - 或 • 开头）
                if (lineTrimmed.startsWith('-') || lineTrimmed.startsWith('•')) {
                  return (
                    <p key={i} className="text-gray-300 leading-relaxed ml-6">
                      {formatInlineText(lineTrimmed)}
                    </p>
                  )
                }
                // 普通行
                return (
                  <p key={i} className="text-gray-300 leading-relaxed ml-4">
                    {formatInlineText(lineTrimmed)}
                  </p>
                )
              })}
            </div>
          )
        }

        // === 单行步骤（1. 停止：xxx）===
        const singleStepMatch = trimmed.match(/^(\d+)\.\s*([^：:]+)[:：]\s*(.*)$/)
        if (singleStepMatch && !trimmed.includes('\n')) {
          const [, num, rawStepTitle, stepContent] = singleStepMatch
          // 去除 Markdown **加粗** 标记
          const stepTitle = rawStepTitle.replace(/\*\*/g, '')
          return (
            <p key={index} className="text-gray-300 leading-relaxed">
              <span className="text-purple-300 font-semibold">{num}. </span>
              <strong className="text-purple-200">{stepTitle}：</strong>
              {formatInlineText(stepContent)}
            </p>
          )
        }

        // === 深度解读标题（1. "xxx" 或 1. xxx 短标题）===
        const numberedTitleMatch = trimmed.match(/^(\d+)\.\s*(.{1,50})$/)
        if (numberedTitleMatch && !trimmed.includes('\n') && trimmed.length < 60) {
          return (
            <h4 key={index} className="text-lg font-bold text-purple-200 mt-6 mb-3">
              <span className="mr-1">{numberedTitleMatch[1]}.</span>
              <span>{numberedTitleMatch[2]}</span>
            </h4>
          )
        }

        // === 冥想引导文本（"冥想引导"标签后的内容，显示为斜体）===
        if (meditationGuideFlags[index]) {
          return (
            <p key={index} className="text-gray-300 italic leading-relaxed">
              {formatInlineText(trimmed)}
            </p>
          )
        }

        // === 多行段落（含换行的文本，逐行渲染）===
        if (trimmed.includes('\n')) {
          const lines = trimmed.split('\n').filter(line => line.trim())
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, i) => {
                const lineTrimmed = line.trim()
                // 子项（以 * 或 - 或 • 开头，后跟空格）
                if (/^[*\-•]\s/.test(lineTrimmed)) {
                  const content = lineTrimmed.replace(/^[*\-•]\s*/, '')
                  return (
                    <p key={i} className="text-gray-300 leading-relaxed ml-6">
                      {formatInlineText(content)}
                    </p>
                  )
                }
                return (
                  <p key={i} className="text-gray-300 leading-relaxed">
                    {formatInlineText(lineTrimmed)}
                  </p>
                )
              })}
            </div>
          )
        }

        // === 普通段落 ===
        return (
          <p key={index} className="text-gray-300 leading-relaxed">
            {formatInlineText(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

/**
 * 处理行内格式
 * - 增强emoji显示
 * - 支持 Markdown **text** 加粗语法
 */
function formatInlineText(text: string): React.ReactNode {
  // 先处理 Markdown 加粗语法 **text** 或 *text*（双星号或单星号）
  // 使用更精确的正则：匹配 **内容** 或 *内容*，内容不能以空格开始或结束
  const parts: React.ReactNode[] = []
  let lastIndex = 0

  // 匹配 **内容** 双星号加粗
  const boldRegex = /\*\*([^*\s][^*]*[^*\s]|[^*\s])\*\*/g
  let match

  while ((match = boldRegex.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      parts.push(formatEmojis(text.slice(lastIndex, match.index), parts.length))
    }
    // 添加加粗文本
    parts.push(
      <strong key={`bold-${parts.length}`} className="font-bold text-amber-200">
        {match[1]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    parts.push(formatEmojis(text.slice(lastIndex), parts.length))
  }

  // 如果没有找到任何加粗，直接处理emoji
  if (parts.length === 0) {
    return formatEmojis(text, 0)
  }

  return <span>{parts}</span>
}

/**
 * 处理emoji显示
 */
function formatEmojis(text: string, keyPrefix: number): React.ReactNode {
  const emojiRegex = /([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])/gu
  const segments = text.split(emojiRegex)

  return (
    <span key={`emoji-group-${keyPrefix}`}>
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
 * 简化版格式化（只去除分隔符和清理空行）
 */
export function simpleFormat(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/\s*---+\s*/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
