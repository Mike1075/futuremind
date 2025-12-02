// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UsersRound, Plus, Trash2, Users } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Group {
  id: string
  name: string
  description: string | null
  member_ids: string[] | null
  created_at: string | null
}

export default function PBLGroupsPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [pblSystemId, setPblSystemId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      await loadData()
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()

      // 获取伊卡洛斯课程 system_id
      const { data: systemData, error: systemError } = await supabase
        .from('course_systems')
        .select('id')
        .eq('system_key', 'icarus')
        .maybeSingle()

      if (systemError) throw systemError
      if (!systemData) throw new Error('未找到伊卡洛斯课程体系')
      setPblSystemId(systemData.id)

      // 获取课程分组
      const { data: groupsData, error: groupsError } = await supabase
        .from('student_groups')
        .select('*')
        .eq('course_id', systemData.id)
        .eq('group_type', 'course')
        .order('created_at', { ascending: false })

      if (groupsError) throw groupsError
      setGroups(groupsData || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleCreateGroup = async () => {
    if (!pblSystemId) return
    if (!groupName.trim()) {
      toast.warning('请输入分组名称')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('student_groups')
        .insert({
          name: groupName,
          description: groupDescription || null,
          course_id: pblSystemId,
          group_type: 'course',
          created_by: user?.id,
          member_ids: []
        })

      if (error) throw error

      toast.success('创建成功！')
      setShowCreateModal(false)
      setGroupName('')
      setGroupDescription('')
      await loadData()
    } catch (error) {
      console.error('创建分组失败:', error)
      toast.error('创建失败，请重试')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!await confirm({ title: '确认操作', message: '确定要删除该分组吗？删除后无法恢复。', type: 'warning' })) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      toast.success('删除成功！')
      await loadData()
    } catch (error) {
      console.error('删除分组失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
          <p className="text-orange-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/courses/pbl')}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">伊卡洛斯计划 - 课程分组</h1>
                <p className="text-sm text-orange-300 mt-1">管理课程分组</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              创建分组
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 分组列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <div className="col-span-full bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-12 text-center">
              <UsersRound className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">暂无分组</p>
              <p className="text-gray-500 text-sm mt-2">点击右上角按钮创建第一个分组</p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-lg">
                      <UsersRound className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{group.name}</h3>
                      <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                        <Users className="w-4 h-4" />
                        {group.member_ids?.length || 0} 名成员
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-all"
                    title="删除分组"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {group.description && (
                  <p className="text-gray-300 text-sm mb-4">{group.description}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <p className="text-gray-500 text-xs">
                    创建于: {group.created_at ? new Date(group.created_at).toLocaleDateString('zh-CN') : '-'}
                  </p>
                  <button
                    onClick={() => router.push(`/admin/groups/${group.id}`)}
                    className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-all"
                  >
                    管理成员 →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* 创建分组模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-white/10 w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">创建新分组</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分组名称 *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="例如：第一期学员"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  分组描述
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="可选：描述该分组的用途"
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setGroupName('')
                  setGroupDescription('')
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white rounded-lg transition-all"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
