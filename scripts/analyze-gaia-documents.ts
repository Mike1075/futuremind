import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeP001Details() {
  console.log('\n=== p001 详细分析 ===\n')

  // 获取前10条记录的详细信息
  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, content, created_at')
    .filter('metadata->>project_id', 'eq', 'p001')
    .order('created_at', { ascending: true })
    .limit(10)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    console.log(`找到 ${data.length} 条记录\n`)

    data.forEach((doc: any, index: number) => {
      console.log(`[${index + 1}] Document ID: ${doc.id}`)
      console.log(`    Metadata:`, JSON.stringify(doc.metadata, null, 2))
      console.log(`    Content Length: ${doc.content?.length || 0} characters`)
      console.log(`    Content Preview: ${doc.content?.substring(0, 150) || 'N/A'}...`)
      console.log(`    Created: ${doc.created_at}`)
      console.log()
    })
  }
}

async function searchByKeywords() {
  console.log('\n=== 关键词搜索 ===\n')

  const keywords = [
    { term: '伊卡洛斯', name: '伊卡洛斯计划' },
    { term: 'Icarus', name: 'Icarus Project' },
    { term: '观音', name: '观音之旅' },
    { term: '聆听', name: '聆听' },
    { term: '卡罗', name: '卡罗洛韦里' },
    { term: 'Rovelli', name: 'Rovelli' },
    { term: 'Carlo', name: 'Carlo' },
    { term: '欢迎来到地球', name: '欢迎来到地球' },
    { term: 'Welcome to Earth', name: 'Welcome to Earth' },
    { term: 'Seven Experiments', name: 'Seven Experiments' },
    { term: 'pigeons', name: 'pigeons (实验相关)' },
    { term: 'dogs', name: 'dogs (实验相关)' },
    { term: 'telepathy', name: 'telepathy (心灵感应)' }
  ]

  for (const keyword of keywords) {
    const { data, error } = await supabase
      .from('documents')
      .select('id, metadata')
      .ilike('content', `%${keyword.term}%`)
      .limit(3)

    if (error) {
      console.error(`查询 "${keyword.term}" 错误:`, error)
      continue
    }

    if (data && data.length > 0) {
      console.log(`✓ 找到 "${keyword.term}" (${keyword.name}): ${data.length} 条记录`)
      data.forEach((doc: any) => {
        console.log(`  - ID: ${doc.id}, Project: ${doc.metadata?.project_id || 'N/A'}`)
      })
    } else {
      console.log(`✗ 未找到 "${keyword.term}" (${keyword.name})`)
    }
  }
}

async function getAllDocumentsStats() {
  console.log('\n\n=== 数据库整体统计 ===\n')

  // 总文档数
  const { count: totalCount, error: countError } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('统计错误:', countError)
  } else {
    console.log(`总文档数: ${totalCount}`)
  }

  // 按project_id分组统计
  const { data: allDocs, error: allError } = await supabase
    .from('documents')
    .select('metadata')
    .limit(1000)

  if (allError) {
    console.error('查询错误:', allError)
    return
  }

  if (allDocs) {
    const projectMap = new Map<string, number>()

    allDocs.forEach((doc: any) => {
      const projectId = doc.metadata?.project_id || 'no_project_id'
      projectMap.set(projectId, (projectMap.get(projectId) || 0) + 1)
    })

    console.log('\n按项目ID分组:')
    Array.from(projectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([projectId, count]) => {
        console.log(`  ${projectId}: ${count} 条记录`)
      })
  }
}

async function checkMetadataStructure() {
  console.log('\n\n=== Metadata 结构分析 ===\n')

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')
    .limit(20)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('前20条记录的 metadata 结构:\n')

    const metadataKeys = new Set<string>()
    data.forEach((doc: any) => {
      if (doc.metadata) {
        Object.keys(doc.metadata).forEach(key => metadataKeys.add(key))
      }
    })

    console.log('发现的 metadata 字段:')
    Array.from(metadataKeys).sort().forEach(key => {
      console.log(`  - ${key}`)
    })

    console.log('\n前5条记录的完整 metadata:')
    data.slice(0, 5).forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]:`, JSON.stringify(doc.metadata, null, 2))
    })
  }
}

async function searchP001Content() {
  console.log('\n\n=== p001 内容关键词搜索 ===\n')

  const { data, error } = await supabase
    .from('documents')
    .select('id, content')
    .filter('metadata->>project_id', 'eq', 'p001')
    .ilike('content', '%experiment%')
    .limit(3)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    console.log(`找到 ${data.length} 条包含 "experiment" 的记录:\n`)

    data.forEach((doc: any, index: number) => {
      console.log(`[${index + 1}] ID: ${doc.id}`)
      console.log(`Content: ${doc.content?.substring(0, 300)}...`)
      console.log()
    })
  }
}

async function main() {
  console.log('🔍 深度分析盖亚知识库向量数据...\n')
  console.log('连接到 Supabase:', supabaseUrl)
  console.log('=' .repeat(70))

  try {
    // 执行所有分析
    await getAllDocumentsStats()
    await checkMetadataStructure()
    await analyzeP001Details()
    await searchByKeywords()
    await searchP001Content()

    console.log('\n' + '='.repeat(70))
    console.log('✅ 分析完成！')

  } catch (error) {
    console.error('❌ 执行错误:', error)
  }
}

main().catch(console.error)
