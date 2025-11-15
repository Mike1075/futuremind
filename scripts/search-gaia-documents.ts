import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface DocumentResult {
  id: string
  project_id: string
  title: string
  content_preview: string
  created_at: string
}

interface ProjectStats {
  project_id: string
  chunk_count: number
  title: string
  first_created: string
  last_created: string
}

interface ProjectSample {
  project_id: string
  content_sample: string
}

async function searchIcarus() {
  console.log('\n=== 1. 搜索"伊卡洛斯"或"Icarus" ===\n')

  const { data, error } = await supabase.rpc('search_documents', {
    search_query: 'Icarus'
  })

  if (error) {
    console.log('使用RPC失败，尝试直接查询...')

    const { data: directData, error: directError } = await supabase
      .from('documents')
      .select('id, metadata, content, created_at')
      .or('content.ilike.%伊卡洛斯%,content.ilike.%Icarus%')
      .limit(5)

    if (directError) {
      console.error('查询错误:', directError)
      return
    }

    if (directData && directData.length > 0) {
      directData.forEach((doc: any) => {
        console.log('ID:', doc.id)
        console.log('Project ID:', doc.metadata?.project_id || 'N/A')
        console.log('Title:', doc.metadata?.title || 'N/A')
        console.log('Content Preview:', doc.content?.substring(0, 100) || 'N/A')
        console.log('Created:', doc.created_at)
        console.log('---')
      })
    } else {
      console.log('未找到包含"伊卡洛斯"或"Icarus"的记录')
    }
  } else {
    console.log('找到记录:', data)
  }
}

async function searchGuanyin() {
  console.log('\n=== 2. 搜索"观音"或"聆听" ===\n')

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, content, created_at')
    .or('content.ilike.%观音%,content.ilike.%聆听%')
    .limit(5)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    data.forEach((doc: any) => {
      console.log('ID:', doc.id)
      console.log('Project ID:', doc.metadata?.project_id || 'N/A')
      console.log('Title:', doc.metadata?.title || 'N/A')
      console.log('Content Preview:', doc.content?.substring(0, 100) || 'N/A')
      console.log('Created:', doc.created_at)
      console.log('---')
    })
  } else {
    console.log('未找到包含"观音"或"聆听"的记录')
  }
}

async function searchRovelli() {
  console.log('\n=== 3. 搜索"卡罗"或"Rovelli"或"Carlo" ===\n')

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, content, created_at')
    .or('content.ilike.%卡罗%,content.ilike.%Rovelli%,content.ilike.%Carlo%')
    .limit(5)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    data.forEach((doc: any) => {
      console.log('ID:', doc.id)
      console.log('Project ID:', doc.metadata?.project_id || 'N/A')
      console.log('Title:', doc.metadata?.title || 'N/A')
      console.log('Content Preview:', doc.content?.substring(0, 100) || 'N/A')
      console.log('Created:', doc.created_at)
      console.log('---')
    })
  } else {
    console.log('未找到包含"卡罗"、"Rovelli"或"Carlo"的记录')
  }
}

async function getProjectStats() {
  console.log('\n=== 4. 项目统计 (p001, p002, p003, p004) ===\n')

  const projectIds = ['p001', 'p002', 'p003', 'p004']

  for (const projectId of projectIds) {
    const { data, error } = await supabase
      .from('documents')
      .select('id, metadata, created_at')
      .filter('metadata->>project_id', 'eq', projectId)

    if (error) {
      console.error(`查询 ${projectId} 错误:`, error)
      continue
    }

    if (data && data.length > 0) {
      const firstCreated = data.reduce((min, doc) =>
        doc.created_at < min ? doc.created_at : min, data[0].created_at)
      const lastCreated = data.reduce((max, doc) =>
        doc.created_at > max ? doc.created_at : max, data[0].created_at)

      console.log(`Project ID: ${projectId}`)
      console.log(`  Chunk Count: ${data.length}`)
      console.log(`  Title: ${data[0].metadata?.title || 'N/A'}`)
      console.log(`  First Created: ${firstCreated}`)
      console.log(`  Last Created: ${lastCreated}`)
      console.log()
    } else {
      console.log(`Project ID: ${projectId} - 未找到记录`)
      console.log()
    }
  }
}

async function getProjectSamples() {
  console.log('\n=== 5. 项目内容样本 ===\n')

  const projectIds = ['p001', 'p002', 'p003', 'p004']

  for (const projectId of projectIds) {
    const { data, error } = await supabase
      .from('documents')
      .select('metadata, content, created_at')
      .filter('metadata->>project_id', 'eq', projectId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (error) {
      console.error(`查询 ${projectId} 错误:`, error)
      continue
    }

    if (data && data.length > 0) {
      console.log(`Project ID: ${projectId}`)
      console.log(`  Title: ${data[0].metadata?.title || 'N/A'}`)
      console.log(`  Content Sample:`)
      console.log(`  ${data[0].content?.substring(0, 200) || 'N/A'}...`)
      console.log()
    } else {
      console.log(`Project ID: ${projectId} - 未找到记录`)
      console.log()
    }
  }
}

async function getAllProjects() {
  console.log('\n=== 6. 查看所有项目 ===\n')

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')
    .not('metadata->>project_id', 'is', null)
    .limit(100)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    const projectIds = new Set<string>()
    data.forEach((doc: any) => {
      if (doc.metadata?.project_id) {
        projectIds.add(doc.metadata.project_id)
      }
    })

    console.log('找到的唯一项目ID:')
    Array.from(projectIds).sort().forEach(id => {
      console.log(`  - ${id}`)
    })
    console.log(`\n总计: ${projectIds.size} 个不同的项目`)
  } else {
    console.log('未找到任何项目')
  }
}

async function main() {
  console.log('🔍 开始搜索盖亚知识库向量数据...\n')
  console.log('连接到 Supabase:', supabaseUrl)
  console.log('=' .repeat(60))

  try {
    // 首先查看所有项目
    await getAllProjects()

    // 执行所有查询
    await searchIcarus()
    await searchGuanyin()
    await searchRovelli()
    await getProjectStats()
    await getProjectSamples()

    console.log('\n' + '='.repeat(60))
    console.log('✅ 查询完成！')

    console.log('\n📊 总结：')
    console.log('- p001: 伊卡洛斯计划')
    console.log('- p002: 观音之旅')
    console.log('- p003: 卡罗洛韦里')
    console.log('- p004: 欢迎来到地球')

  } catch (error) {
    console.error('❌ 执行错误:', error)
  }
}

main().catch(console.error)
