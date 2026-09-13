/**
 * PBL 项目工具函数
 */

// 伊卡洛斯项目模块名称映射
export const MODULE_NAMES: Record<number, string> = {
  1: '模块一：无形的纽带',
  2: '模块一：无形的纽带',
  3: '模块一：无形的纽带',
  4: '模块二：无形的地图',
  5: '模块二：无形的地图',
  6: '模块二：无形的地图',
  7: '模块二：无形的地图',
  8: '模块三：延展的心灵',
  9: '模块三：延展的心灵',
  10: '模块三：延展的心灵',
  11: '模块三：延展的心灵',
}

// 根据sequence_number获取统一的模块名称
export const getModuleName = (sequenceNumber: number): string => {
  return MODULE_NAMES[sequenceNumber] || '伊卡洛斯计划'
}

// 智能文本预处理器：将中文段落标签转换为Markdown格式并添加表情
export function preprocessContentToMarkdown(content: string): string {
  if (!content) return ''

  let processed = content

  // 步骤1: 移除开头的时长标记并转为醒目提示
  processed = processed.replace(/^\(任务时长：([^)]+)\)\n?/m, '> ⏱️ **任务时长**: $1\n\n')

  // 步骤2: 将句子结尾的单个换行符转为段落分隔（双换行符）
  // 匹配中文句号、感叹号、问号、省略号后的单个换行符
  processed = processed.replace(/([。！？…"」』】])\n(?!\n)/g, '$1\n\n')

  // 步骤3: 主要段落标题（转为三级标题 ###）
  const mainLabels = [
    { pattern: /^(任务说明|任务|主要任务|核心任务)[:：]/gm, emoji: '📝', title: '任务' },
    { pattern: /^(目标|学习目标|本周目标)[:：]/gm, emoji: '🎯', title: '目标' },
    { pattern: /^(准备材料|所需材料|材料准备)[:：]/gm, emoji: '🛠️', title: '准备材料' },
    { pattern: /^(思考一下|思考|思考问题)[:：]/gm, emoji: '💭', title: '思考' },
    { pattern: /^(接受任务|开始任务|任务开始)[:：]/gm, emoji: '✅', title: '接受任务' },
    { pattern: /^(提交要求|提交|上传)[:：]/gm, emoji: '📤', title: '提交要求' },
    { pattern: /^(温馨提示|注意事项|重要提示)[:：]/gm, emoji: '⚠️', title: '注意事项' },
    { pattern: /^(展示你的工具|展示作品|成果展示)[:：]/gm, emoji: '🎨', title: '展示作品' },
    { pattern: /^(提交你的调查报告|提交报告|上传作业)[:：]/gm, emoji: '📋', title: '提交报告' }
  ]

  mainLabels.forEach(({ pattern, emoji, title }) => {
    processed = processed.replace(pattern, `\n### ${emoji} ${title}\n\n`)
  })

  // 步骤4: 次要段落标题（转为四级标题 ####）
  const subLabels = [
    { pattern: /^(步骤|操作步骤|详细步骤)[:：]/gm, emoji: '👣', title: '步骤' },
    { pattern: /^(选项[A-Z]|方案[A-Z])[:：]/gm, emoji: '🔹', keep: true }, // 保留原标题
    { pattern: /^(示例|例子|参考示例)[:：]/gm, emoji: '💡', title: '示例' },
    { pattern: /^(建议|小建议|友情提示)[:：]/gm, emoji: '💫', title: '建议' },
    { pattern: /^(格式|提交格式|格式要求)[:：]/gm, emoji: '📄', title: '格式' }
  ]

  subLabels.forEach(({ pattern, emoji, title, keep }) => {
    if (keep) {
      processed = processed.replace(pattern, (match) => `\n#### ${emoji} ${match.replace(/[:：]/, '')}\n\n`)
    } else {
      processed = processed.replace(pattern, `\n#### ${emoji} ${title}\n\n`)
    }
  })

  // 步骤5: 处理项目符号列表 - 检测以"●"、"•"、"○"或数字开头的行
  processed = processed.replace(/^([●•○])\s+(.+)$/gm, '- $2')
  processed = processed.replace(/^(\d+[.、])\s+(.+)$/gm, '1. $2')

  // 步骤6: 为特殊内容添加表情（句子开头的关键词）
  const sentenceEmojis = [
    { pattern: /^(欢迎|恭喜)/gm, emoji: '🎉 ' },
    { pattern: /^(重要|注意|警告)/gm, emoji: '⚠️ ' },
    { pattern: /^(提示|小贴士)/gm, emoji: '💡 ' }
  ]

  sentenceEmojis.forEach(({ pattern, emoji }) => {
    processed = processed.replace(pattern, emoji + '$1')
  })

  // 步骤7: 清理多余的空行（超过2个连续换行符的）
  processed = processed.replace(/\n{3,}/g, '\n\n')

  return processed.trim()
}

// 难度级别颜色映射
export const DIFFICULTY_COLORS: Record<string, string> = {
  '基础探索': 'from-green-500 to-emerald-600',
  '进阶挑战': 'from-blue-500 to-cyan-600',
  '深度研究': 'from-purple-500 to-pink-600',
  '创新实践': 'from-orange-500 to-red-600'
}
