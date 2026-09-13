const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lvjezsnwesyblnlkkirz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2amV6c253ZXN5YmxubGtraXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQzNDI5NSwiZXhwIjoyMDcyMDEwMjk1fQ.4YOr1WrA8XY5sBhyTZvyR8064JoGAsju-6TXAHcZYsc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDocumentsTable() {
  console.log('='.repeat(80))
  console.log('检查 documents 表结构')
  console.log('='.repeat(80))

  // 1. 查看documents表的所有列和数据类型
  console.log('\n1. documents 表的列和数据类型:')
  console.log('-'.repeat(80))
  const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision
      FROM information_schema.columns
      WHERE table_name = 'documents' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
  })

  if (colError) {
    console.error('使用直接查询方式:')
    // 如果RPC失败，尝试直接查询
    const { data: directData, error: directError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')

    if (directError) {
      console.error('查询列信息失败:', directError)
    } else {
      console.table(directData)
    }
  } else {
    console.table(columns)
  }

  // 2. 检查是否有match_documents函数
  console.log('\n2. 检查 match_documents 函数:')
  console.log('-'.repeat(80))
  const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        routine_name,
        routine_type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%match%document%';
    `
  })

  if (funcError) {
    console.error('查询函数失败，尝试其他方式')
    // 尝试直接调用match_documents查看是否存在
    try {
      const testEmbedding = Array(1536).fill(0)
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: testEmbedding,
        match_count: 1
      })

      if (error) {
        console.log('❌ match_documents 函数不存在或有错误:', error.message)
      } else {
        console.log('✅ match_documents 函数存在且可用')
      }
    } catch (e) {
      console.log('❌ match_documents 函数调用失败:', e.message)
    }
  } else {
    if (functions && functions.length > 0) {
      console.log('✅ 找到以下匹配的函数:')
      console.table(functions)
    } else {
      console.log('❌ 未找到 match_documents 相关函数')
    }
  }

  // 3. 检查是否有pgvector扩展
  console.log('\n3. 检查 pgvector 扩展:')
  console.log('-'.repeat(80))
  const { data: extensions, error: extError } = await supabase.rpc('exec_sql', {
    query: `SELECT * FROM pg_extension WHERE extname = 'vector';`
  })

  if (extError) {
    console.error('查询扩展失败，使用备用方法')
    // 备用方法：检查是否可以使用vector类型
    const { data: typeCheck, error: typeError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT typname, typlen
        FROM pg_type
        WHERE typname = 'vector';
      `
    })

    if (typeError) {
      console.log('❌ pgvector 扩展未安装')
    } else if (typeCheck && typeCheck.length > 0) {
      console.log('✅ pgvector 扩展已安装')
      console.table(typeCheck)
    } else {
      console.log('❌ pgvector 扩展未安装')
    }
  } else {
    if (extensions && extensions.length > 0) {
      console.log('✅ pgvector 扩展已安装:')
      console.table(extensions)
    } else {
      console.log('❌ pgvector 扩展未安装')
    }
  }

  // 4. 查看documents表的索引
  console.log('\n4. documents 表的索引:')
  console.log('-'.repeat(80))
  const { data: indexes, error: idxError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'documents' AND schemaname = 'public';
    `
  })

  if (idxError) {
    console.error('查询索引失败:', idxError)
  } else {
    if (indexes && indexes.length > 0) {
      console.log('找到以下索引:')
      indexes.forEach(idx => {
        console.log(`\n索引名: ${idx.indexname}`)
        console.log(`定义: ${idx.indexdef}`)
      })
    } else {
      console.log('未找到索引')
    }
  }

  // 5. 查询documents表是否存在以及记录数
  console.log('\n5. documents 表存在性和记录数:')
  console.log('-'.repeat(80))
  const { count, error: countError } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.log('❌ documents 表可能不存在:', countError.message)
  } else {
    console.log(`✅ documents 表存在，当前有 ${count} 条记录`)
  }

  // 6. 查询一条示例记录（如果存在）
  if (!countError && count > 0) {
    console.log('\n6. 示例记录结构:')
    console.log('-'.repeat(80))
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('documents')
      .select('*')
      .limit(1)
      .single()

    if (!sampleError && sampleRecord) {
      console.log('字段列表:')
      Object.keys(sampleRecord).forEach(key => {
        const value = sampleRecord[key]
        const type = Array.isArray(value) ? 'array' : typeof value
        console.log(`  - ${key}: ${type}`)
      })

      // 检查embedding字段
      if (sampleRecord.embedding) {
        if (Array.isArray(sampleRecord.embedding)) {
          console.log(`\n✅ embedding 字段是数组，维度: ${sampleRecord.embedding.length}`)
        } else {
          console.log(`\n⚠️  embedding 字段类型: ${typeof sampleRecord.embedding}`)
        }
      } else {
        console.log('\n⚠️  embedding 字段为空')
      }
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('检查完成')
  console.log('='.repeat(80))
}

checkDocumentsTable().catch(console.error)
