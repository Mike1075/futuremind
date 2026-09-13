import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function exportSampleDocuments() {
  console.log('📤 导出p001样本文档...\n')

  // 获取前5条记录作为样本
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .filter('metadata->>project_id', 'eq', 'p001')
    .order('created_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data && data.length > 0) {
    // 保存为JSON文件
    const outputPath = './scripts/sample-p001-documents.json'
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
    console.log(`✅ 已导出 ${data.length} 条样本文档到: ${outputPath}`)

    // 打印摘要
    console.log('\n样本文档摘要:\n')
    data.forEach((doc, index) => {
      console.log(`[${index + 1}]`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  Project: ${doc.metadata?.project_id}`)
      console.log(`  Title: ${doc.metadata?.title?.substring(0, 80)}...`)
      console.log(`  Content Length: ${doc.content?.length || 0} chars`)
      console.log(`  Has Embedding: ${doc.embedding ? 'Yes' : 'No'}`)
      console.log(`  Created: ${doc.created_at}`)
      console.log()
    })
  } else {
    console.log('未找到文档')
  }
}

async function checkEmbeddings() {
  console.log('\n🔍 检查向量嵌入状态...\n')

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, embedding')
    .filter('metadata->>project_id', 'eq', 'p001')
    .limit(100)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data) {
    const withEmbedding = data.filter(doc => doc.embedding !== null).length
    const withoutEmbedding = data.filter(doc => doc.embedding === null).length

    console.log(`已检查: ${data.length} 条文档`)
    console.log(`✓ 包含向量: ${withEmbedding} 条`)
    console.log(`✗ 缺少向量: ${withoutEmbedding} 条`)
    console.log(`向量化比例: ${((withEmbedding / data.length) * 100).toFixed(2)}%`)
  }
}

async function findLongestDocuments() {
  console.log('\n📊 查找最长的文档片段...\n')

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata, content')
    .filter('metadata->>project_id', 'eq', 'p001')
    .order('created_at', { ascending: true })
    .limit(1000)

  if (error) {
    console.error('查询错误:', error)
    return
  }

  if (data) {
    // 按内容长度排序
    const sorted = data
      .map(doc => ({
        id: doc.id,
        project_id: doc.metadata?.project_id,
        length: doc.content?.length || 0,
        preview: doc.content?.substring(0, 100)
      }))
      .sort((a, b) => b.length - a.length)
      .slice(0, 5)

    console.log('前5个最长的文档片段:\n')
    sorted.forEach((doc, index) => {
      console.log(`[${index + 1}] ID: ${doc.id}`)
      console.log(`    长度: ${doc.length} 字符`)
      console.log(`    预览: ${doc.preview}...`)
      console.log()
    })
  }
}

async function main() {
  console.log('🚀 开始导出和分析p001文档...\n')
  console.log('=' .repeat(70))

  try {
    await exportSampleDocuments()
    await checkEmbeddings()
    await findLongestDocuments()

    console.log('\n' + '='.repeat(70))
    console.log('✅ 完成！')
  } catch (error) {
    console.error('❌ 执行错误:', error)
  }
}

main().catch(console.error)
