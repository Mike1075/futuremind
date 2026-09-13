import pkg from 'pg'
const { Client } = pkg

// 从环境变量或直接配置连接字符串
const connectionString = 'postgresql://postgres.lvjezsnwesyblnlkkirz:Alvin20050711@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'

async function checkDatabase() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ 成功连接到数据库\n')

    // 1. 查询 documents 表结构
    console.log('='repeat(80))
    console.log('1. documents 表的列和数据类型:')
    console.log('='repeat(80))

    const columnsQuery = `
      SELECT
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'documents' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `

    const columnsResult = await client.query(columnsQuery)
    console.table(columnsResult.rows)

    // 2. 检查 embedding 字段的详细类型
    console.log('\n' + '='.repeat(80))
    console.log('2. embedding 字段详细信息:')
    console.log('='.repeat(80))

    const embeddingQuery = `
      SELECT
        a.attname as column_name,
        t.typname as type_name,
        t.typlen as type_length,
        a.atttypmod as type_modifier,
        format_type(a.atttypid, a.atttypmod) as full_type
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_type t ON a.atttypid = t.oid
      WHERE c.relname = 'documents'
        AND a.attname = 'embedding'
        AND a.attnum > 0
        AND NOT a.attisdropped;
    `

    const embeddingResult = await client.query(embeddingQuery)
    console.table(embeddingResult.rows)

    // 3. 检查 pgvector 扩展
    console.log('\n' + '='.repeat(80))
    console.log('3. 检查 pgvector 扩展:')
    console.log('='.repeat(80))

    const extensionQuery = `SELECT * FROM pg_extension WHERE extname = 'vector';`
    const extensionResult = await client.query(extensionQuery)

    if (extensionResult.rows.length > 0) {
      console.log('✅ pgvector 扩展已安装')
      console.table(extensionResult.rows)
    } else {
      console.log('❌ pgvector 扩展未安装')

      // 检查是否有 vector 类型
      const vectorTypeQuery = `
        SELECT typname, typlen, typtype
        FROM pg_type
        WHERE typname = 'vector';
      `
      const vectorTypeResult = await client.query(vectorTypeQuery)

      if (vectorTypeResult.rows.length > 0) {
        console.log('\n但是 vector 类型存在:')
        console.table(vectorTypeResult.rows)
      }
    }

    // 4. 检查 match_documents 函数
    console.log('\n' + '='.repeat(80))
    console.log('4. 检查 match_documents 函数:')
    console.log('='.repeat(80))

    const functionsQuery = `
      SELECT
        p.proname as function_name,
        pg_get_function_identity_arguments(p.oid) as arguments,
        pg_get_function_result(p.oid) as return_type,
        l.lanname as language
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE n.nspname = 'public'
        AND p.proname LIKE '%match%document%'
      ORDER BY p.proname;
    `

    const functionsResult = await client.query(functionsQuery)

    if (functionsResult.rows.length > 0) {
      console.log('✅ 找到以下函数:')
      console.table(functionsResult.rows)

      // 获取函数定义
      for (const func of functionsResult.rows) {
        console.log(`\n函数 ${func.function_name} 的完整定义:`)
        console.log('-'.repeat(80))

        const defQuery = `
          SELECT pg_get_functiondef(p.oid) as definition
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public' AND p.proname = $1;
        `

        const defResult = await client.query(defQuery, [func.function_name])
        if (defResult.rows.length > 0) {
          console.log(defResult.rows[0].definition)
        }
      }
    } else {
      console.log('❌ 未找到 match_documents 相关函数')
    }

    // 5. 查看 documents 表的索引
    console.log('\n' + '='.repeat(80))
    console.log('5. documents 表的索引:')
    console.log('='.repeat(80))

    const indexesQuery = `
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'documents' AND schemaname = 'public';
    `

    const indexesResult = await client.query(indexesQuery)

    if (indexesResult.rows.length > 0) {
      console.log('找到以下索引:')
      indexesResult.rows.forEach(idx => {
        console.log(`\n索引名: ${idx.indexname}`)
        console.log(`定义: ${idx.indexdef}`)
      })
    } else {
      console.log('❌ 未找到索引')
    }

    // 6. 统计信息
    console.log('\n' + '='.repeat(80))
    console.log('6. documents 表统计信息:')
    console.log('='.repeat(80))

    const statsQuery = `
      SELECT
        COUNT(*) as total_records,
        COUNT(embedding) as records_with_embedding,
        COUNT(*) - COUNT(embedding) as records_without_embedding,
        COUNT(DISTINCT project_id) as unique_projects,
        COUNT(DISTINCT user_id) as unique_users
      FROM documents;
    `

    const statsResult = await client.query(statsQuery)
    console.table(statsResult.rows)

  } catch (error) {
    console.error('❌ 错误:', error.message)
    console.error(error)
  } finally {
    await client.end()
    console.log('\n✅ 数据库连接已关闭')
  }
}

checkDatabase()
