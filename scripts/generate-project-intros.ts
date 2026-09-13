import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 项目分类规则
const projectCategories = {
  '我的宠物的第六感日记': {
    module: '模块1：观察与感知',
    difficulty: '基础探索',
    promptSuffix: '适合初学者,通过日常观察宠物行为来探索'
  },
  '薛定谔的猫砂盆：测试意念的非定域性': {
    module: '模块2：量子与意识',
    difficulty: '进阶挑战',
    promptSuffix: '需要理解量子力学基础概念'
  },
  '贝尔不等式与狗狗：设计生物版贝尔实验': {
    module: '模块2：量子与意识',
    difficulty: '深度研究',
    promptSuffix: '需要设计复杂实验,理解贝尔不等式'
  },
  '全球意识场项目：人与动物意识场的全球同步性实验': {
    module: '模块3：集体意识',
    difficulty: '创新实践',
    promptSuffix: '大规模协作项目,涉及数据分析'
  },
  '植物的悄悄话：我的植物认识我吗？': {
    module: '模块1：观察与感知',
    difficulty: '基础探索',
    promptSuffix: '通过培养植物进行长期观察'
  },
  '远程蚁巢：构建虚拟家园实验': {
    module: '模块3：集体意识',
    difficulty: '进阶挑战',
    promptSuffix: '研究社会性昆虫的集体行为'
  },
  '记忆的水实验：水能记住家的位置吗？': {
    module: '模块2：量子与意识',
    difficulty: '进阶挑战',
    promptSuffix: '探索物质的记忆特性'
  },
  '意识地理学：绘制城市的情绪地图': {
    module: '模块3：集体意识',
    difficulty: '深度研究',
    promptSuffix: '需要数据采集、可视化和分析能力'
  },
  '情绪的颜色：我能感觉到你的心情吗？': {
    module: '模块1：观察与感知',
    difficulty: '基础探索',
    promptSuffix: '通过社交互动探索共情能力'
  },
  '跨越距离的凝视：互联网能传递凝视吗？': {
    module: '模块2：量子与意识',
    difficulty: '进阶挑战',
    promptSuffix: '远程感知实验,需要网络协作'
  },
  '随机数生成器与集体意念：我们的思想能影响概率吗？': {
    module: '模块3：集体意识',
    difficulty: '深度研究',
    promptSuffix: '需要统计学知识和数据分析'
  },
  '幻肢与纠缠：测试身体部分的非定域连接': {
    module: '模块2：量子与意识',
    difficulty: '创新实践',
    promptSuffix: '探索身心关系的前沿课题'
  }
}

async function generateProjectIntro(title: string, category: any): Promise<string> {
  const prompt = `你是一位教育专家。请为以下PBL探索项目撰写一段简短而精彩的项目简介（150-200字）。

项目标题：${title}
难度级别：${category.difficulty}
所属模块：${category.module}
特点：${category.promptSuffix}

要求：
1. 用通俗易懂但富有吸引力的语言
2. 强调项目的探索性和实践性
3. 激发学生的好奇心和参与热情
4. 点明项目的核心价值和学习目标
5. 语气要友好、鼓励、充满期待

请直接输出项目简介，不要包含标题或其他格式。`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    return text.trim()
  } catch (error) {
    console.error(`Failed to generate intro for ${title}:`, error)
    // 返回一个默认简介
    return `探索${title}的奥秘！这是一个充满创意的实践项目，你将通过亲手设计实验和观察，发现日常生活中隐藏的奇妙现象。在这个过程中，你不仅会学到科学方法，更会培养独立思考和探索未知的能力。准备好开启你的探索之旅了吗？`
  }
}

async function updateProject(id: string, updates: any) {
  const { error } = await supabase
    .from('course_contents')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error(`Failed to update project ${id}:`, error)
  } else {
    console.log(`✓ Updated project: ${updates.title}`)
  }
}

async function main() {
  console.log('🚀 Starting project intro generation...\n')

  // 获取所有项目
  const { data: projects, error } = await supabase
    .from('course_contents')
    .select('id, title')
    .eq('content_type', 'icarus')
    .order('sequence_number')

  if (error || !projects) {
    console.error('Failed to fetch projects:', error)
    return
  }

  console.log(`Found ${projects.length} projects\n`)

  for (const project of projects) {
    const category = projectCategories[project.title as keyof typeof projectCategories]

    if (!category) {
      console.log(`⚠️  Skipping ${project.title} - no category defined`)
      continue
    }

    console.log(`Processing: ${project.title}`)
    console.log(`  Module: ${category.module}`)
    console.log(`  Difficulty: ${category.difficulty}`)

    // 生成项目简介
    const intro = await generateProjectIntro(project.title, category)
    console.log(`  Intro: ${intro.substring(0, 60)}...`)

    // 更新数据库
    await updateProject(project.id, {
      project_intro: intro,
      module_name: category.module,
      difficulty_level: category.difficulty
    })

    // 避免API限流
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log()
  }

  console.log('✅ All projects updated!')
}

main().catch(console.error)
