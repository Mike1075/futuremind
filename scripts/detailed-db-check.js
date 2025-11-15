const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lvjezsnwesyblnlkkirz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQzNDI5NSwiZXhwIjoyMDcyMDEwMjk1fQ.4YOr1WrA8XY5sBhyTZvyR8064JoGAsju-6TXAHcZYsc'

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function checkDatabase() {
  console.log('='.repeat(80))
  console.log('Supabase documents 表完整检查报告')
  console.log('='.repeat(80))

  try {
    // 1. 查询 documents 表示例记录
    console.log('\n1. documents 表示例记录（查看字段结构）:')
    console.log('-'.repeat(80))

    const { data: samples, error: sampleError } = await supabase
      .from('documents')
      .select('*')
      .limit(3)

    if (sampleError) {
      console.error('❌ 查询失败:', sampleError.message)
    } else if (samples && samples.length > 0) {
      console.log(`✅ 成功获取 ${samples.length} 条示例记录\n`)

      // 分析第一条记录的字段
      const firstRecord = samples[0]
      console.log('字段列表:')

      Object.entries(firstRecord).forEach(([key, value]) => {
        let typeInfo = typeof value

        if (value === null) {
          typeInfo = 'null'
        } else if (Array.isArray(value)) {
          typeInfo = `array[${value.length}]`
        } else if (typeof value === 'object') {
          typeInfo = `object{${Object.keys(value).length} keys}`
        } else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          // 可能是JSON数组字符串
          try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) {
              typeInfo = `string(array[${parsed.length}])`
            }
          } catch (e) {
            // 不是有效JSON
          }
        }

        console.log(`  • ${key.padEnd(20)} : ${typeInfo}`)

        // 特别关注 embedding 字段
        if (key === 'embedding') {
          console.log(`    └─ 详细信息:`)
          if (typeof value === 'string') {
            console.log(`       - 字符串长度: ${value.length}`)
            console.log(`       - 前100个字符: ${value.substring(0, 100)}`)

            // 尝试解析
            if (value.startsWith('[')) {
              try {
                const parsed = JSON.parse(value)
                if (Array.isArray(parsed)) {
                  console.log(`       - ✅ 可以解析为数组`)
                  console.log(`       - 数组维度: ${parsed.length}`)
                  console.log(`       - 前5个元素: [${parsed.slice(0, 5).join(', ')}...]`)
                }
              } catch (e) {
                console.log(`       - ❌ 无法解析为JSON: ${e.message}`)
              }
            }
          } else if (Array.isArray(value)) {
            console.log(`       - ✅ 原生数组`)
            console.log(`       - 数组维度: ${value.length}`)
            console.log(`       - 前5个元素: [${value.slice(0, 5).join(', ')}...]`)
          }
        }
      })

      // 显示一条完整记录（不包含embedding）
      console.log('\n示例记录（不含embedding）:')
      const { embedding, ...recordWithoutEmbedding } = samples[0]
      console.log(JSON.stringify(recordWithoutEmbedding, null, 2))
    }

    // 2. 统计信息
    console.log('\n2. documents 表统计信息:')
    console.log('-'.repeat(80))

    const { count: totalCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    const { count: withEmbedding } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)

    const { count: withoutEmbedding } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null)

    console.log(`总记录数: ${totalCount}`)
    console.log(`有 embedding 的记录: ${withEmbedding}`)
    console.log(`无 embedding 的记录: ${withoutEmbedding}`)

    // 3. 测试 match_documents 函数
    console.log('\n3. 测试 match_documents 函数:')
    console.log('-'.repeat(80))

    // 创建一个测试向量 (1536维度的零向量)
    const testEmbedding = Array(1536).fill(0)

    try {
      const { data: matchData, error: matchError } = await supabase
        .rpc('match_documents', {
          query_embedding: testEmbedding,
          match_count: 5
        })

      if (matchError) {
        console.error('❌ match_documents 函数调用失败:', matchError.message)
        console.error('   错误详情:', matchError)
      } else {
        console.log(`✅ match_documents 函数存在且可用`)
        console.log(`   返回结果数: ${matchData ? matchData.length : 0}`)

        if (matchData && matchData.length > 0) {
          console.log('\n   返回的字段:')
          Object.keys(matchData[0]).forEach(key => {
            console.log(`     • ${key}`)
          })
        }
      }
    } catch (e) {
      console.error('❌ 调用异常:', e.message)
    }

    // 4. 检查是否可以插入向量
    console.log('\n4. 测试向量插入（不实际插入）:')
    console.log('-'.repeat(80))

    const testVector = Array(1536).fill(0.1)

    // 这里只是测试格式，不实际插入
    console.log(`测试向量维度: ${testVector.length}`)
    console.log(`向量格式: [${testVector.slice(0, 5).join(', ')}...]`)

    // 5. 查看有embedding的记录样例
    console.log('\n5. 查看一条有 embedding 的记录:')
    console.log('-'.repeat(80))

    const { data: withEmbeddingRecord, error: embRecError } = await supabase
      .from('documents')
      .select('id, title, metadata, embedding')
      .not('embedding', 'is', null)
      .limit(1)
      .maybeSingle()

    if (embRecError) {
      console.error('❌ 查询失败:', embRecError.message)
    } else if (withEmbeddingRecord) {
      console.log('✅ 找到有 embedding 的记录:')
      console.log(`   ID: ${withEmbeddingRecord.id}`)
      console.log(`   Title: ${withEmbeddingRecord.title}`)

      const emb = withEmbeddingRecord.embedding
      if (typeof emb === 'string') {
        console.log(`   Embedding 类型: string`)
        console.log(`   Embedding 长度: ${emb.length} 字符`)

        // 尝试解析
        if (emb.startsWith('[')) {
          try {
            const parsed = JSON.parse(emb)
            console.log(`   ✅ 可解析为数组，维度: ${parsed.length}`)
          } catch (e) {
            console.log(`   ❌ 无法解析: ${e.message}`)
          }
        }
      } else if (Array.isArray(emb)) {
        console.log(`   Embedding 类型: array`)
        console.log(`   Embedding 维度: ${emb.length}`)
      } else {
        console.log(`   Embedding 类型: ${typeof emb}`)
      }
    } else {
      console.log('⚠️  没有找到有 embedding 的记录')
    }

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message)
    console.error(error)
  }

  console.log('\n' + '='.repeat(80))
  console.log('检查完成')
  console.log('='.repeat(80))
}

checkDatabase()
