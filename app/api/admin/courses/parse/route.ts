import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// 初始化 Gemini AI
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables')
}

// 智能识别课程类型的提示词
const IDENTIFY_COURSE_TYPE_PROMPT = `你是一个专业的课程分析专家。请分析以下课程文档，识别其课程类型并提取基本信息。

**课程类型分类**：
1. **listening**：14天系列课程，每天包含原文摘录、深度解读、冥想练习、生活实践
2. **earth**：模块化课程，包含知识点、苏格拉底式问题、观后思考
3. **pbl**：项目式学习，包含周计划、每日计划、活动安排、可交付成果

请严格按照以下JSON Schema格式输出：

{
  "course_type": "listening | earth | pbl",
  "title": "课程标题",
  "description": "课程描述",
  "system_key": "课程唯一标识（小写英文，用-连接）"
}

**重要规则**：
1. 只输出有效的JSON，不要添加任何Markdown代码块标记
2. course_type必须是：listening、earth、pbl 其中之一
3. 根据文档内容智能判断类型
4. system_key应该简洁明了，例如：listening-journey, earth-exploration, pbl-project-1

文档内容：
`

// Listening课程的提示词模板
const LISTENING_PROMPT = `你是一个专业的课程内容结构化专家。请将以下Listening课程文档解析为JSON格式。

课程特点：
- 14天的系列课程
- 每天包含：原文摘录、深度解读、冥想练习与引导、生活中的小练习

请严格按照以下JSON Schema格式输出：

{
  "contents": [
    {
      "sequence_number": 1,
      "title": "第1天的标题",
      "subtitle": "副标题",
      "original_text": "原文摘录的完整内容",
      "deep_interpretation": "第一部分：深度解读的完整内容",
      "meditation_guide": "第二部分：冥想练习与引导的完整内容",
      "life_practice": "第三部分：生活中的小练习的完整内容"
    }
  ]
}

**重要规则**：
1. 只输出有效的JSON，不要添加任何Markdown代码块标记（如 \`\`\`json）
2. sequence_number从1开始递增
3. 确保所有字符串都正确转义
4. 如果某个字段内容缺失，使用空字符串""

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

export async function POST(request: NextRequest) {
  try {
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

    console.log('🤖 步骤1：智能识别课程类型...')
    console.log('📄 文档长度:', documentContent.length)
    console.log('📄 文档预览 (前200字符):', documentContent.substring(0, 200))

    // 第一步：识别课程类型
    let identifyResponse
    try {
      identifyResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: IDENTIFY_COURSE_TYPE_PROMPT + documentContent.substring(0, 3000), // 只使用前3000字符识别类型
      })
    } catch (apiError) {
      console.error('❌ Gemini API 调用失败:', apiError)
      return NextResponse.json(
        {
          error: 'Gemini API 调用失败',
          details: apiError instanceof Error ? apiError.message : '未知错误'
        },
        { status: 500 }
      )
    }

    const identifyText = identifyResponse.text
    console.log('📥 识别步骤返回长度:', identifyText?.length || 0)
    console.log('📥 识别步骤返回内容 (前500字符):', identifyText?.substring(0, 500))

    if (!identifyText) {
      return NextResponse.json(
        { error: 'AI识别课程类型失败：返回内容为空' },
        { status: 500 }
      )
    }

    // 解析识别结果
    let cleanedIdentifyText = identifyText.trim()

    // 尝试多种清理方式
    if (cleanedIdentifyText.startsWith('```json')) {
      cleanedIdentifyText = cleanedIdentifyText.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '')
    } else if (cleanedIdentifyText.startsWith('```')) {
      cleanedIdentifyText = cleanedIdentifyText.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '')
    }

    cleanedIdentifyText = cleanedIdentifyText.trim()

    // 如果还不是以 { 开头，尝试找到第一个 {
    if (!cleanedIdentifyText.startsWith('{')) {
      const firstBrace = cleanedIdentifyText.indexOf('{')
      if (firstBrace !== -1) {
        cleanedIdentifyText = cleanedIdentifyText.substring(firstBrace)
      }
    }

    // 如果还不是以 } 结尾，尝试找到最后一个 }
    if (!cleanedIdentifyText.endsWith('}')) {
      const lastBrace = cleanedIdentifyText.lastIndexOf('}')
      if (lastBrace !== -1) {
        cleanedIdentifyText = cleanedIdentifyText.substring(0, lastBrace + 1)
      }
    }

    console.log('🔍 识别结果JSON预览:', cleanedIdentifyText.substring(0, 200))

    let courseInfo
    try {
      courseInfo = JSON.parse(cleanedIdentifyText)
    } catch (parseError) {
      console.error('❌ 识别结果解析失败:', parseError)
      console.error('📄 识别返回内容:', cleanedIdentifyText)
      return NextResponse.json(
        {
          error: 'AI识别结果格式不正确',
          details: parseError instanceof Error ? parseError.message : '未知错误',
          preview: cleanedIdentifyText.substring(0, 500)
        },
        { status: 500 }
      )
    }

    const { course_type: courseType, title, description, system_key } = courseInfo

    console.log('✅ 课程类型识别成功:', courseType)
    console.log('📚 课程标题:', title)
    console.log('📝 课程描述:', description)

    // 根据课程类型选择提示词
    let systemPrompt = ''
    let structureType = ''

    switch (courseType) {
      case 'listening':
        systemPrompt = LISTENING_PROMPT + documentContent
        structureType = 'listening'
        break
      case 'earth':
        systemPrompt = EARTH_PROMPT + documentContent
        structureType = 'earth'
        break
      case 'pbl':
        systemPrompt = PBL_PROMPT + documentContent
        structureType = 'pbl_project'
        break
      default:
        return NextResponse.json(
          { error: `不支持的课程类型: ${courseType}` },
          { status: 400 }
        )
    }

    console.log('🤖 步骤2：详细解析课程内容...')
    console.log('📝 使用的提示词类型:', structureType)
    console.log('📝 提示词长度:', systemPrompt.length)

    let response
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',  // 使用最新的Flash模型
        contents: systemPrompt,
      })
    } catch (apiError) {
      console.error('❌ Gemini API 详细解析调用失败:', apiError)
      return NextResponse.json(
        {
          error: 'Gemini API 详细解析调用失败',
          details: apiError instanceof Error ? apiError.message : '未知错误'
        },
        { status: 500 }
      )
    }

    const resultText = response.text
    console.log('📥 详细解析返回长度:', resultText?.length || 0)
    console.log('📥 详细解析返回 (前500字符):', resultText?.substring(0, 500))
    console.log('📥 详细解析返回 (后500字符):', resultText?.substring(Math.max(0, (resultText?.length || 0) - 500)))

    if (!resultText) {
      console.error('❌ Gemini API 返回空内容')
      return NextResponse.json(
        { error: 'AI返回的内容为空，请重试' },
        { status: 500 }
      )
    }

    console.log('✅ Gemini API 返回成功')
    console.log('📊 返回内容长度:', resultText.length)

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

    console.log('🔍 清理后的JSON预览 (前200字符):', cleanedText.substring(0, 200))
    console.log('🔍 清理后的JSON预览 (后200字符):', cleanedText.substring(cleanedText.length - 200))

    // 解析JSON
    let parsedData
    try {
      parsedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError)
      console.error('📄 清理后的完整内容:', cleanedText)
      return NextResponse.json(
        {
          error: 'AI返回的内容格式不正确',
          details: parseError instanceof Error ? parseError.message : '未知错误',
          preview: cleanedText.substring(0, 1000)
        },
        { status: 500 }
      )
    }

    // 验证返回的数据结构
    if (!parsedData.contents || !Array.isArray(parsedData.contents)) {
      return NextResponse.json(
        { error: 'AI返回的数据结构不完整（缺少contents数组）' },
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
      contents: parsedData.contents.map((content: any) => ({
        ...content,
        content_type: structureType === 'pbl_project' ? 'pbl_project' : 'module',
        is_published: false
      }))
    }

    console.log('✨ 课程数据构建完成')
    console.log('📚 内容单元数:', courseData.contents.length)

    return NextResponse.json({ course: courseData })

  } catch (error) {
    console.error('❌ 解析失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '解析失败，请重试',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
