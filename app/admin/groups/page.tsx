'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft, Plus, Trash2, UserPlus, Globe, BookOpen } from 'lucide-react'

interface Group {
  id: string
  name: string
  description: string | null
  group_type: 'global' | 'course'
  member_ids: string[] | null
  course_id: string | null
  course_title?: string
  created_at: string | null
  creator_name?: string
}

const GROUP_TYPE_COLORS = {
  'global': 'bg-blue-500',
  'course': 'bg-green-500'
}

const GROUP_TYPE_NAMES = {
  'global': '全局分组',
  'course': '课程分组'
}

export default function GroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])

  // 模态框状态
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 检查是否是管理员
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = (profile as unknown as { role?: string })?.role

      if (!userRole || !['principal', 'teacher'].includes(userRole)) {
        alert('⚠️ 您没有权限访问此页面')
        router.push('/admin')
        return
      }

      await loadGroups()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const supabase = createClient()

      // 获取所有全局分组（课程分组在课程详情页管理）
      const { data, error } = await supabase
        .from('student_groups')
        .select(`
          id,
          name,
          description,
          group_type,
          member_ids,
          course_id,
          created_at,
          created_by,
          course_systems (
            title
          ),
          creator:profiles!student_groups_created_by_fkey (
            full_name
          )
        `)
        .eq('group_type', 'global')
        .order('created_at', { ascending: false })

      if (error) throw error

      const groupsList: Group[] = data?.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        group_type: g.group_type,
        member_ids: g.member_ids || [],
        course_id: g.course_id,
        course_title: g.course_systems?.title,
        created_at: g.created_at,
        creator_name: g.creator?.full_name
      })) || []

      setGroups(groupsList)
    } catch (error) {
      console.error('加载分组失败:', error)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) {
      alert('请输入分组名称')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('student_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          group_type: 'global',
          member_ids: [],
          created_by: user?.id
        })

      if (error) throw error

      alert('✅ 创建成功')
      setNewGroupName('')
      setNewGroupDescription('')
      setShowCreateModal(false)
      await loadGroups()
    } catch (error) {
      console.error('创建分组失败:', error)
      alert('❌ 创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    const confirmed = confirm(`确定要删除「${group.name}」分组吗？\n\n此操作不可撤销。`)
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', group.id)

      if (error) throw error

      alert('✅ 已删除分组')
      await loadGroups()
    } catch (error) {
      console.error('删除分组失败:', error)
      alert('❌ 删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
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
                <h1 className="text-2xl font-bold text-white">全局分组管理</h1>
                <p className="text-sm text-purple-300 mt-1">管理跨课程的学员分组</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-semibold">共 {groups.length} 个分组</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-400 text-sm">
              课程分组在各课程详情页中管理
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建全局分组
          </button>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">暂无全局分组</p>
            <p className="text-gray-500 text-sm mt-2">创建第一个分组以开始管理学员</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{group.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${GROUP_TYPE_COLORS[group.group_type]}`}>
                      {GROUP_TYPE_NAMES[group.group_type]}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="删除分组"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-400 mb-4">{group.description}</p>
                )}

                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Users className="w-4 h-4" />
                    <span>{group.member_ids?.length || 0} 名成员</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/10">
                  <span>{group.created_at ? new Date(group.created_at).toLocaleDateString('zh-CN') : '-'}</span>
                  {group.creator_name && <span>创建者: {group.creator_name}</span>}
                </div>

                <button
                  onClick={() => router.push(`/admin/groups/${group.id}`)}
                  className="w-full mt-4 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  管理成员
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">创建全局分组</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分组名称
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例如：高级班"
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  描述（可选）
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="分组说明..."
                  rows={3}
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewGroupName('')
                    setNewGroupDescription('')
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
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
