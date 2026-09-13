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

async function testDeleteVector() {
  console.log('='.repeat(80))
  console.log('🧪 测试向量数据删除功能')
  console.log('='.repeat(80))
  console.log()

  try {
    // 1. 先检查p001的数据情况
    console.log('📊 步骤1: 检查p001的数据情况')
    console.log('-'.repeat(80))

    // 查询主记录
    const { data: mainRecords, error: mainError } = await supabase
      .from('documents')
      .select('id, title, metadata')
      .eq('metadata->>type', 'gaia_knowledge_base')
      .eq('metadata->>custom_project_id', 'p001')

    if (mainError) {
      console.error('❌ 查询主记录失败:', mainError)
      return
    }

    console.log(`\n✅ p001的主记录数: ${mainRecords?.length || 0}`)
    if (mainRecords && mainRecords.length > 0) {
      mainRecords.forEach((record, idx) => {
        const metadata = record.metadata as any
        console.log(`\n主记录 ${idx + 1}:`)
        console.log(`  ID: ${record.id}`)
        console.log(`  标题: ${record.title}`)
        console.log(`  文件名: ${metadata?.filename || 'N/A'}`)
        console.log(`  状态: ${metadata?.status || 'N/A'}`)
      })
    }

    // 查询向量块
    const { data: vectorChunks, error: vectorError, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>project_id', 'p001')

    if (vectorError) {
      console.error('❌ 查询向量块失败:', vectorError)
    } else {
      console.log(`\n✅ p001的向量块数: ${count || 0}`)
    }

    // 2. 尝试删除向量块（测试）
    console.log()
    console.log('🗑️  步骤2: 测试删除向量块')
    console.log('-'.repeat(80))
    console.log('准备删除project_id=p001的向量块...')

    const { data: deletedChunks, error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('metadata->>project_id', 'p001')
      .select('id')

    if (deleteError) {
      console.error('\n❌ 删除向量块失败!')
      console.error('错误代码:', deleteError.code)
      console.error('错误消息:', deleteError.message)
      console.error('错误详情:', JSON.stringify(deleteError, null, 2))

      // 检查是否是RLS策略问题
      if (deleteError.code === '42501' || deleteError.message?.includes('policy')) {
        console.log('\n⚠️  这是一个权限问题（RLS策略）!')
        console.log('可能的原因:')
        console.log('  1. documents表启用了Row Level Security (RLS)')
        console.log('  2. 没有为DELETE操作创建适当的策略')
        console.log('  3. Service Role Key没有绕过RLS')
      }
    } else {
      console.log(`\n✅ 删除成功! 共删除 ${deletedChunks?.length || 0} 个向量块`)
      if (deletedChunks && deletedChunks.length > 0) {
        console.log('删除的记录ID:')
        deletedChunks.slice(0, 5).forEach((chunk, idx) => {
          console.log(`  ${idx + 1}. ${chunk.id}`)
        })
        if (deletedChunks.length > 5) {
          console.log(`  ... 还有 ${deletedChunks.length - 5} 个`)
        }
      }
    }

    // 3. 检查RLS策略
    console.log()
    console.log('🔒 步骤3: 检查documents表的RLS策略')
    console.log('-'.repeat(80))

    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'documents' })
      .catch(() => {
        // 如果RPC不存在，手动查询
        return supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'documents')
      })

    if (policyError || !policies) {
      console.log('⚠️  无法查询RLS策略（这是正常的，可能需要特殊权限）')
      console.log('建议手动在Supabase Dashboard中检查RLS策略')
    } else if (Array.isArray(policies) && policies.length > 0) {
      console.log(`\n✅ 找到 ${policies.length} 个RLS策略:`)
      policies.forEach((policy: any, idx) => {
        console.log(`\n策略 ${idx + 1}:`)
        console.log(`  名称: ${policy.policyname || policy.name || 'N/A'}`)
        console.log(`  命令: ${policy.cmd || policy.command || 'N/A'}`)
        console.log(`  定义: ${policy.qual || policy.definition || 'N/A'}`)
      })
    } else {
      console.log('ℹ️  documents表可能没有RLS策略')
    }

    // 4. 检查表的RLS状态
    console.log()
    console.log('🔍 步骤4: 检查documents表的RLS启用状态')
    console.log('-'.repeat(80))

    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'documents')
      .single()

    if (tableError || !tableInfo) {
      console.log('⚠️  无法查询表信息')
    } else {
      console.log('表信息:', JSON.stringify(tableInfo, null, 2))
    }

  } catch (error) {
    console.error('❌ 发生错误:', error)
  }

  console.log()
  console.log('='.repeat(80))
  console.log('✅ 测试完成')
  console.log('='.repeat(80))
}

// 运行测试
testDeleteVector()
