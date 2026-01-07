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

  // 1. 移除 --- 分隔符
  let formatted = text.replace(/\s*---+\s*/g, '\n\n')

  // 2. 移除多余的空行
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // 3. 清理首尾空白
  formatted = formatted.trim()

  // 4. 移除第一行如果是重复的标题（🧘 冥想练习:xxx 或 🌱 生活实践:xxx）
  formatted = formatted.replace(/^[🧘🌱🔍📖]\s*[^:：\n]+[:：][^\n]*\n\n?/, '')

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
                const stepMatch = line.match(/^(\d+)\.\s*([^：:]+)[:：]\s*(.*)$/)
                if (stepMatch) {
                  const [, num, stepTitle, stepContent] = stepMatch
                  return (
                    <p key={i} className="text-gray-300 leading-relaxed">
                      <span className="text-purple-300 font-semibold">{num}. </span>
                      <strong className="text-purple-200">{stepTitle}：</strong>
                      {formatInlineText(stepContent)}
                    </p>
                  )
                }
                // 普通行
                return (
                  <p key={i} className="text-gray-300 leading-relaxed ml-4">
                    {formatInlineText(line)}
                  </p>
                )
              })}
            </div>
          )
        }

        // === 单行步骤（1. 停止：xxx）===
        const singleStepMatch = trimmed.match(/^(\d+)\.\s*([^：:]+)[:：]\s*(.*)$/)
        if (singleStepMatch && !trimmed.includes('\n')) {
          const [, num, stepTitle, stepContent] = singleStepMatch
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
 * 简化版格式化（只去除分隔符和清理空行）
 */
export function simpleFormat(text: string | null | undefined): string {
  if (!text) return ''

  return text
    .replace(/\s*---+\s*/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
