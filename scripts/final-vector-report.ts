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

async function generateFinalReport() {
  console.log('='.repeat(80))
  console.log('📊 Supabase向量数据库最终报告')
  console.log('='.repeat(80))
  console.log()

  try {
    // 1. 查看所有gaia_knowledge_base记录（源文件）
    console.log('📁 第一部分：源文件记录（gaia_knowledge_base）')
    console.log('='.repeat(80))

    const { data: kbRecords, error: kbError } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .order('created_at', { ascending: false })

    if (kbError) {
      console.error('❌ 查询失败:', kbError.message)
    } else if (!kbRecords || kbRecords.length === 0) {
      console.log('⚠️ 没有找到任何源文件记录')
    } else {
      console.log(`✅ 共找到 ${kbRecords.length} 个源文件记录\n`)

      // 按项目分组统计
      const projectFiles = new Map<string, any[]>()
      kbRecords.forEach(record => {
        const metadata = record.metadata as any
        const projectId = metadata?.custom_project_id || 'unknown'
        if (!projectFiles.has(projectId)) {
          projectFiles.set(projectId, [])
        }
        projectFiles.get(projectId)!.push(record)
      })

      // 显示每个项目的文件
      Array.from(projectFiles.keys()).sort().forEach(projectId => {
        const files = projectFiles.get(projectId)!
        console.log(`\n📂 项目 ${projectId} (${files.length} 个文件):`)
        console.log('-'.repeat(80))
        files.forEach((file, index) => {
          const metadata = file.metadata as any
          console.log(`  ${index + 1}. ${file.title}`)
          console.log(`     文件名: ${metadata?.filename || 'N/A'}`)
          console.log(`     状态: ${metadata?.status || 'N/A'}`)
          console.log(`     大小: ${metadata?.file_size ? (metadata.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}`)
          console.log(`     上传时间: ${metadata?.uploaded_at || 'N/A'}`)
          console.log(`     记录ID: ${file.id}`)
          console.log()
        })
      })
    }

    // 2. 查看所有向量块（实际的embedding数据）
    console.log()
    console.log('🔢 第二部分：向量块统计（实际embedding数据）')
    console.log('='.repeat(80))

    // 获取所有记录并统计
    const { data: allDocs, error: allError } = await supabase
      .from('documents')
      .select('id, metadata, created_at, embedding')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ 查询失败:', allError.message)
    } else if (!allDocs || allDocs.length === 0) {
      console.log('⚠️ 没有找到任何记录')
    } else {
      console.log(`✅ documents表总记录数: ${allDocs.length}\n`)

      // 分类统计
      let kbCount = 0
      let chunkCount = 0
      const projectChunks = new Map<string, number>()
      let hasEmbeddingCount = 0

      allDocs.forEach((doc: any) => {
        const metadata = doc.metadata as any

        // 统计有embedding的记录
        if (doc.embedding) {
          hasEmbeddingCount++
        }

        if (metadata?.type === 'gaia_knowledge_base') {
          kbCount++
        } else if (metadata?.project_id) {
          chunkCount++
          const projectId = metadata.project_id
          projectChunks.set(projectId, (projectChunks.get(projectId) || 0) + 1)
        }
      })

      console.log('📊 数据类型分布:')
      console.log(`  - 源文件记录 (gaia_knowledge_base): ${kbCount}`)
      console.log(`  - 向量块记录 (chunks with project_id): ${chunkCount}`)
      console.log(`  - 其他记录: ${allDocs.length - kbCount - chunkCount}`)
      console.log(`  - 包含embedding的记录: ${hasEmbeddingCount}`)

      console.log()
      console.log('📈 各项目向量块统计:')
      console.log('-'.repeat(80))

      if (projectChunks.size === 0) {
        console.log('⚠️ 没有找到任何项目的向量块')
      } else {
        const sortedProjects = Array.from(projectChunks.entries()).sort((a, b) => a[0].localeCompare(b[0]))
        sortedProjects.forEach(([projectId, count]) => {
          console.log(`  ${projectId}: ${count} 个向量块`)
        })

        console.log()
        console.log(`✅ 共有 ${projectChunks.size} 个项目生成了向量数据`)
      }
    }

    // 3. 检查特定项目的详细信息
    console.log()
    console.log('🔍 第三部分：项目详细检查')
    console.log('='.repeat(80))

    const projectsToCheck = ['p001', 'p002', 'p003', 'p004']

    for (const projectId of projectsToCheck) {
      console.log()
      console.log(`\n检查项目: ${projectId}`)
      console.log('-'.repeat(40))

      // 检查源文件
      const { data: kbFiles, error: kbErr } = await supabase
        .from('documents')
        .select('id, title, metadata')
        .eq('metadata->>type', 'gaia_knowledge_base')
        .eq('metadata->>custom_project_id', projectId)

      if (!kbErr && kbFiles && kbFiles.length > 0) {
        console.log(`  ✅ 源文件: ${kbFiles.length} 个`)
        kbFiles.forEach((file, idx) => {
          const metadata = file.metadata as any
          console.log(`     ${idx + 1}. ${metadata?.filename || file.title}`)
        })
      } else {
        console.log(`  ❌ 源文件: 0 个`)
      }

      // 检查向量块
      const { data: chunks, error: chunkErr, count } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: false })
        .filter('metadata', 'cs', JSON.stringify({ project_id: projectId }))
        .limit(3)

      if (!chunkErr && chunks && chunks.length > 0) {
        console.log(`  ✅ 向量块: ${count} 个`)
        console.log(`     示例块:`)
        chunks.slice(0, 2).forEach((chunk: any, idx) => {
          const metadata = chunk.metadata as any
          console.log(`       - ${metadata?.title || 'Untitled'}`)
          console.log(`         内容: ${chunk.content?.substring(0, 50)}...`)
        })
      } else {
        console.log(`  ❌ 向量块: 0 个`)
      }
    }

    // 4. 查询可能的问题
    console.log()
    console.log()
    console.log('⚠️  第四部分：潜在问题检查')
    console.log('='.repeat(80))

    // 检查是否有status为processing但很久没更新的记录
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: stuckRecords, error: stuckErr } = await supabase
      .from('documents')
      .select('id, title, metadata, created_at')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .eq('metadata->>status', 'processing')
      .lt('created_at', oneDayAgo)

    if (stuckErr) {
      console.log('无法检查stuck记录')
    } else if (stuckRecords && stuckRecords.length > 0) {
      console.log(`\n⚠️ 发现 ${stuckRecords.length} 个可能卡住的记录（status=processing但超过24小时）:`)
      stuckRecords.forEach((record, idx) => {
        const metadata = record.metadata as any
        console.log(`  ${idx + 1}. ${record.title}`)
        console.log(`     项目: ${metadata?.custom_project_id}`)
        console.log(`     创建时间: ${record.created_at}`)
      })
    } else {
      console.log('\n✅ 没有发现卡住的记录')
    }

    // 检查是否有源文件但没有向量块的项目
    console.log()
    if (kbRecords && allDocs) {
      const projectsWithFiles = new Set<string>()
      const projectsWithChunks = new Set<string>()

      kbRecords.forEach(record => {
        const metadata = record.metadata as any
        if (metadata?.custom_project_id) {
          projectsWithFiles.add(metadata.custom_project_id)
        }
      })

      allDocs.forEach((doc: any) => {
        const metadata = doc.metadata as any
        if (metadata?.project_id) {
          projectsWithChunks.add(metadata.project_id)
        }
      })

      const missingChunks = Array.from(projectsWithFiles).filter(p => !projectsWithChunks.has(p))
      if (missingChunks.length > 0) {
        console.log(`⚠️ 发现 ${missingChunks.length} 个项目有源文件但没有向量块:`)
        missingChunks.forEach(projectId => {
          console.log(`  - ${projectId}`)
        })
      } else {
        console.log('✅ 所有有源文件的项目都已生成向量块')
      }
    }

  } catch (error) {
    console.error('❌ 发生错误:', error)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ 报告生成完成')
  console.log('='.repeat(80))
}

// 运行报告
generateFinalReport()
