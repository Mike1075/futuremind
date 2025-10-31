import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// 初始化 Gemini AI
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables')
}

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

    const { title, description, courseType, documentContent } = await request.json()

    if (!title || !description || !courseType || !documentContent) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

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
          { error: '不支持的课程类型' },
          { status: 400 }
        )
    }

    // 调用 Gemini API
    const ai = new GoogleGenAI({ apiKey })

    console.log('🤖 开始调用 Gemini API...')
    console.log('📝 课程类型:', courseType)
    console.log('📄 文档长度:', documentContent.length)

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',  // 使用最新的Flash模型
      contents: systemPrompt,
    })

    const resultText = response.text
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
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/\n?```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/, '').replace(/\n?```$/, '')
    }

    // 解析JSON
    let parsedData
    try {
      parsedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError)
      console.error('原始返回:', cleanedText.substring(0, 500))
      return NextResponse.json(
        {
          error: 'AI返回的内容格式不正确',
          details: parseError instanceof Error ? parseError.message : '未知错误'
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

    // 生成system_key（使用小写的标题拼音或简化标识）
    const systemKey = title.toLowerCase()
      .replace(/[·：:]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, '')
      .substring(0, 50)

    // 构建完整的课程数据
    const courseData = {
      system_key: systemKey,
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
