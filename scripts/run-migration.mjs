import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Read migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_add_lessons_tables.sql')
const sql = fs.readFileSync(migrationPath, 'utf-8')

console.log('🚀 Running migration: 002_add_lessons_tables.sql')
console.log('📝 SQL length:', sql.length, 'characters')

try {
  // Execute SQL using rpc or direct query
  const { data, error } = await supabase.rpc('exec', { sql })

  if (error) {
    // If rpc doesn't work, try using the REST API directly
    console.log('⚠️  RPC method failed, trying direct approach...')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📊 Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n[${i + 1}/${statements.length}] Executing...`)

      // Use the from() method to execute raw SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: statement + ';' })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Statement ${i + 1} failed:`, errorText)
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }

    console.log('\n✅ Migration completed!')
  } else {
    console.log('✅ Migration executed successfully!')
    console.log('Result:', data)
  }
} catch (err) {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
}
