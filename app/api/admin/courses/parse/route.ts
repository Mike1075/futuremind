// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { logger } from '@/lib/logger'

// 初始化 Gemini AI（使用环境变量验证）
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('GEMINI_API_KEY 未配置，请在 .env 文件中添加')
}

// 智能识别课程类型的提示词 - 使用简单的键值对格式
const IDENTIFY_COURSE_TYPE_PROMPT = `你是一个专业的课程分析专家。请分析以下课程文档，识别其课程类型并提取基本信息。

**课程类型分类**：
1. **listening**：14天系列课程，每天包含原文摘录、深度解读、冥想练习、生活实践
2. **earth**：模块化课程，包含知识点、苏格拉底式问题、观后思考
3. **pbl**：项目式学习，包含周计划、每日计划、活动安排、可交付成果
4. **daily**：通用日序列课程，按天组织（如：7天英语、21天挑战等），每天包含目标、练习内容、活动安排等

**重要**：不要输出JSON格式，使用以下简单的键值对格式：

COURSE_TYPE: listening
TITLE: 自在聆听·观音之旅
DESCRIPTION: 14天系列课程，每天包含原文摘录、深度解读、冥想练习与引导、生活中的小练习，通过"聆听"这个简单的入口，让我们体验到：真正的自在始终停止在选择与抗拒、当我们自然地对话于下层对话时，心智的愧疚便会自然松动，深刻的智慧与内心的宁静和相在意识里不期而遇
SYSTEM_KEY: listening-journey

**规则**：
1. COURSE_TYPE必须是：listening、earth、pbl、daily 之一（小写）
2. TITLE是课程标题（一行）
3. DESCRIPTION是课程描述（可以多行，但不要太长）
4. SYSTEM_KEY使用英文小写，用连字符分隔，简洁明了
5. 每个字段占一行，格式为 "字段名: 值"
6. 不要添加其他任何解释性文字或标记
7. **识别优先级**：先检查是否符合listening（必须14天+原文+冥想），再检查earth（模块化+苏格拉底问题），再检查pbl（项目式），最后才是daily（其他日序列课程）

文档内容：
`

// Listening课程的提示词模板 - 使用分隔符格式，避免JSON格式错误
const LISTENING_PROMPT = `你是一个专业的课程内容结构化专家。请将以下Listening课程文档解析为结构化文本格式。

课程特点：
- 14天的系列课程
- 每天包含：原文摘录、深度解读、冥想练习与引导、生活中的小练习

**重要**：不要输出JSON格式，使用以下简单的分隔符格式：

===DAY_START===
序号: 1
标题: 第1天的标题
副标题: 副标题内容
---ORIGINAL_TEXT---
原文摘录的完整内容（可以多行）
---END_ORIGINAL_TEXT---
---DEEP_INTERPRETATION---
第一部分：深度解读的完整内容（可以多行）
---END_DEEP_INTERPRETATION---
---MEDITATION_GUIDE---
第二部分：冥想练习与引导的完整内容（可以多行）
---END_MEDITATION_GUIDE---
---LIFE_PRACTICE---
第三部分：生活中的小练习的完整内容（可以多行）
---END_LIFE_PRACTICE---
===DAY_END===

===DAY_START===
序号: 2
标题: 第2天的标题
...
===DAY_END===

**重要规则**：
1. 每天的内容用 ===DAY_START=== 和 ===DAY_END=== 包裹
2. 字段之间用 ---字段名--- 和 ---END_字段名--- 包裹
3. 序号从1开始递增
4. 不要添加任何其他解释性文字
5. 保持原文的换行和格式

文档内容：
`

