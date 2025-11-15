import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 加载环境变量
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少必要的环境变量')
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkVectorData() {
  console.log('='.repeat(80))
  console.log('📊 检查Supabase向量数据库')
  console.log('='.repeat(80))
  console.log()

  try {
    // 1. 查看最新的gaia_knowledge_base记录
    console.log('1️⃣ 查看最新的gaia_knowledge_base记录：')
    console.log('-'.repeat(80))

    const { data: kbRecords, error: kbError } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .order('created_at', { ascending: false })
      .limit(5)

    if (kbError) {
      console.error('❌ 查询失败:', kbError.message)
    } else if (!kbRecords || kbRecords.length === 0) {
      console.log('⚠️ 没有找到gaia_knowledge_base类型的记录')
    } else {
      console.log(`✅ 找到 ${kbRecords.length} 条记录：\n`)
      kbRecords.forEach((record, index) => {
        const metadata = record.metadata as any
        console.log(`记录 ${index + 1}:`)
        console.log(`  ID: ${record.id}`)
        console.log(`  标题: ${record.title}`)
        console.log(`  项目ID: ${metadata?.custom_project_id || 'N/A'}`)
        console.log(`  状态: ${metadata?.status || 'N/A'}`)
        console.log(`  文件名: ${metadata?.filename || 'N/A'}`)
        console.log(`  创建时间: ${record.created_at}`)
        console.log()
      })
    }

    // 2. 查看最新生成的向量块（按project_id分组）
    console.log()
    console.log('2️⃣ 查看按project_id分组的向量块统计：')
    console.log('-'.repeat(80))

    // Supabase不支持直接的GROUP BY，我们需要先获取所有有project_id的记录
    const { data: allDocs, error: allDocsError } = await supabase
      .from('documents')
      .select('metadata, created_at')
      .not('metadata->>project_id', 'is', null)
      .order('created_at', { ascending: false })

    if (allDocsError) {
      console.error('❌ 查询失败:', allDocsError.message)
    } else if (!allDocs || allDocs.length === 0) {
      console.log('⚠️ 没有找到包含project_id的记录')
    } else {
      // 手动分组统计
      const projectStats = new Map<string, {
        count: number
        firstCreated: string
        lastCreated: string
      }>()

      allDocs.forEach(doc => {
        const metadata = doc.metadata as any
        const projectId = metadata?.project_id
        if (projectId) {
          const existing = projectStats.get(projectId)
          if (existing) {
            existing.count++
            if (doc.created_at < existing.firstCreated) {
              existing.firstCreated = doc.created_at
            }
            if (doc.created_at > existing.lastCreated) {
              existing.lastCreated = doc.created_at
            }
          } else {
            projectStats.set(projectId, {
              count: 1,
              firstCreated: doc.created_at,
              lastCreated: doc.created_at
            })
          }
        }
      })

      // 按最后创建时间排序
      const sortedProjects = Array.from(projectStats.entries())
        .sort((a, b) => b[1].lastCreated.localeCompare(a[1].lastCreated))
        .slice(0, 5)

      console.log(`✅ 找到 ${projectStats.size} 个不同的项目，显示最新的5个：\n`)
      sortedProjects.forEach(([projectId, stats], index) => {
        console.log(`项目 ${index + 1}:`)
        console.log(`  项目ID: ${projectId}`)
        console.log(`  向量块数量: ${stats.count}`)
        console.log(`  首次创建: ${stats.firstCreated}`)
        console.log(`  最后创建: ${stats.lastCreated}`)
        console.log()
      })
    }

    // 3. 检查p003的向量数据
    console.log()
    console.log('3️⃣ 检查p003的向量数据：')
    console.log('-'.repeat(80))

    const { data: p003Docs, error: p003Error, count: p003Count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: false })
      .eq('metadata->>project_id', 'p003')

    if (p003Error) {
      console.error('❌ 查询失败:', p003Error.message)
    } else {
      console.log(`✅ p003项目共有 ${p003Count || 0} 个向量块`)
      if (p003Docs && p003Docs.length > 0) {
        console.log(`\n示例记录（前3条）：`)
        p003Docs.slice(0, 3).forEach((doc, index) => {
          const metadata = doc.metadata as any
          console.log(`\n记录 ${index + 1}:`)
          console.log(`  ID: ${doc.id}`)
          console.log(`  内容预览: ${doc.content?.substring(0, 100)}...`)
          console.log(`  元数据: ${JSON.stringify(metadata, null, 2)}`)
        })
      }
    }

    // 4. 查看所有向量数据的project_id列表
    console.log()
    console.log('4️⃣ 所有向量数据的project_id列表：')
    console.log('-'.repeat(80))

    const { data: projectIds, error: projectIdsError } = await supabase
      .from('documents')
      .select('metadata')
      .not('metadata->>project_id', 'is', null)

    if (projectIdsError) {
      console.error('❌ 查询失败:', projectIdsError.message)
    } else if (!projectIds || projectIds.length === 0) {
      console.log('⚠️ 没有找到包含project_id的记录')
    } else {
      const uniqueProjectIds = new Set<string>()
      projectIds.forEach(doc => {
        const metadata = doc.metadata as any
        if (metadata?.project_id) {
          uniqueProjectIds.add(metadata.project_id)
        }
      })

      const sortedProjectIds = Array.from(uniqueProjectIds).sort()
      console.log(`✅ 找到 ${sortedProjectIds.length} 个不同的项目ID：\n`)
      sortedProjectIds.forEach((id, index) => {
        console.log(`  ${index + 1}. ${id}`)
      })
    }

    // 5. 额外检查：查看documents表的总体统计
    console.log()
    console.log('5️⃣ documents表总体统计：')
    console.log('-'.repeat(80))

    const { count: totalCount, error: totalError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('❌ 查询失败:', totalError.message)
    } else {
      console.log(`✅ documents表总记录数: ${totalCount || 0}`)
    }

    // 6. 检查是否有embedding字段
    console.log()
    console.log('6️⃣ 检查向量embedding字段：')
    console.log('-'.repeat(80))

    const { data: sampleDocs, error: sampleError } = await supabase
      .from('documents')
      .select('id, embedding, metadata')
      .not('metadata->>project_id', 'is', null)
      .limit(3)

    if (sampleError) {
      console.error('❌ 查询失败:', sampleError.message)
    } else if (!sampleDocs || sampleDocs.length === 0) {
      console.log('⚠️ 没有找到记录')
    } else {
      console.log(`✅ 检查了 ${sampleDocs.length} 条记录：\n`)
      sampleDocs.forEach((doc: any, index) => {
        const metadata = doc.metadata as any
        console.log(`记录 ${index + 1}:`)
        console.log(`  ID: ${doc.id}`)
        console.log(`  项目ID: ${metadata?.project_id || 'N/A'}`)
        console.log(`  是否有embedding: ${doc.embedding ? '✅ 是' : '❌ 否'}`)
        if (doc.embedding) {
          console.log(`  Embedding维度: ${Array.isArray(doc.embedding) ? doc.embedding.length : 'N/A'}`)
        }
        console.log()
      })
    }

  } catch (error) {
    console.error('❌ 发生错误:', error)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ 检查完成')
  console.log('='.repeat(80))
}

// 运行检查
checkVectorData()
