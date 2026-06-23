import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const envFile = fs.readFileSync(path.resolve('.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile
    .split(/\r?\n/)
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('缺少 SUPABASE 环境变量')
  process.exit(1)
}

const targetEmail = '527834409@qq.com'
const newPassword = '123456'

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

let user = null
let page = 1
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
  if (error) { console.error('listUsers 失败:', error.message); process.exit(1) }
  const found = data.users.find(u => (u.email || '').toLowerCase() === targetEmail.toLowerCase())
  if (found) { user = found; break }
  if (data.users.length < 200) break
  page++
}

if (!user) {
  console.error(`未找到账号: ${targetEmail}`)
  process.exit(1)
}

console.log(`找到用户: ${user.email}  id=${user.id}  created=${user.created_at}`)

const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
if (updErr) { console.error('重置密码失败:', updErr.message); process.exit(1) }

console.log(`✅ 密码已重置为: ${newPassword}`)
console.log('⚠️ 提醒用户：登录后请立即在"个人设置"修改为自己的密码')