// Earth课程的提示词模板
const EARTH_PROMPT = `你是一个专业的课程内容结构化专家。请将以下Earth课程文档解析为JSON格式。

课程特点：
- 模块化课程结构
- 每个模块包含：知识点、苏格拉底式问题、观后思考

请严格按照以下JSON Schema格式输出：

{
  "contents": [
    {
      "sequence_number": 1,
      "title": "模块标题",
      "subtitle": "副标题",
      "original_text": "模块核心内容",
      "documentary_url": "",
      "pre_watch_guide": "观看前的引导",
      "knowledge_points": [
        {"title": "知识点标题", "content": "知识点内容"}
      ],
      "socratic_questions": [
        {"question": "问题", "guidance": "引导思路"}
      ],
      "post_reflection": [
        {"prompt": "反思提示", "example": "示例"}
      ]
    }
  ]
}

**重要规则**：
1. 只输出有效的JSON，不要添加任何Markdown代码块标记（如 \`\`\`json）
2. sequence_number从1开始递增
3. 确保所有字符串都正确转义
4. 如果某个字段内容缺失，使用空字符串或空数组

文档内容：
`

// PBL课程的提示词模板
const PBL_PROMPT = `你是一个专业的课程内容结构化专家。请将以下PBL项目式学习文档解析为JSON格式。

课程特点：
- 项目式学习
- 每个项目包含：周计划、每日计划、活动安排、可交付成果

请严格按照以下JSON Schema格式输出：

{
  "contents": [
    {
      "sequence_number": 1,
      "title": "项目标题",
      "subtitle": "难度选项（option_a/option_b/option_c/option_d）",
      "original_text": "核心问题描述",
      "estimated_duration": 7,
      "week_plan": [
        {
          "week": 1,
          "theme": "周主题",
          "goals": ["目标1", "目标2"],
          "activities": [
            {
              "day": "第1天",
              "title": "活动标题",
              "description": "活动描述",
              "deliverables": ["可交付成果1", "可交付成果2"]
            }
          ]
        }
      ]
    }
  ]
}

**重要规则**：
1. 只输出有效的JSON，不要添加任何Markdown代码块标记（如 \`\`\`json）
2. sequence_number从1开始递增
3. subtitle必须是以下之一：option_a, option_b, option_c, option_d
4. estimated_duration是预计天数（整数）
5. 确保所有字符串都正确转义

文档内容：
`

// 通用日序列课程的提示词模板 - 使用分隔符格式
const DAILY_PROMPT = `你是一个专业的课程内容结构化专家。请将以下日序列课程文档解析为结构化文本格式。

课程特点：
- 按天组织的课程（如：7天、14天、21天、30天等）
- 每天可能包含：目标、练习内容、活动、时长估计等
- 灵活的内容结构，不限于固定模板

**重要**：不要输出JSON格式，使用以下简单的分隔符格式：

===DAY_START===
序号: 1
标题: 第1天的标题
副标题: 简短描述或主题
---GOALS---
今天的学习目标（可以多行）
- 目标1
- 目标2
---END_GOALS---
---MAIN_CONTENT---
主要练习/学习内容（可以多行，保持原有格式和段落）

这里可以包含多个小节、练习活动等

**活动1：标题**
内容描述...

**活动2：标题**
内容描述...
---END_MAIN_CONTENT---
---DURATION---
预计时长：20-30分钟
---END_DURATION---
---TIPS---
温馨提示或注意事项（可选，如果没有就留空）
---END_TIPS---
===DAY_END===

===DAY_START===
序号: 2
标题: 第2天的标题
...
===DAY_END===

**重要规则**：
1. 每天的内容用 ===DAY_START=== 和 ===DAY_END=== 包裹
2. 必填字段：序号、标题、MAIN_CONTENT
3. 可选字段：副标题、GOALS、DURATION、TIPS（如果文档中没有，就不要输出该段）
4. 字段内容用 ---字段名--- 和 ---END_字段名--- 包裹
5. 序号从1开始递增
6. 保持原文的换行、格式、小标题、列表等
7. 不要添加任何其他解释性文字
8. 如果某天有多个练习活动，全部放在MAIN_CONTENT中，保持原有结构

文档内容：
`

