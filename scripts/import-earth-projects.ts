import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🚀 Starting Earth course explorer projects import...\n')

  // 读取项目数据
  const projectsPath = path.join(__dirname, 'earth-explorer-projects.json')
  const projectsData = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'))

  // 地球课程的 system_id
  const earthSystemId = '6db82cfb-6def-4ce4-a50d-5eb9f391032f'

  // 获取地球课程的所有阶段内容
  const { data: earthStages, error: fetchError } = await supabase
    .from('course_contents')
    .select('id, title, sequence_number')
    .eq('system_id', earthSystemId)
    .eq('content_type', 'stage')
    .order('sequence_number')

  if (fetchError || !earthStages) {
    console.error('Failed to fetch Earth course stages:', fetchError)
    return
  }

  console.log(`Found ${earthStages.length} Earth course stages\n`)

  // 映射阶段到项目数据
  const stageMapping: Record<number, string> = {
    1: 'stage1',
    2: 'stage2',
    3: 'stage3',
    4: 'stage4',
    5: 'stage5',
    6: 'stage6'
  }

  for (const stage of earthStages) {
    const stageKey = stageMapping[stage.sequence_number]

    if (!stageKey || !projectsData[stageKey]) {
      console.log(`⚠️  No project data found for stage ${stage.sequence_number}`)
      continue
    }

    const stageProjects = projectsData[stageKey]

    console.log(`Processing Stage ${stage.sequence_number}: ${stage.title}`)
    console.log(`  Stage Title: ${stageProjects.stage_title}`)
    console.log(`  Projects: ${stageProjects.projects.length}`)

    // 更新数据库
    const { error: updateError } = await supabase
      .from('course_contents')
      .update({
        explorer_projects: stageProjects.projects
      })
      .eq('id', stage.id)

    if (updateError) {
      console.error(`  ❌ Failed to update stage ${stage.sequence_number}:`, updateError)
    } else {
      console.log(`  ✓ Successfully imported ${stageProjects.projects.length} projects`)
      stageProjects.projects.forEach((p: any, idx: number) => {
        console.log(`    ${idx + 1}. ${p.title} - ${p.difficulty}`)
      })
    }
    console.log()
  }

  console.log('✅ Earth course explorer projects import completed!')
}

main().catch(console.error)
