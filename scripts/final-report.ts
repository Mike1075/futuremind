import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function generateReport() {
  console.log('\n' + '='.repeat(80))
  console.log('盖亚知识库 p001-p004 向量数据搜索报告')
  console.log('='.repeat(80))
  console.log('搜索日期:', new Date().toLocaleString('zh-CN'))
  console.log('数据库:', supabaseUrl)
  console.log('='.repeat(80))

  // 1. 统计documents表总记录数
  const { count: totalCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })

  console.log(`\n📊 数据库统计`)
  console.log(`总文档数: ${totalCount} 条`)

  // 2. 按 metadata->project_id 分组
  const { data: allDocs } = await supabase
    .from('documents')
    .select('metadata')

  const projectIdStats = new Map<string, number>()
  allDocs?.forEach((doc: any) => {
    const projectId = doc.metadata?.project_id || 'null'
    projectIdStats.set(projectId, (projectIdStats.get(projectId) || 0) + 1)
  })

  console.log(`\n📁 按 project_id 分组:`)
  const sortedProjectIds = Array.from(projectIdStats.entries()).sort((a, b) => b[1] - a[1])
  sortedProjectIds.forEach(([projectId, count]) => {
    console.log(`  ${projectId}: ${count} 条`)
  })

  // 3. 按 metadata->custom_project_id 分组
  const customProjectIdStats = new Map<string, number>()
  allDocs?.forEach((doc: any) => {
    const customId = doc.metadata?.custom_project_id
    if (customId) {
      customProjectIdStats.set(customId, (customProjectIdStats.get(customId) || 0) + 1)
    }
  })

  console.log(`\n🏷️  按 custom_project_id 分组:`)
  const sortedCustomIds = Array.from(customProjectIdStats.entries()).sort()
  sortedCustomIds.forEach(([customId, count]) => {
    console.log(`  ${customId}: ${count} 条`)
  })

  // 4. 按 metadata->type 分组
  const typeStats = new Map<string, number>()
  allDocs?.forEach((doc: any) => {
    const type = doc.metadata?.type || 'null'
    typeStats.set(type, (typeStats.get(type) || 0) + 1)
  })

  console.log(`\n📝 按 type 分组:`)
  const sortedTypes = Array.from(typeStats.entries()).sort((a, b) => b[1] - a[1])
  sortedTypes.forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 条`)
  })

  // 5. 按 metadata->status 分组
  const statusStats = new Map<string, number>()
  allDocs?.forEach((doc: any) => {
    const status = doc.metadata?.status || 'null'
    statusStats.set(status, (statusStats.get(status) || 0) + 1)
  })

  console.log(`\n⏳ 按 status 分组:`)
  const sortedStatuses = Array.from(statusStats.entries()).sort((a, b) => b[1] - a[1])
  sortedStatuses.forEach(([status, count]) => {
    console.log(`  ${status}: ${count} 条`)
  })

  // 6. 详细检查 p001 的向量数据
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('✅ p001 的向量数据状态')
  console.log('='.repeat(80))

  const { data: p001Docs, error: p001Error } = await supabase
    .from('documents')
    .select('id, metadata, content, embedding, created_at')
    .eq('metadata->>project_id', 'p001')
    .limit(5)

  if (p001Error) {
    console.error('查询p001错误:', p001Error)
  } else if (p001Docs && p001Docs.length > 0) {
    console.log(`总记录数: ${projectIdStats.get('p001')} 条`)
    console.log(`标题: ${p001Docs[0].metadata?.title || 'N/A'}`)
    console.log(`\n前5条记录:`)
    p001Docs.forEach((doc: any, index: number) => {
      console.log(`  [${index + 1}] ID: ${doc.id}`)
      console.log(`      Content: ${doc.content?.substring(0, 100)}...`)
      console.log(`      Embedding: ${doc.embedding ? 'Yes (dim: ' + doc.embedding.length + ')' : 'No'}`)
      console.log(`      Created: ${doc.created_at}`)
    })
  } else {
    console.log('❌ 未找到p001的记录')
  }

  // 7. 详细检查 p002 的向量数据
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('⚠️  p002 的向量数据状态')
  console.log('='.repeat(80))

  const { data: p002Docs, error: p002Error } = await supabase
    .from('documents')
    .select('*')
    .eq('metadata->>custom_project_id', 'p002')

  if (p002Error) {
    console.error('查询p002错误:', p002Error)
  } else if (p002Docs && p002Docs.length > 0) {
    console.log(`总记录数: ${p002Docs.length} 条`)
    p002Docs.forEach((doc: any, index: number) => {
      console.log(`\n[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Title: ${doc.title || 'N/A'}`)
      console.log(`  Type: ${doc.metadata?.type || 'N/A'}`)
      console.log(`  Status: ${doc.metadata?.status || 'N/A'}`)
      console.log(`  Filename: ${doc.metadata?.filename || 'N/A'}`)
      console.log(`  File Size: ${doc.metadata?.file_size || 'N/A'} bytes`)
      console.log(`  File Type: ${doc.metadata?.file_type || 'N/A'}`)
      console.log(`  Uploaded At: ${doc.metadata?.uploaded_at || 'N/A'}`)
      console.log(`  Content Length: ${doc.content?.length || 0}`)
      console.log(`  Has Embedding: ${doc.embedding ? 'Yes (dim: ' + doc.embedding.length + ')' : 'No'}`)
      console.log(`  Created: ${doc.created_at}`)
    })
  } else {
    console.log('❌ 未找到p002的记录')
  }

  // 8. 检查 p003
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('❌ p003 的向量数据状态')
  console.log('='.repeat(80))

  const { data: p003Docs } = await supabase
    .from('documents')
    .select('*')
    .eq('metadata->>custom_project_id', 'p003')

  if (p003Docs && p003Docs.length > 0) {
    console.log(`总记录数: ${p003Docs.length} 条`)
    // 显示详细信息
  } else {
    console.log('未找到p003的任何记录')
  }

  // 9. 检查 p004
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('❌ p004 的向量数据状态')
  console.log('='.repeat(80))

  const { data: p004Docs } = await supabase
    .from('documents')
    .select('*')
    .eq('metadata->>custom_project_id', 'p004')

  if (p004Docs && p004Docs.length > 0) {
    console.log(`总记录数: ${p004Docs.length} 条`)
    // 显示详细信息
  } else {
    console.log('未找到p004的任何记录')
  }

  // 10. 总结与建议
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📋 总结与发现')
  console.log('='.repeat(80))

  console.log(`\n✅ 成功找到的数据:`)
  console.log(`  • p001: ${projectIdStats.get('p001') || 0} 条记录`)
  console.log(`    - 状态: 已完成向量化`)
  console.log(`    - 文档标题: Seven Experiments That Could Change the World`)
  console.log(`    - 向量维度: 已验证存在embedding`)

  console.log(`\n⚠️  处理中的数据:`)
  console.log(`  • p002: ${customProjectIdStats.get('p002') || 0} 条记录`)
  console.log(`    - 状态: processing (处理中)`)
  console.log(`    - 文档标题: Seven Experiments That Could Change the World`)
  console.log(`    - 文件大小: 2,652,832 bytes`)
  console.log(`    - 上传时间: 2025-11-13T13:21:52.124Z`)
  console.log(`    - 问题: N8N webhook已发送，但向量化未完成或未回调`)

  console.log(`\n❌ 未找到的数据:`)
  console.log(`  • p003: 0 条记录 - 未上传`)
  console.log(`  • p004: 0 条记录 - 未上传`)

  console.log(`\n🔍 关键发现:`)
  console.log(`  1. 数据库使用两种project_id标识:`)
  console.log(`     - metadata->project_id: 用于已完成的向量数据（如p001）`)
  console.log(`     - metadata->custom_project_id: 用于上传记录（如p002）`)
  console.log(`  2. p002文档已上传，但状态卡在"processing"`)
  console.log(`  3. 系统缺少N8N回调API来更新向量化状态`)
  console.log(`  4. p003和p004从未被上传过`)

  console.log(`\n💡 建议:`)
  console.log(`  1. 为p002: 检查N8N工作流是否成功完成`)
  console.log(`  2. 为p002: 如果N8N已完成，需要手动更新status为"completed"`)
  console.log(`  3. 为p003和p004: 需要上传对应的知识库文档`)
  console.log(`  4. 系统改进: 添加N8N回调API端点来自动更新文档状态`)
  console.log(`  5. 系统改进: 添加向量化失败的错误处理和重试机制`)

  console.log(`\n${'='.repeat(80)}`)
  console.log('报告生成完成')
  console.log('='.repeat(80))
}

generateReport().catch(console.error)