// 辅助函数：解析分隔符格式的文本 (用于listening课程)
function parseDelimitedText(resultText: string): any[] {
  const contents: any[] = []

  // 按DAY分割
  const days = resultText.split('===DAY_START===').filter(d => d.trim())

  logger.debug('[课程解析] 检测到DAY块', { count: days.length })

  for (const dayText of days) {
    try {
      const content: any = {}

      // 提取序号
      const seqMatch = dayText.match(/序号:\s*(\d+)/)
      content.sequence_number = seqMatch ? parseInt(seqMatch[1]) : 0

      // 提取标题
      const titleMatch = dayText.match(/标题:\s*(.+?)(?:\n|$)/)
      content.title = titleMatch ? titleMatch[1].trim() : ''

      // 提取副标题
      const subtitleMatch = dayText.match(/副标题:\s*(.+?)(?:\n|$)/)
      content.subtitle = subtitleMatch ? subtitleMatch[1].trim() : ''

      // 提取原文
      const originalMatch = dayText.match(/---ORIGINAL_TEXT---\s*([\s\S]*?)---END_ORIGINAL_TEXT---/)
      content.original_text = originalMatch ? originalMatch[1].trim() : ''

      // 提取深度解读
      const deepMatch = dayText.match(/---DEEP_INTERPRETATION---\s*([\s\S]*?)---END_DEEP_INTERPRETATION---/)
      content.deep_interpretation = deepMatch ? deepMatch[1].trim() : ''

      // 提取冥想引导
      const meditationMatch = dayText.match(/---MEDITATION_GUIDE---\s*([\s\S]*?)---END_MEDITATION_GUIDE---/)
      content.meditation_guide = meditationMatch ? meditationMatch[1].trim() : ''

      // 提取生活实践
      const practiceMatch = dayText.match(/---LIFE_PRACTICE---\s*([\s\S]*?)---END_LIFE_PRACTICE---/)
      content.life_practice = practiceMatch ? practiceMatch[1].trim() : ''

      if (content.sequence_number > 0 && content.title) {
        contents.push(content)
        logger.debug('[课程解析] 解析天数成功', { day: content.sequence_number, title: content.title })
      }
    } catch (error) {
      logger.error('[课程解析] 解析DAY块失败', error)
    }
  }

  return contents
}

// 辅助函数：解析通用日序列课程的分隔符格式
function parseGenericDailyText(resultText: string): any[] {
  const contents: any[] = []

  // 按DAY分割
  const days = resultText.split('===DAY_START===').filter(d => d.trim())

  logger.debug('[课程解析] 检测到Daily DAY块', { count: days.length })

  for (const dayText of days) {
    try {
      const content: any = {}

      // 提取序号
      const seqMatch = dayText.match(/序号:\s*(\d+)/)
      content.sequence_number = seqMatch ? parseInt(seqMatch[1]) : 0

      // 提取标题
      const titleMatch = dayText.match(/标题:\s*(.+?)(?:\n|$)/)
      content.title = titleMatch ? titleMatch[1].trim() : ''

      // 提取副标题（可选）
      const subtitleMatch = dayText.match(/副标题:\s*(.+?)(?:\n|$)/)
      content.subtitle = subtitleMatch ? subtitleMatch[1].trim() : ''

      // 提取目标（可选）
      const goalsMatch = dayText.match(/---GOALS---\s*([\s\S]*?)---END_GOALS---/)
      content.goals = goalsMatch ? goalsMatch[1].trim() : ''

      // 提取主要内容（必填）
      const mainContentMatch = dayText.match(/---MAIN_CONTENT---\s*([\s\S]*?)---END_MAIN_CONTENT---/)
      content.main_content = mainContentMatch ? mainContentMatch[1].trim() : ''

      // 提取时长（可选）
      const durationMatch = dayText.match(/---DURATION---\s*([\s\S]*?)---END_DURATION---/)
      content.duration = durationMatch ? durationMatch[1].trim() : ''

      // 提取提示（可选）
      const tipsMatch = dayText.match(/---TIPS---\s*([\s\S]*?)---END_TIPS---/)
      content.tips = tipsMatch ? tipsMatch[1].trim() : ''

      // 验证必填字段
      if (content.sequence_number > 0 && content.title && content.main_content) {
        contents.push(content)
        logger.debug('[课程解析] 解析Daily天数成功', { day: content.sequence_number, title: content.title })
      } else {
        logger.debug('[课程解析] 跳过不完整的DAY块', { day: content.sequence_number, hasTitle: !!content.title, hasContent: !!content.main_content })
      }
    } catch (error) {
      logger.error('[课程解析] 解析Daily DAY块失败', error)
    }
  }

  return contents
}

