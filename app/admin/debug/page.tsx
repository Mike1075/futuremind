// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

export default function DebugPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const supabase = createClient()

      // 获取当前用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) {
        router.push('/login')
        return
      }

      setUserInfo(user)

      // 查询 profiles 表
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        setError(`查询 profiles 表失败: ${profileError.message} (code: ${profileError.code})`)
      } else {
        setAdminInfo(profile)
      }

      // 也尝试用 email 查询
      if (user.email) {
        const { data: profileByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .maybeSingle()

        if (!emailError && profileByEmail) {
          setAdminInfo((prev: any) => ({ ...prev, foundByEmail: profileByEmail }))
        }
      }

    } catch (error: any) {
      setError(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板！')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600"
          >
            ← 返回管理后台
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8">🔍 管理员权限调试工具</h1>

        {/* 当前用户信息 */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-green-400">✅ 当前登录用户信息</h2>

          <div className="space-y-3">
            <div>
              <label className="text-gray-400 block mb-1">UUID (重要！):</label>
              <div className="flex items-center gap-2">
                <code className="bg-black px-3 py-2 rounded text-cyan-400 flex-1 overflow-x-auto">
                  {userInfo?.id}
                </code>
                <button
                  onClick={() => copyToClipboard(userInfo?.id)}
                  className="px-3 py-2 bg-blue-500 rounded hover:bg-blue-600 text-sm"
                >
                  复制
                </button>
              </div>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">邮箱:</label>
              <code className="bg-black px-3 py-2 rounded text-cyan-400 block">
                {userInfo?.email}
              </code>
            </div>

            <div>
              <label className="text-gray-400 block mb-1">创建时间:</label>
              <code className="bg-black px-3 py-2 rounded text-gray-300 block">
                {new Date(userInfo?.created_at).toLocaleString()}
              </code>
            </div>
          </div>
        </div>

        {/* admins 表查询结果 */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📋 admins 表查询结果</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded p-4 mb-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {adminInfo ? (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500 rounded p-4">
                <p className="text-green-300 font-bold mb-2">✅ 找到管理员记录！</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">角色: </span>
                    <span className="text-white font-bold">{adminInfo.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">姓名: </span>
                    <span className="text-white">{adminInfo.full_name || '未设置'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">可管理老师: </span>
                    <span className="text-white">{adminInfo.can_manage_teachers ? '是' : '否'}</span>
                  </div>
                </div>
              </div>

              {adminInfo.foundByEmail && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded p-4">
                  <p className="text-yellow-300 mb-2">⚠️ 发现：用邮箱可以找到记录，但UUID不匹配！</p>
                  <p className="text-sm text-gray-300">
                    admins表中的ID: <code className="text-cyan-400">{adminInfo.foundByEmail.id}</code>
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    当前用户ID: <code className="text-cyan-400">{userInfo?.id}</code>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-500/20 border border-red-500 rounded p-4">
              <p className="text-red-300 font-bold mb-2">❌ 未找到管理员记录</p>
              <p className="text-sm text-gray-300">请确保在 admins 表中添加了该用户。</p>
            </div>
          )}
        </div>

        {/* 修复SQL */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-purple-400">🔧 快速修复SQL</h2>

          <p className="text-gray-300 mb-4">
            复制以下SQL到 Supabase Dashboard → SQL Editor 中执行：
          </p>

          <div className="space-y-4">
            {/* 如果用邮箱能找到但UUID不对 */}
            {adminInfo?.foundByEmail && adminInfo.foundByEmail.id !== userInfo?.id && (
              <div>
                <p className="text-yellow-400 mb-2">方案1: 更新现有记录的UUID</p>
                <div className="relative">
                  <pre className="bg-black p-4 rounded overflow-x-auto text-sm">
                    <code className="text-green-400">{`-- 更新 admins 表中的 UUID
UPDATE admins
SET id = '${userInfo?.id}'
WHERE email = '${userInfo?.email}';`}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`UPDATE admins SET id = '${userInfo?.id}' WHERE email = '${userInfo?.email}';`)}
                    className="absolute top-2 right-2 px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
                  >
                    复制
                  </button>
                </div>
              </div>
            )}

            {/* 如果完全找不到 */}
            {!adminInfo && (
              <div>
                <p className="text-blue-400 mb-2">方案2: 插入新的管理员记录</p>
                <div className="relative">
                  <pre className="bg-black p-4 rounded overflow-x-auto text-sm">
                    <code className="text-green-400">{`-- 插入新的管理员记录（校长）
INSERT INTO admins (id, full_name, email, role, can_manage_teachers, permissions)
VALUES (
  '${userInfo?.id}',
  '请修改为你的姓名',
  '${userInfo?.email}',
  'principal',
  true,
  '{"view_students": true, "manage_groups": true, "assign_courses": true, "view_analytics": true}'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = EXCLUDED.role,
    can_manage_teachers = EXCLUDED.can_manage_teachers,
    permissions = EXCLUDED.permissions;`}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`INSERT INTO admins (id, full_name, email, role, can_manage_teachers, permissions) VALUES ('${userInfo?.id}', '请修改为你的姓名', '${userInfo?.email}', 'principal', true, '{"view_students": true, "manage_groups": true, "assign_courses": true, "view_analytics": true}'::jsonb) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, can_manage_teachers = EXCLUDED.can_manage_teachers, permissions = EXCLUDED.permissions;`)}
                    className="absolute top-2 right-2 px-3 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
                  >
                    复制
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 bg-blue-500/20 border border-blue-500 rounded p-4">
            <h3 className="font-bold text-blue-300 mb-2">📝 操作步骤：</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
              <li>复制上面的SQL（点击"复制"按钮）</li>
              <li>打开 Supabase Dashboard → SQL Editor</li>
              <li>粘贴并执行SQL</li>
              <li>清除浏览器缓存（Ctrl+Shift+Delete）</li>
              <li>刷新页面，重新尝试访问管理后台</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
