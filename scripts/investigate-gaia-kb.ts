import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateGaiaKB() {
  console.log('\n' + '='.repeat(80))
  console.log('调查 gaia_knowledge_base 类型的记录')
  console.log('='.repeat(80))

  // 查看所有 gaia_knowledge_base 类型的记录
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('metadata->>type', 'gaia_knowledge_base')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n找到 ${data?.length || 0} 条 gaia_knowledge_base 类型的记录`)

  if (data && data.length > 0) {
    data.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Metadata:`, JSON.stringify(doc.metadata, null, 2))
      console.log(`  Title: ${doc.title || 'N/A'}`)
      console.log(`  Content Length: ${doc.content?.length || 0}`)
      console.log(`  Content Preview: ${doc.content?.substring(0, 200) || 'N/A'}`)
      console.log(`  Has Embedding: ${doc.embedding ? 'Yes' : 'No'}`)
      console.log(`  Created: ${doc.created_at}`)
    })
  }
}

async function checkAllTypes() {
  console.log('\n' + '='.repeat(80))
  console.log('检查所有不同的 type 值')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('metadata')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  const typeStats = new Map<string, number>()

  data?.forEach((doc: any) => {
    const type = doc.metadata?.type || 'null'
    typeStats.set(type, (typeStats.get(type) || 0) + 1)
  })

  console.log('\n所有 type 值统计:')
  const sorted = Array.from(typeStats.entries()).sort((a, b) => b[1] - a[1])
  sorted.forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 条记录`)
  })
}

async function checkTotalDocuments() {
  console.log('\n' + '='.repeat(80))
  console.log('检查 documents 表的总记录数')
  console.log('='.repeat(80))

  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n总记录数: ${count}`)
}

async function checkEmptyContent() {
  console.log('\n' + '='.repeat(80))
  console.log('检查所有空content的记录')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, title, content, created_at')
    .or('content.is.null,content.eq.')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n找到 ${data?.length || 0} 条空content的记录`)

  if (data && data.length > 0) {
    data.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Title: ${doc.title || doc.metadata?.title || 'N/A'}`)
      console.log(`  Created: ${doc.created_at}`)
    })
  }
}

async function checkProjectsTable() {
  console.log('\n' + '='.repeat(80))
  console.log('检查 projects 表的内容')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('projects')
    .select('*')

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n找到 ${data?.length || 0} 个项目`)

  if (data && data.length > 0) {
    data.forEach((project: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${project.id}`)
      console.log(`  Title: ${project.title}`)
      console.log(`  Description: ${project.description?.substring(0, 100) || 'N/A'}`)
      console.log(`  Type: ${project.type || 'N/A'}`)
      console.log(`  Category: ${project.category || 'N/A'}`)
      console.log(`  Knowledge Base ID: ${project.knowledge_base_id || 'N/A'}`)
      console.log(`  Created: ${project.created_at}`)
    })
  }
}

async function searchByKnowledgeBaseId() {
  console.log('\n' + '='.repeat(80))
  console.log('通过 knowledge_base_id 搜索文档')
  console.log('='.repeat(80))

  // 先获取所有项目的 knowledge_base_id
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, title, knowledge_base_id')

  if (projectError) {
    console.error('查询项目错误:', projectError)
    return
  }

  console.log(`\n找到 ${projects?.length || 0} 个项目`)

  if (projects && projects.length > 0) {
    for (const project of projects) {
      if (project.knowledge_base_id) {
        console.log(`\n--- 项目: ${project.title} (${project.id}) ---`)
        console.log(`Knowledge Base ID: ${project.knowledge_base_id}`)

        // 搜索对应的文档
        const { data: docs, error: docError } = await supabase
          .from('documents')
          .select('id, metadata, title, content, created_at')
          .eq('id', project.knowledge_base_id)

        if (docError) {
          console.error('查询文档错误:', docError)
          continue
        }

        if (docs && docs.length > 0) {
          console.log(`找到对应的文档:`)
          docs.forEach((doc: any) => {
            console.log(`  Document ID: ${doc.id}`)
            console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
            console.log(`  Title: ${doc.title || doc.metadata?.title || 'N/A'}`)
            console.log(`  Content Length: ${doc.content?.length || 0}`)
          })
        } else {
          console.log('未找到对应的文档')
        }
      }
    }
  }
}

async function searchByBlobType() {
  console.log('\n' + '='.repeat(80))
  console.log('检查 metadata 中的 blobType')
  console.log('='.repeat(80))

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, title, content, created_at')
    .not('metadata->>blobType', 'is', null)
    .limit(20)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  console.log(`\n找到 ${data?.length || 0} 条有 blobType 的记录`)

  if (data && data.length > 0) {
    data.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  BlobType: ${doc.metadata?.blobType || 'N/A'}`)
      console.log(`  Project ID: ${doc.metadata?.project_id || 'N/A'}`)
      console.log(`  Title: ${doc.title || doc.metadata?.title || 'N/A'}`)
      console.log(`  Content Length: ${doc.content?.length || 0}`)
    })
  }
}

async function main() {
  console.log('🔍 深入调查向量数据库...\n')
  console.log('=' .repeat(80))

  try {
    await checkTotalDocuments()
    await checkAllTypes()
    await investigateGaiaKB()
    await checkEmptyContent()
    await checkProjectsTable()
    await searchByKnowledgeBaseId()
    await searchByBlobType()

    console.log('\n' + '='.repeat(80))
    console.log('✅ 调查完成！')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ 执行错误:', error)
  }
}

main().catch(console.error)