// 辅助函数：解析和清理JSON（用于其他课程类型）
function parseAndCleanJSON(resultText: string): any | null {
  // 清理返回的JSON（移除可能的Markdown代码块标记）
  let cleanedText = resultText.trim()

  // 尝试多种清理方式
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  // 移除可能的前后空白和注释
  cleanedText = cleanedText.trim()

  // 如果还不是以 { 开头，尝试找到第一个 {
  if (!cleanedText.startsWith('{')) {
    const firstBrace = cleanedText.indexOf('{')
    if (firstBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace)
    }
  }

  // 如果还不是以 } 结尾，尝试找到最后一个 }
  if (!cleanedText.endsWith('}')) {
    const lastBrace = cleanedText.lastIndexOf('}')
    if (lastBrace !== -1) {
      cleanedText = cleanedText.substring(0, lastBrace + 1)
    }
  }

  logger.debug('[课程解析] 清理后的JSON预览', { preview: cleanedText.substring(0, 200) })

  // 解析JSON
  let parsedData
  try {
    parsedData = JSON.parse(cleanedText)
    return parsedData
  } catch (parseError) {
    logger.error('[课程解析] JSON解析失败', parseError)

    // 尝试修复常见的JSON问题
    logger.debug('[课程解析] 尝试修复JSON格式')

    let fixedText = cleanedText

    // 修复1: 移除对象/数组末尾的多余逗号
    fixedText = fixedText.replace(/,(\s*[}\]])/g, '$1')

    // 修复2: 移除可能的控制字符
    fixedText = fixedText.replace(/[\x00-\x1F\x7F]/g, '')

    // 第二次尝试解析
    try {
      parsedData = JSON.parse(fixedText)
      logger.debug('[课程解析] JSON修复成功')
      return parsedData
    } catch (secondError) {
      logger.error('[课程解析] 修复后仍然解析失败', secondError)
      return null
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // SEC-10: 请求大小限制（10MB，课程文档可能较大）
    const contentLength = request.headers.get('content-length')
    const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024 // 10MB
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: '请求体过大，最大允许10MB' },
        { status: 413 }
      )
    }

    // 检查API密钥
    if (!apiKey) {
      return NextResponse.json(
        {
          error: '服务器配置错误：未设置 GEMINI_API_KEY',
          hint: '请在 .env.local 文件中添加: GEMINI_API_KEY=你的密钥'
        },
        { status: 500 }
      )
    }

    const { documentContent } = await request.json()

    if (!documentContent) {
      return NextResponse.json(
        { error: '缺少文档内容' },
        { status: 400 }
      )
    }

    // 初始化 Gemini AI
    const ai = new GoogleGenAI({ apiKey })

    logger.debug('步骤1：智能识别课程类型', { docLength: documentContent.length })

    // 第一步：识别课程类型
    let identifyResponse
    try {
      identifyResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: IDENTIFY_COURSE_TYPE_PROMPT + documentContent.substring(0, 3000), // 只使用前3000字符识别类型
      })
    } catch (apiError) {
      logger.error('Gemini API 调用失败', apiError)
      // SEC-01: 生产环境不暴露错误详情
      return NextResponse.json(
        { error: 'AI服务暂时不可用，请稍后重试' },
        { status: 503 }
      )
    }

    const identifyText = identifyResponse.text
    logger.debug('识别步骤返回', { length: identifyText?.length || 0 })

    if (!identifyText) {
      return NextResponse.json(
        { error: 'AI识别课程类型失败：返回内容为空' },
        { status: 500 }
      )
    }

    // 解析识别结果（键值对格式）
    const cleanedIdentifyText = identifyText.trim()

    // 使用正则提取键值对
    const courseTypeMatch = cleanedIdentifyText.match(/COURSE_TYPE:\s*(.+?)(?:\n|$)/i)
    const titleMatch = cleanedIdentifyText.match(/TITLE:\s*(.+?)(?:\n|$)/i)
    // 使用[\s\S]代替.来匹配包括换行符的所有字符
    const descriptionMatch = cleanedIdentifyText.match(/DESCRIPTION:\s*([\s\S]+?)(?:\nSYSTEM_KEY:|$)/i)
    const systemKeyMatch = cleanedIdentifyText.match(/SYSTEM_KEY:\s*(.+?)(?:\n|$)/i)

    const courseType = courseTypeMatch ? courseTypeMatch[1].trim() : null
    const title = titleMatch ? titleMatch[1].trim() : null
    const description = descriptionMatch ? descriptionMatch[1].trim() : null
    const system_key = systemKeyMatch ? systemKeyMatch[1].trim() : null

    if (!courseType || !title || !description) {
      logger.error('识别结果解析失败，缺少必要字段', { courseType, hasTitle: !!title, hasDesc: !!description })
      return NextResponse.json(
        { error: 'AI识别结果格式不正确，请重试' },
        { status: 500 }
      )
    }

    logger.info('课程类型识别成功', { courseType, title })

    // 根据课程类型选择提示词和数据库structure_type
    let systemPrompt = ''
    let structureType = ''

    switch (courseType) {
      case 'listening':
        systemPrompt = LISTENING_PROMPT + documentContent
        structureType = 'daily_sequential'  // 14天课程 = 日序列
        break
      case 'earth':
        systemPrompt = EARTH_PROMPT + documentContent
        structureType = 'module_matrix'  // 模块化课程 = 模块矩阵
        break
      case 'pbl':
        systemPrompt = PBL_PROMPT + documentContent
        structureType = 'stage_sequential'  // PBL项目 = 阶段序列
        break
      case 'daily':
        systemPrompt = DAILY_PROMPT + documentContent
        structureType = 'daily_sequential'  // 通用日序列课程 = 日序列
        break
      default:
        return NextResponse.json(
          { error: `不支持的课程类型: ${courseType}` },
          { status: 400 }
        )
    }

    logger.debug('步骤2：详细解析课程内容', { structureType, docLength: documentContent.length })

    // 判断是否需要分批处理
    const MAX_CHUNK_SIZE = 15000 // 每批最多处理15000字符
    let allContents: any[] = []

    if (documentContent.length > MAX_CHUNK_SIZE && (courseType === 'listening' || courseType === 'daily')) {
      logger.debug('[课程解析] 文档过长，启用分批解析模式')

      // 将文档按天分割（假设每天用 ### **第X天 开头）
      const dayPattern = /###\s*\*\*第(\d+)天/g
      const matches = [...documentContent.matchAll(dayPattern)]

      if (matches.length >= 2) {
        logger.debug('[课程解析] 按天分批处理', { dayCount: matches.length })

        // 分成两批：前一半和后一半
        const midPoint = Math.floor(matches.length / 2)
        const midIndex = matches[midPoint].index || 0

        const chunk1 = documentContent.substring(0, midIndex)
        const chunk2 = documentContent.substring(midIndex)

        logger.debug('[课程解析] 分批长度', { chunk1: chunk1.length, chunk2: chunk2.length })

        // 选择正确的prompt和parser
        const prompt = courseType === 'listening' ? LISTENING_PROMPT : DAILY_PROMPT
        const parser = courseType === 'listening' ? parseDelimitedText : parseGenericDailyText

        // 解析第一批
        logger.debug('[课程解析] 开始解析第一批')
        const prompt1 = prompt + chunk1
        const response1 = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt1,
        })

        const result1 = response1.text
        if (result1) {
          const parsed1 = parser(result1)
          if (parsed1 && parsed1.length > 0) {
            allContents.push(...parsed1)
            logger.debug('[课程解析] 第一批解析成功', { count: parsed1.length })
          } else {
            logger.debug('[课程解析] 第一批解析结果为空')
          }
        }

        // 解析第二批
        logger.debug('[课程解析] 开始解析第二批')
        const prompt2 = prompt + chunk2
        const response2 = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt2,
        })

        const result2 = response2.text
        if (result2) {
          const parsed2 = parser(result2)
          if (parsed2 && parsed2.length > 0) {
            // 调整sequence_number
            const offset = allContents.length
            parsed2.forEach((content: any) => {
              content.sequence_number = content.sequence_number + offset
            })
            allContents.push(...parsed2)
            logger.debug('[课程解析] 第二批解析成功', { count: parsed2.length })
          } else {
            logger.debug('[课程解析] 第二批解析结果为空')
          }
        }

        logger.debug('[课程解析] 分批解析完成', { total: allContents.length })
      } else {
        // 无法按天分割，使用简单的字符分割
        logger.debug('[课程解析] 无法按天分割，使用字符分割')
        const chunk1 = documentContent.substring(0, MAX_CHUNK_SIZE)
        const chunk2 = documentContent.substring(MAX_CHUNK_SIZE)

        const prompt = courseType === 'listening' ? LISTENING_PROMPT : DAILY_PROMPT
        const parser = courseType === 'listening' ? parseDelimitedText : parseGenericDailyText

        const prompt1 = prompt + chunk1
        const response1 = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt1,
        })

        if (response1.text) {
          const parsed1 = parser(response1.text)
          if (parsed1 && parsed1.length > 0) allContents.push(...parsed1)
        }

        const prompt2 = prompt + chunk2
        const response2 = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt2,
        })

        if (response2.text) {
          const parsed2 = parser(response2.text)
          if (parsed2 && parsed2.length > 0) {
            const offset = allContents.length
            parsed2.forEach((content: any) => {
              content.sequence_number = content.sequence_number + offset
            })
            allContents.push(...parsed2)
          }
        }
      }
    } else {
      // 正常处理（不分批）
      logger.debug('[课程解析] 文档长度适中，单次解析')

      // Listening和Daily课程使用分隔符格式，其他课程使用JSON
      const prompt = systemPrompt

      let response
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
        })
      } catch (apiError) {
        logger.error('Gemini API 详细解析调用失败', apiError)
        return NextResponse.json(
          { error: 'AI服务暂时不可用，请稍后重试' },
          { status: 503 }
        )
      }

      const resultText = response.text
      logger.debug('详细解析返回', { length: resultText?.length || 0 })

      if (!resultText) {
        logger.error('Gemini API 返回空内容')
        return NextResponse.json(
          { error: 'AI返回的内容为空，请重试' },
          { status: 500 }
        )
      }

      if (courseType === 'listening') {
        // 使用listening分隔符解析
        allContents = parseDelimitedText(resultText)
      } else if (courseType === 'daily') {
        // 使用通用daily分隔符解析
        allContents = parseGenericDailyText(resultText)
      } else {
        // 使用JSON解析（earth, pbl）
        const parsedData = parseAndCleanJSON(resultText)
        if (!parsedData) {
          return NextResponse.json(
            { error: '解析失败' },
            { status: 500 }
          )
        }
        allContents = parsedData.contents || []
      }
    }

    logger.info('解析完成', { totalUnits: allContents.length })

    // 验证返回的数据结构
    if (!allContents || !Array.isArray(allContents) || allContents.length === 0) {
      return NextResponse.json(
        { error: 'AI返回的数据结构不完整（缺少contents数组或内容为空）' },
        { status: 500 }
      )
    }

    // 构建完整的课程数据（使用AI识别的信息）
    const courseData = {
      system_key: system_key || title.toLowerCase().replace(/[^a-z0-9]/gi, '-').substring(0, 50),
      title,
      description,
      structure_type: structureType,
      teaching_goals: description,
      guidance_keywords: [],
      contents: allContents.map((content: any) => ({
        ...content,
        content_type: structureType === 'stage_sequential' ? 'pbl_project' : 'module',
        is_published: false
      }))
    }

    logger.info('课程数据构建完成', { contentCount: courseData.contents.length })

    return NextResponse.json({ course: courseData })

  } catch (error) {
    logger.error('课程解析失败', error)
    // SEC-01: 生产环境不暴露错误详情
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : '解析失败')
          : '解析失败，请重试'
      },
      { status: 500 }
    )
  }
}
