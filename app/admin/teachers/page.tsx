'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, UserCheck, ArrowLeft } from 'lucide-react'

interface Teacher {
  id: string
  email: string
  full_name: string | null
  created_at: string
}

export default function TeachersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTeacherEmail, setNewTeacherEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadTeachers()
  }, [])

  const checkAuthAndLoadTeachers = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      // 检查是否是校长
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'principal') {
        alert('⚠️ 只有校长可以访问教师管理')
        router.push('/admin')
        return
      }

      // 加载教师列表
      await loadTeachers()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      const data = await response.json()

      if (data.error) {
        console.error('获取教师列表失败:', data.error)
        return
      }

      setTeachers(data.teachers || [])
    } catch (error) {
      console.error('加载教师列表失败:', error)
    }
  }

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTeacherEmail.trim()) {
      alert('请输入邮箱地址')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newTeacherEmail.trim() })
      })

      const data = await response.json()

      if (data.error) {
        alert(`添加失败: ${data.error}`)
        return
      }

      alert(`✅ 成功添加教师: ${data.teacher.email}`)
      setNewTeacherEmail('')
      setShowAddModal(false)
      await loadTeachers()
    } catch (error) {
      console.error('添加教师失败:', error)
      alert('❌ 添加教师失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTeacher = async (teacher: Teacher) => {
    const confirmed = confirm(
      `确定要移除教师「${teacher.full_name || teacher.email}」吗？\n\n该用户的角色将被改为"学员"。`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.error) {
        alert(`删除失败: ${data.error}`)
        return
      }

      alert(`✅ 已成功移除教师: ${teacher.email}`)
      await loadTeachers()
    } catch (error) {
      console.error('删除教师失败:', error)
      alert('❌ 删除失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-6 h-6" />
                  教师管理
                </h1>
                <p className="text-sm text-purple-300 mt-1">管理教师账号和权限</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加教师
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {teachers.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">暂无教师</p>
            <p className="text-gray-500 text-sm mt-2">点击右上角"添加教师"按钮开始添加</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {teacher.full_name || '未设置'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{teacher.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-400">
                        {new Date(teacher.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">添加教师</h2>
            <form onSubmit={handleAddTeacher}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  用户邮箱
                </label>
                <input
                  type="email"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  placeholder="请输入已注册用户的邮箱"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  注意：该用户必须已经注册账号
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewTeacherEmail('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
