// @ts-nocheck
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, ArrowLeft, Search, Filter, ChevronDown, ChevronUp, Plus, FolderOpen, Trash2, Edit2, UserPlus, X } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Student {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  consciousness_level: number
  composite_score: number
  percentile_rank: number | null
  level_updated_at: string | null
  created_at: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface StudentGroup {
  id: string
  name: string
  description: string | null
  group_type: string
  course_id: string | null
  member_ids: string[]
  student_count: number
  created_at: string
  created_by_profile?: {
    full_name: string
    email: string
  }
}

const LEVEL_COLORS = {
  1: 'bg-gray-500',
  2: 'bg-green-500',
  3: 'bg-blue-500',
  4: 'bg-purple-500',
  5: 'bg-yellow-500',
  6: 'bg-orange-500',
  7: 'bg-red-500'
}

const LEVEL_NAMES = {
  1: '沉睡者',
  2: '觉醒者',
  3: '探索者',
  4: '实践者',
  5: '洞察者',
  6: '先锋者',
  7: '引领者'
}

export default function StudentsPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  // 筛选和搜索状态
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [sortBy, setSortBy] = useState('composite_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isMounted, setIsMounted] = useState(false)

  // 分组管理状态
  const [showGroupsPanel, setShowGroupsPanel] = useState(false)
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [submittingGroup, setSubmittingGroup] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (userEmail) {
      fetchStudents()
    }
  }, [userEmail, searchTerm, levelFilter, sortBy, sortOrder, pagination.page])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 检查是否是管理员（校长或老师）
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('无法验证用户权限:', profileError)
        toast.error('无法验证您的权限，请稍后重试。')
        router.push('/admin')
        return
      }

      if (!profile || !profile.role || !['principal', 'teacher'].includes(profile.role)) {
        toast.warning('只有校长和老师可以访问学员管理页面。')
        router.push('/admin')
        return
      }

      setUserEmail(user.email || '')
    } catch (error) {
      console.error('认证失败:', error)
      toast.error('无法验证您的身份，请稍后重试。')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        level: levelFilter,
        sortBy,
        sortOrder,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      })

      const response = await fetch(`/api/admin/students?${params}`)

      if (!response.ok) {
        console.error('获取学员网络错误:', response.status)
        return
      }

      const data = await response.json()

      if (data.error) {
        console.error('获取学员失败:', data.error)
        return
      }

      setStudents(data.students || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('获取学员失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      })

      if (!response.ok) {
        console.error('获取分组网络错误:', response.status)
        return
      }

      const data = await response.json()

      if (data.error) {
        console.error('获取分组失败:', data.error)
        return
      }

      setGroups(data.groups || [])
    } catch (error) {
      console.error('加载分组失败:', error)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) {
      toast.warning('请输入分组名称')
      return
    }

    setSubmittingGroup(true)
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          group_type: 'custom'  // 全局学员管理的分组统一为自定义类型
        })
      })

      if (!response.ok) {
        toast.error(`创建失败 (${response.status})`)
        return
      }

      const data = await response.json()

      if (data.error) {
        toast.error(`创建失败: ${data.error}`)
        return
      }

      toast.success('分组创建成功')
      setNewGroupName('')
      setNewGroupDescription('')
      setShowCreateGroupModal(false)
      await loadGroups()
    } catch (error) {
      console.error('创建分组失败:', error)
      toast.error('创建失败，请稍后重试')
    } finally {
      setSubmittingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const confirmed = await confirm({
      title: '确认操作',
      message: `确定要删除分组「${groupName}」吗？`,
      type: 'warning'
    })
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        toast.error(`删除失败 (${response.status})`)
        return
      }

      const data = await response.json()

      if (data.error) {
        toast.error(`删除失败: ${data.error}`)
        return
      }

      toast.success('删除成功')
      await loadGroups()
    } catch (error) {
      console.error('删除分组失败:', error)
      toast.error('删除失败，请稍后重试')
    }
  }

  useEffect(() => {
    if (showGroupsPanel) {
      loadGroups()
    }
  }, [showGroupsPanel])

  // 生成固定的粒子配置
  const particles = useMemo(() => {
    if (!isMounted) return []
    return [...Array(50)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      duration: Math.random() * 3 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }, [isMounted])

  if (loading && !students.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-purple-300 mt-4">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">学员管理</h1>
                <p className="text-sm text-purple-300 mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowGroupsPanel(!showGroupsPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showGroupsPanel
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
                学员分组
              </button>
              <span className="text-cyan-400 font-semibold">总计：{pagination.total} 人</span>
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Groups Panel */}
        {showGroupsPanel && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                学员分组管理
              </h2>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                创建分组
              </button>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">暂无分组</p>
                <p className="text-gray-500 text-sm mt-1">点击右上角"创建分组"开始创建</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-all cursor-pointer"
                    onClick={() => router.push(`/admin/groups/${group.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{group.name}</h3>
                        {group.description && (
                          <p className="text-gray-400 text-sm mt-1">{group.description}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGroup(group.id, group.name)
                        }}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <span className="text-gray-400 text-sm">
                        {group.group_type === 'global' && '全局分组'}
                        {group.group_type === 'course' && '课程分组'}
                        {group.group_type === 'custom' && '自定义分组'}
                      </span>
                      <span className="text-cyan-400 font-semibold">
                        {group.student_count} 人
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Level Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                style={{
                  colorScheme: 'dark'
                }}
              >
                <option value="" className="bg-gray-900 text-white">所有等级</option>
                {[1, 2, 3, 4, 5, 6, 7].map(level => (
                  <option key={level} value={level} className="bg-gray-900 text-white">Level {level} - {LEVEL_NAMES[level as keyof typeof LEVEL_NAMES]}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSort('composite_score')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  sortBy === 'composite_score'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>评分</span>
                  {sortBy === 'composite_score' && (
                    sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                  )}
                </div>
              </button>
              <button
                onClick={() => handleSort('created_at')}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  sortBy === 'created_at'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>注册时间</span>
                  {sortBy === 'created_at' && (
                    sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-purple-300 mt-4">加载中...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 border border-white/10 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-300">没有找到学员</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 cursor-pointer transition-all hover:border-purple-400/50"
                  onClick={() => router.push(`/admin/students/${student.id}`)}
                >
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xl">
                      {student.full_name?.[0] || student.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{student.full_name || '未命名'}</h3>
                      <p className="text-sm text-gray-400 truncate">{student.email}</p>
                    </div>
                  </div>

                  {/* Level Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${LEVEL_COLORS[student.consciousness_level as keyof typeof LEVEL_COLORS]}`}>
                      Level {student.consciousness_level}
                    </span>
                    <span className="text-gray-300 text-sm">
                      {LEVEL_NAMES[student.consciousness_level as keyof typeof LEVEL_NAMES]}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">综合评分</span>
                      <span className="text-cyan-400 font-semibold">{student.composite_score.toFixed(2)}</span>
                    </div>
                    {student.percentile_rank !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">百分位</span>
                        <span className="text-purple-400 font-semibold">{(student.percentile_rank * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">注册时间</span>
                      <span className="text-gray-300">{new Date(student.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-gray-300">
                显示 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} / 共 {pagination.total} 人
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  上一页
                </button>
                <span className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">创建分组</h2>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    分组名称 *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="例如：高级班、初学者组..."
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    分组描述
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="简要描述这个分组的用途..."
                    rows={3}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 提示：这是一个自由分组，您可以随意添加任何学员
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroupModal(false)
                    setNewGroupName('')
                    setNewGroupDescription('')
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={submittingGroup}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={submittingGroup}
                >
                  {submittingGroup ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
