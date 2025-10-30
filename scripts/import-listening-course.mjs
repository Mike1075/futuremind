import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase配置
const supabaseUrl = 'https://lvjezsnwesyblnlkkirz.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQzNDI5NSwiZXhwIjoyMDcyMDEwMjk1fQ.4YOr1WrA8XY5sBhyTZvyR8064JoGAsju-6TXAHcZYsc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 读取markdown文件
const readmePath = join(__dirname, '../../readme/自在聆听·观音之旅：14天的聆听练习.md')
const content = readFileSync(readmePath, 'utf-8')

// 解析markdown内容
function parseListeningCourse(content) {
  // 匹配标题：### **【一月X日：标题】**
  const dayPattern = /###\s*\*\*【一月(.+?)日：(.+?)】\*\*/g
  const sections = []
  let matches = []
  let match

  console.log('🔍 开始匹配标题...')

  // 找到所有匹配
  while ((match = dayPattern.exec(content)) !== null) {
    console.log(`  找到: 一月${match[1]}日 - ${match[2]}`)
    matches.push({ index: match.index, day: match[1], title: match[2].trim() })
  }

  console.log(`\n✅ 共匹配到 ${matches.length} 天\n`)

  // 提取每一天的内容
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index
    const end = matches[i + 1] ? matches[i + 1].index : content.length
    const dayContent = content.substring(start, end)

    // 转换中文数字为阿拉伯数字
    const dayNumber = chineseToNumber(matches[i].day)

    // 提取各个部分
    const title = matches[i].title
    const original = extractSection(dayContent, '**原文摘录：**')
    const interpretation = extractSection(dayContent, '### **第一部分：深度解读**')
    const meditation = extractSection(dayContent, '### **第二部分：冥想练习与引导**')
    const practice = extractSection(dayContent, '### **第三部分：生活中的小练习**')

    console.log(`  第${dayNumber}天: ${title}`)
    console.log(`    原文: ${original.substring(0, 30)}...`)
    console.log(`    解读: ${interpretation.substring(0, 30)}...`)
    console.log(`    冥想: ${meditation.substring(0, 30)}...`)
    console.log(`    练习: ${practice.substring(0, 30)}...\n`)

    sections.push({
      dayNumber,
      title,
      original,
      interpretation,
      meditation,
      practice
    })
  }

  return sections
}

// 转换中文数字为阿拉伯数字
function chineseToNumber(chinese) {
  const map = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14
  }
  return map[chinese] || parseInt(chinese) || 1
}

// 提取章节内容
function extractSection(content, header) {
  const headerIndex = content.indexOf(header)
  if (headerIndex === -1) return ''

  // 找到下一个三级标题的位置
  const nextHeaderIndex = content.indexOf('### **第', headerIndex + header.length)
  const endIndex = nextHeaderIndex === -1 ? content.length : nextHeaderIndex

  let section = content.substring(headerIndex + header.length, endIndex).trim()

  // 移除markdown引用块标记
  section = section.replace(/^>\s*/gm, '')
  // 移除多余的空行
  section = section.replace(/\n{3,}/g, '\n\n')

  return section
}

// 主函数
async function main() {
  console.log('🚀 开始导入倾听课程数据...\n')

  // 解析课程内容
  const days = parseListeningCourse(content)
  console.log(`📖 解析到 ${days.length} 天的课程内容\n`)

  // 获取listening课程的system_id
  const { data: system, error: systemError } = await supabase
    .from('course_systems')
    .select('id')
    .eq('system_key', 'listening')
    .single()

  if (systemError || !system) {
    console.error('❌ 无法找到listening课程系统:', systemError)
    return
  }

  console.log(`✅ 找到课程系统 ID: ${system.id}\n`)

  // 更新每一天的内容
  for (const day of days) {
    console.log(`📝 更新第 ${day.dayNumber} 天...`)

    const { error } = await supabase
      .from('course_contents')
      .update({
        title: `第${day.dayNumber}天${day.title}`,
        original_text: day.original,
        deep_interpretation: day.interpretation,
        meditation_guide: day.meditation,
        life_practice: day.practice,
        updated_at: new Date().toISOString()
      })
      .eq('system_id', system.id)
      .eq('sequence_number', day.dayNumber)

    if (error) {
      console.error(`  ❌ 更新失败:`, error.message)
    } else {
      console.log(`  ✅ 成功`)
    }
  }

  console.log('\n🎉 全部导入完成！')
}

main().catch(console.error)
