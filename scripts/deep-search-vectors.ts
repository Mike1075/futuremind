import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function query1_ProjectGrouping() {
  console.log('\n' + '='.repeat(80))
  console.log('查询1: documents表按project_id分组统计')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata, id')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  // 手动分组统计
  const grouping = new Map<string, number>()

  data?.forEach((doc: any) => {
    const projectId = doc.metadata?.project_id || 'null'
    grouping.set(projectId, (grouping.get(projectId) || 0) + 1)
  })

  console.log('\n按 metadata->project_id 分组:')
  const sorted = Array.from(grouping.entries()).sort((a, b) => b[1] - a[1])
  sorted.forEach(([projectId, count]) => {
    console.log(`  ${projectId}: ${count} 条记录`)
  })
  console.log(`\n总计: ${data?.length || 0} 条记录`)
}

async function query2_SearchP002P003P004() {
  console.log('\n' + '='.repeat(80))
  console.log('查询2: 搜索包含p002/p003/p004的记录')
  console.log('='.repeat(80))

  const projectIds = ['p002', 'p003', 'p004']

  for (const pid of projectIds) {
    console.log(`\n--- 搜索 ${pid} ---`)

    const { data, error } = await supabase
      .from('documents')
      .select('id, metadata, created_at')
      .or(`metadata->>project_id.eq.${pid},metadata->>title.ilike.%${pid}%`)
      .limit(5)

    if (error) {
      console.error(`查询 ${pid} 错误:`, error)
      continue
    }

    if (data && data.length > 0) {
      console.log(`找到 ${data.length} 条记录:`)
      data.forEach((doc: any) => {
        console.log(`  ID: ${doc.id}`)
        console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
        console.log(`  Title: ${doc.metadata?.title || 'N/A'}`)
        console.log(`  Created: ${doc.created_at}`)
        console.log()
      })
    } else {
      console.log(`未找到 ${pid} 的记录`)
    }
  }
}

async function query3_MetadataKeys() {
  console.log('\n' + '='.repeat(80))
  console.log('查询3: metadata中所有不同的键名')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')
    .limit(1000)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  const allKeys = new Set<string>()

  data?.forEach((doc: any) => {
    if (doc.metadata) {
      Object.keys(doc.metadata).forEach(key => allKeys.add(key))
    }
  })

  console.log('\n找到的metadata键名:')
  Array.from(allKeys).sort().forEach(key => {
    console.log(`  - ${key}`)
  })
  console.log(`\n总计: ${allKeys.size} 个不同的键`)
}

async function query4_ContentSearch() {
  console.log('\n' + '='.repeat(80))
  console.log('查询4: 搜索content中的特定内容')
  console.log('='.repeat(80))

  // 搜索观音之旅相关
  console.log('\n--- 搜索"观音之旅"相关内容 ---')
  const { data: data1, error: error1 } = await supabase
    .from('documents')
    .select('id, metadata, content')
    .ilike('content', '%第一天%')
    .ilike('content', '%聆听%')
    .limit(3)

  if (error1) {
    console.error('查询错误:', error1)
  } else {
    console.log(`找到 ${data1?.length || 0} 条包含"第一天"和"聆听"的记录`)
    data1?.forEach((doc: any) => {
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Title: ${doc.metadata?.title || 'N/A'}`)
    })
  }

  // 搜索卡罗洛韦里相关
  console.log('\n--- 搜索"卡罗洛韦里"相关内容 ---')
  const { data: data2, error: error2 } = await supabase
    .from('documents')
    .select('id, metadata, content')
    .or('content.ilike.%热力学%,content.ilike.%时间%')
    .limit(3)

  if (error2) {
    console.error('查询错误:', error2)
  } else {
    console.log(`找到 ${data2?.length || 0} 条包含"热力学"或"时间"的记录`)
    data2?.forEach((doc: any) => {
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Title: ${doc.metadata?.title || 'N/A'}`)
    })
  }

  // 搜索欢迎来到地球相关
  console.log('\n--- 搜索"欢迎来到地球"相关内容 ---')
  const { data: data3, error: error3 } = await supabase
    .from('documents')
    .select('id, metadata, content')
    .or('content.ilike.%威尔史密斯%,content.ilike.%Will Smith%')
    .limit(3)

  if (error3) {
    console.error('查询错误:', error3)
  } else {
    console.log(`找到 ${data3?.length || 0} 条包含"威尔史密斯"或"Will Smith"的记录`)
    data3?.forEach((doc: any) => {
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Title: ${doc.metadata?.title || 'N/A'}`)
    })
  }
}

async function query5_AllTables() {
  console.log('\n' + '='.repeat(80))
  console.log('查询5: 查看所有public表')
  console.log('='.repeat(80))

  const { data, error } = await supabase.rpc('get_all_tables')

  if (error) {
    console.log('RPC查询失败，尝试其他方法...')
    // 列出已知的表
    const knownTables = [
      'documents',
      'profiles',
      'user_progress',
      'projects',
      'submissions',
      'pbl_task_submissions',
      'pbl_tasks'
    ]

    console.log('\n已知的表:')
    for (const table of knownTables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (!countError) {
        console.log(`  - ${table} (${count} 条记录)`)
      }
    }
  } else {
    console.log('\n找到的表:')
    data?.forEach((table: any) => {
      console.log(`  - ${table.table_name}`)
    })
  }
}

async function query6_MetadataTypes() {
  console.log('\n' + '='.repeat(80))
  console.log('查询6: metadata中的type值统计')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')
    .limit(1000)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  // 手动统计
  const typeStats = new Map<string, { count: number, projectIds: Set<string> }>()

  data?.forEach((doc: any) => {
    const type = doc.metadata?.type || 'null'
    const projectId = doc.metadata?.project_id || 'null'

    if (!typeStats.has(type)) {
      typeStats.set(type, { count: 0, projectIds: new Set() })
    }

    const stat = typeStats.get(type)!
    stat.count++
    stat.projectIds.add(projectId)
  })

  console.log('\n按 metadata->type 分组:')
  const sorted = Array.from(typeStats.entries()).sort((a, b) => b[1].count - a[1].count)
  sorted.forEach(([type, stat]) => {
    const projectIdList = Array.from(stat.projectIds).join(', ')
    console.log(`  ${type}: ${stat.count} 条记录`)
    console.log(`    项目: ${projectIdList}`)
  })
}

async function query7_SearchP001() {
  console.log('\n' + '='.repeat(80))
  console.log('查询7: 搜索p001的记录')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, content, created_at')
    .eq('metadata->>project_id', 'p001')
    .limit(10)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    console.log(`\n找到 ${data.length} 条p001的记录:`)
    data.forEach((doc: any) => {
      console.log(`  ID: ${doc.id}`)
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  Title: ${doc.metadata?.title || 'N/A'}`)
      console.log(`  Content Length: ${doc.content?.length || 0}`)
      console.log(`  Created: ${doc.created_at}`)
      console.log()
    })
  } else {
    console.log('\n未找到p001的记录')
  }
}

