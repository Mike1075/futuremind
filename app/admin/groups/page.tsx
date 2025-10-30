'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ArrowLeft, Search, Plus, X, Layers, Calendar, UserCheck } from 'lucide-react'

interface Group {
  id: string
  group_name: string
  description: string | null
  group_type: string
  created_at: string
  created_by_admin: {
    full_name: string
    email: string
  }
  student_count: number
  assignment_count: number
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const GROUP_TYPE_COLORS = {
  'auto_level': 'bg-blue-500',
  'custom': 'bg-purple-500',
  'class': 'bg-green-500'
}

const GROUP_TYPE_NAMES = {
  'auto_level': '系统分组',
  'custom': '自定义',
  'class': '班级'
}

export default function GroupsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [groups, setGroups] = useState<Group[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })

  // 搜索和对话框状态
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 创建分组表单
  const [newGroup, setNewGroup] = useState({
    group_name: '',
    description: '',
    group_type: 'custom'
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
  }, [])

  useEffect(() => {
    if (userEmail) {
      fetchGroups()
    }
  }, [userEmail, searchTerm, pagination.page])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 检查是否是管理员（校长或老师）
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !profile.role || !['principal', 'teacher'].includes(profile.role)) {
        alert('⚠️ 您不是管理员\n\n只有校长和老师可以访问分组管理。')
        router.push('/admin')
        return
      }

      setUserEmail(user.email || '')
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchTerm,
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      })

      const response = await fetch(`/api/admin/groups?${params}`)
      const data = await response.json()

      if (data.error) {
        console.error('获取分组失败:', data.error)
        return
      }

      setGroups(data.groups || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('获取分组失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroup.group_name.trim()) {
      alert('请输入分组名称')
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })

      const data = await response.json()

      if (data.error) {
        alert(`创建失败: ${data.error}`)
        return
      }

      // 重置表单
      setNewGroup({
        group_name: '',
        description: '',
        group_type: 'custom'
      })
      setShowCreateDialog(false)

      // 刷新列表
      fetchGroups()
    } catch (error) {
      console.error('创建分组失败:', error)
      alert('创建分组失败')
    } finally {
      setCreating(false)
    }
  }

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

  if (loading && !groups.length) {
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
    <div className="min-h-screen bg-black relative overflow-hidden">
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
                <h1 className="text-2xl font-bold text-white">分组管理</h1>
                <p className="text-sm text-purple-300 mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 font-semibold">总计：{pagination.total} 个分组</span>
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Search and Create */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-6">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索分组名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              创建分组
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
            <p className="text-purple-300 mt-4">加载中...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 border border-white/10 text-center">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-300">没有找到分组</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
            >
              创建第一个分组
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 cursor-pointer transition-all hover:border-purple-400/50"
                  onClick={() => router.push(`/admin/groups/${group.id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{group.group_name}</h3>
                      <span className={`inline-block px-2 py-1 rounded text-white text-xs font-semibold ${GROUP_TYPE_COLORS[group.group_type as keyof typeof GROUP_TYPE_COLORS]}`}>
                        {GROUP_TYPE_NAMES[group.group_type as keyof typeof GROUP_TYPE_NAMES]}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {group.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-gray-400">学员数</span>
                      </div>
                      <p className="text-xl font-bold text-cyan-400">{group.student_count}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">课程数</span>
                      </div>
                      <p className="text-xl font-bold text-purple-400">{group.assignment_count}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                    <span>创建者：{group.created_by_admin.full_name || group.created_by_admin.email}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-gray-300">
                显示 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} / 共 {pagination.total} 个分组
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

      {/* Create Group Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => !creating && setShowCreateDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/20 rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">创建新分组</h2>
                <button
                  onClick={() => !creating && setShowCreateDialog(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  disabled={creating}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    分组名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroup.group_name}
                    onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })}
                    placeholder="例如：2024春季班"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    disabled={creating}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    描述（可选）
                  </label>
                  <textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="分组的用途和说明..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    disabled={creating}
                  />
                </div>

                {/* Group Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    分组类型
                  </label>
                  <select
                    value={newGroup.group_type}
                    onChange={(e) => setNewGroup({ ...newGroup, group_type: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                    disabled={creating}
                  >
                    <option value="custom">自定义</option>
                    <option value="class">班级</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                  disabled={creating}
                >
                  取消
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
                  disabled={creating || !newGroup.group_name.trim()}
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
