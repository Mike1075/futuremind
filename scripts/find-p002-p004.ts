import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGaiaKBWithCustomProjectId() {
  console.log('\n' + '='.repeat(80))
  console.log('查找 metadata->custom_project_id 为 p002, p003, p004 的记录')
  console.log('='.repeat(80))

  // 检查所有 gaia_knowledge_base 的 custom_project_id
  const { data: allGaia, error: allError } = await supabase
    .from('documents')
    .select('id, metadata, title, content, created_at')
    .eq('metadata->>type', 'gaia_knowledge_base')

  if (allError) {
    console.error('查询错误:', allError)
    return
  }

  console.log(`\n找到 ${allGaia?.length || 0} 条 gaia_knowledge_base 记录`)

  const customProjectIds = new Set<string>()
  allGaia?.forEach((doc: any) => {
    const customId = doc.metadata?.custom_project_id
    if (customId) {
      customProjectIds.add(customId)
    }
  })

  console.log('\n所有 custom_project_id:')
  Array.from(customProjectIds).sort().forEach(id => {
    console.log(`  - ${id}`)
  })

  // 搜索 p002, p003, p004
  const targetIds = ['p002', 'p003', 'p004']

  for (const targetId of targetIds) {
    console.log(`\n--- 搜索 custom_project_id = ${targetId} ---`)

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('metadata->>custom_project_id', targetId)

    if (error) {
      console.error(`查询 ${targetId} 错误:`, error)
      continue
    }

    if (data && data.length > 0) {
      console.log(`找到 ${data.length} 条记录:`)
      data.forEach((doc: any, index: number) => {
        console.log(`\n[${index + 1}]`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  Title: ${doc.title || 'N/A'}`)
        console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
        console.log(`  Status: ${doc.metadata?.status || 'N/A'}`)
        console.log(`  Filename: ${doc.metadata?.filename || 'N/A'}`)
        console.log(`  File Size: ${doc.metadata?.file_size || 'N/A'}`)
        console.log(`  File Type: ${doc.metadata?.file_type || 'N/A'}`)
        console.log(`  Uploaded At: ${doc.metadata?.uploaded_at || 'N/A'}`)
        console.log(`  Content Length: ${doc.content?.length || 0}`)
        console.log(`  Has Embedding: ${doc.embedding ? 'Yes' : 'No'}`)
        console.log(`  Created: ${doc.created_at}`)

        if (doc.metadata) {
          console.log(`  Full Metadata:`, JSON.stringify(doc.metadata, null, 2))
        }
      })
    } else {
      console.log(`未找到 custom_project_id = ${targetId} 的记录`)
    }
  }
}

async function searchProcessingStatus() {
  console.log('\n' + '='.repeat(80))
  console.log('检查所有 status = processing 的记录')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, title, content, created_at')
    .eq('metadata->>status', 'processing')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n找到 ${data?.length || 0} 条 processing 状态的记录`)

  if (data && data.length > 0) {
    data.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Title: ${doc.title || 'N/A'}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  Custom Project ID: ${doc.metadata?.custom_project_id || 'N/A'}`)
      console.log(`  Status: ${doc.metadata?.status || 'N/A'}`)
      console.log(`  Filename: ${doc.metadata?.filename || 'N/A'}`)
      console.log(`  Created: ${doc.created_at}`)
    })
  }
}

async function searchCompletedStatus() {
  console.log('\n' + '='.repeat(80))
  console.log('检查所有 status = completed 的记录')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, title, content, created_at')
    .eq('metadata->>status', 'completed')
    .limit(10)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n找到 ${data?.length || 0} 条 completed 状态的记录（显示前10条）`)

  if (data && data.length > 0) {
    data.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Title: ${doc.title || doc.metadata?.title || 'N/A'}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Custom Project ID: ${doc.metadata?.custom_project_id || 'N/A'}`)
      console.log(`  Content Length: ${doc.content?.length || 0}`)
      console.log(`  Created: ${doc.created_at}`)
    })
  }
}

async function checkAllStatuses() {
  console.log('\n' + '='.repeat(80))
  console.log('统计所有 status 值')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  const statusStats = new Map<string, number>()

  data?.forEach((doc: any) => {
    const status = doc.metadata?.status || 'null'
    statusStats.set(status, (statusStats.get(status) || 0) + 1)
  })

  console.log('\n所有 status 值统计:')
  const sorted = Array.from(statusStats.entries()).sort((a, b) => b[1] - a[1])
  sorted.forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 条记录`)
  })
}

async function searchAllCustomProjectIds() {
  console.log('\n' + '='.repeat(80))
  console.log('查找所有不同的 custom_project_id')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')
    .not('metadata->>custom_project_id', 'is', null)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  const customProjectIds = new Map<string, number>()

  data?.forEach((doc: any) => {
    const customId = doc.metadata?.custom_project_id
    if (customId) {
      customProjectIds.set(customId, (customProjectIds.get(customId) || 0) + 1)
    }
  })

  console.log('\n所有 custom_project_id 统计:')
  const sorted = Array.from(customProjectIds.entries()).sort()
  sorted.forEach(([customId, count]) => {
    console.log(`  ${customId}: ${count} 条记录`)
  })
}

async function main() {
  console.log('🔍 查找 p002, p003, p004 的向量数据...\n')
  console.log('=' .repeat(80))

  try {
    await searchAllCustomProjectIds()
    await checkAllStatuses()
    await checkGaiaKBWithCustomProjectId()
    await searchProcessingStatus()
    await searchCompletedStatus()

    console.log('\n' + '='.repeat(80))
    console.log('✅ 搜索完成！')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ 执行错误:', error)
  }
}

main().catch(console.error)