async function query8_AllDocumentsOverview() {
  console.log('\n' + '='.repeat(80))
  console.log('查询8: 所有文档的概览（前20条）')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, content, embedding, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    console.log(`\n找到 ${data.length} 条记录:`)
    data.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Title: ${doc.metadata?.title || 'N/A'}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  Content Length: ${doc.content?.length || 0}`)
      console.log(`  Has Embedding: ${doc.embedding ? 'Yes' : 'No'}`)
      console.log(`  Created: ${doc.created_at}`)
    })
  } else {
    console.log('\n未找到任何文档')
  }
}

async function query9_SearchAllProjectIds() {
  console.log('\n' + '='.repeat(80))
  console.log('查询9: 查找所有唯一的project_id')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  const projectIds = new Set<string>()
  const projectStats = new Map<string, { count: number, title: string }>()

  data?.forEach((doc: any) => {
    const projectId = doc.metadata?.project_id
    const title = doc.metadata?.title || 'N/A'

    if (projectId) {
      projectIds.add(projectId)

      if (!projectStats.has(projectId)) {
        projectStats.set(projectId, { count: 0, title })
      }

      projectStats.get(projectId)!.count++
    }
  })

  console.log('\n找到的唯一项目ID:')
  Array.from(projectIds).sort().forEach(id => {
    const stats = projectStats.get(id)!
    console.log(`  ${id}: ${stats.count} 条记录`)
    console.log(`    标题: ${stats.title}`)
  })
  console.log(`\n总计: ${projectIds.size} 个不同的项目`)
}

async function query10_DetailedP002P003P004() {
  console.log('\n' + '='.repeat(80))
  console.log('查询10: p002, p003, p004 的详细信息')
  console.log('='.repeat(80))

  const projectIds = ['p002', 'p003', 'p004']

  for (const pid of projectIds) {
    console.log(`\n--- ${pid} 详细信息 ---`)

    const { data, error } = await supabase
      .from('documents')
      .select('id, metadata, content, embedding, created_at')
      .eq('metadata->>project_id', pid)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(`查询 ${pid} 错误:`, error)
      continue
    }

    if (data && data.length > 0) {
      console.log(`总记录数: ${data.length}`)
      console.log(`标题: ${data[0].metadata?.title || 'N/A'}`)
      console.log(`类型: ${data[0].metadata?.type || 'N/A'}`)
      console.log(`首次创建: ${data[0].created_at}`)
      console.log(`最后创建: ${data[data.length - 1].created_at}`)
      console.log(`\n前3条记录的内容预览:`)

      data.slice(0, 3).forEach((doc: any, index: number) => {
        console.log(`\n  [${index + 1}] ID: ${doc.id}`)
        console.log(`      Content: ${doc.content?.substring(0, 150)}...`)
        console.log(`      Has Embedding: ${doc.embedding ? 'Yes (dim: ' + doc.embedding.length + ')' : 'No'}`)
      })
    } else {
      console.log(`未找到 ${pid} 的记录`)
    }
  }
}

async function main() {
  console.log('🔍 开始全面搜索 p001-p004 的向量数据...\n')
  console.log('连接到 Supabase:', supabaseUrl)
  console.log('=' .repeat(80))

  try {
    await query1_ProjectGrouping()
    await query2_SearchP002P003P004()
    await query3_MetadataKeys()
    await query4_ContentSearch()
    await query5_AllTables()
    await query6_MetadataTypes()
    await query7_SearchP001()
    await query8_AllDocumentsOverview()
    await query9_SearchAllProjectIds()
    await query10_DetailedP002P003P004()

    console.log('\n' + '='.repeat(80))
    console.log('✅ 搜索完成！')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ 执行错误:', error)
  }
}

main().catch(console.error)
