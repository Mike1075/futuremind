import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deepCheckMetadata() {
  console.log('='.repeat(80))
  console.log('🔍 深入检查metadata字段结构')
  console.log('='.repeat(80))
  console.log()

  try {
    // 1. 查看最新的几条记录，完整显示metadata
    console.log('1️⃣ 查看最新记录的完整metadata结构：')
    console.log('-'.repeat(80))

    const { data: recentDocs, error: recentError } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('❌ 查询失败:', recentError.message)
    } else if (recentDocs && recentDocs.length > 0) {
      recentDocs.forEach((doc, index) => {
        console.log(`\n记录 ${index + 1}:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  标题: ${doc.title}`)
        console.log(`  创建时间: ${doc.created_at}`)
        console.log(`  Metadata完整内容:`)
        console.log(JSON.stringify(doc.metadata, null, 4))
        console.log()
      })
    }

    // 2. 专门查看p002的记录
    console.log()
    console.log('2️⃣ 查看p002相关的记录（从gaia_knowledge_base）：')
    console.log('-'.repeat(80))

    const { data: p002Kb, error: p002KbError } = await supabase
      .from('documents')
      .select('*')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .eq('metadata->>custom_project_id', 'p002')
      .order('created_at', { ascending: false })

    if (p002KbError) {
      console.error('❌ 查询失败:', p002KbError.message)
    } else if (!p002Kb || p002Kb.length === 0) {
      console.log('⚠️ 没有找到p002的gaia_knowledge_base记录')
    } else {
      console.log(`✅ 找到 ${p002Kb.length} 条p002的gaia_knowledge_base记录：\n`)
      p002Kb.forEach((doc: any, index) => {
        console.log(`记录 ${index + 1}:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  标题: ${doc.title}`)
        console.log(`  创建时间: ${doc.created_at}`)
        console.log(`  Metadata:`)
        console.log(JSON.stringify(doc.metadata, null, 4))
        console.log()
      })
    }

    // 3. 直接用SQL查询检查p002的向量块
    console.log()
    console.log('3️⃣ 使用RPC查询p002的向量块：')
    console.log('-'.repeat(80))

    // 先尝试查询是否有metadata中包含p002的记录
    const { data: p002Chunks, error: p002ChunksError } = await supabase
      .from('documents')
      .select('id, title, content, metadata, created_at')
      .filter('metadata', 'cs', JSON.stringify({ project_id: 'p002' }))
      .limit(5)

    if (p002ChunksError) {
      console.log('⚠️ 使用contains查询失败，尝试其他方法...')

      // 尝试获取所有记录并手动过滤
      const { data: allDocs, error: allError } = await supabase
        .from('documents')
        .select('id, title, content, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (allError) {
        console.error('❌ 查询失败:', allError.message)
      } else if (allDocs) {
        const p002Docs = allDocs.filter((doc: any) => {
          const metadata = doc.metadata as any
          return metadata?.project_id === 'p002' || metadata?.custom_project_id === 'p002'
        })

        console.log(`✅ 在最新1000条记录中，找到 ${p002Docs.length} 条p002相关记录\n`)

        if (p002Docs.length > 0) {
          console.log('前5条记录：')
          p002Docs.slice(0, 5).forEach((doc: any, index) => {
            console.log(`\n记录 ${index + 1}:`)
            console.log(`  ID: ${doc.id}`)
            console.log(`  标题: ${doc.title}`)
            console.log(`  内容预览: ${doc.content?.substring(0, 100)}...`)
            console.log(`  创建时间: ${doc.created_at}`)
            console.log(`  Metadata:`)
            console.log(JSON.stringify(doc.metadata, null, 4))
          })
        }
      }
    } else if (p002Chunks && p002Chunks.length > 0) {
      console.log(`✅ 找到 ${p002Chunks.length} 条p002的向量块：\n`)
      p002Chunks.forEach((doc: any, index) => {
        console.log(`记录 ${index + 1}:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  标题: ${doc.title}`)
        console.log(`  内容预览: ${doc.content?.substring(0, 100)}...`)
        console.log(`  创建时间: ${doc.created_at}`)
        console.log(`  Metadata:`)
        console.log(JSON.stringify(doc.metadata, null, 4))
        console.log()
      })
    }

    // 4. 检查metadata中不同的键名
    console.log()
    console.log('4️⃣ 分析metadata中使用的键名：')
    console.log('-'.repeat(80))

    const { data: sampleDocs, error: sampleError } = await supabase
      .from('documents')
      .select('metadata')
      .limit(100)

    if (sampleError) {
      console.error('❌ 查询失败:', sampleError.message)
    } else if (sampleDocs) {
      const allKeys = new Set<string>()
      sampleDocs.forEach((doc: any) => {
        if (doc.metadata && typeof doc.metadata === 'object') {
          Object.keys(doc.metadata).forEach(key => allKeys.add(key))
        }
      })

      console.log(`✅ 在100条记录中发现的metadata键名：`)
      Array.from(allKeys).sort().forEach(key => {
        console.log(`  - ${key}`)
      })
    }

  } catch (error) {
    console.error('❌ 发生错误:', error)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ 深入检查完成')
  console.log('='.repeat(80))
}

// 运行检查
deepCheckMetadata()
