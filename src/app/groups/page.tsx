'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { authClient } from '@/lib/auth'
import { Group } from '@/types/auth'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Star,
  ArrowLeft
} from 'lucide-react'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()
  const { user, profile, hasPermission } = useAuth()

  useEffect(() => {
    loadGroups()
  }, [statusFilter, searchTerm])

  const loadGroups = async () => {
    setLoading(true)
    const filters: { status?: string; search?: string } = {}
    
    if (statusFilter !== 'all') {
      filters.status = statusFilter
    }
    
    if (searchTerm) {
      filters.search = searchTerm
    }

    const { groups: groupsData, error } = await authClient.getGroups(filters)
    
    if (!error && groupsData) {
      setGroups(groupsData)
    }
    
    setLoading(false)
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await authClient.joinGroup(user.id, groupId)
    
    if (error) {
      alert(`申请失败: ${error.message}`)
    } else {
      alert('申请已提交，等待小组管理员审核')
    }
  }

  const canCreateGroup = hasPermission('groups', 'create')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 头部导航 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                返回主页
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                学习小组
              </h1>
            </div>
            
            {canCreateGroup && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建小组
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索和筛选 */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索小组..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-gray-800">全部状态</option>
              <option value="recruiting" className="bg-gray-800">招募中</option>
              <option value="active" className="bg-gray-800">活跃</option>
              <option value="completed" className="bg-gray-800">已完成</option>
            </select>
          </div>
        </div>

        {/* 小组列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{group.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.status === 'recruiting' ? 'bg-green-500/20 text-green-300' :
                    group.status === 'active' ? 'bg-blue-500/20 text-blue-300' :
                    group.status === 'completed' ? 'bg-gray-500/20 text-gray-300' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {group.status === 'recruiting' ? '招募中' :
                     group.status === 'active' ? '活跃' :
                     group.status === 'completed' ? '已完成' : '已归档'}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {group.description || '暂无描述'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.current_members}/{group.max_members} 成员
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(group.created_at).toLocaleDateString()}
                  </span>
                </div>

                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {group.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className="flex-1 bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    查看详情
                  </button>
                  
                  {group.status === 'recruiting' && group.current_members < group.max_members && (
                    <button
                      onClick={() => handleJoinGroup(group.id)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                    >
                      申请加入
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">暂无小组</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? '没有找到符合条件的小组' 
                : '还没有创建任何小组'}
            </p>
            {canCreateGroup && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                创建第一个小组
              </button>
            )}
          </div>
        )}
      </div>

      {/* 创建小组模态框 */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadGroups()
          }}
        />
      )}
    </div>
  )
}

// 创建小组模态框组件
function CreateGroupModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxMembers, setMaxMembers] = useState(20)
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    
    const { error } = await authClient.createGroup(user.id, {
      name,
      description: description || undefined,
      max_members: maxMembers,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
    })

    if (error) {
      alert(`创建失败: ${error.message}`)
    } else {
      onSuccess()
    }
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-white mb-6">创建学习小组</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              小组名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="输入小组名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              小组描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
              placeholder="描述小组的目标和活动"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              最大成员数
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="2"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              标签 (用逗号分隔)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="例如: 冥想, 哲学, 实践"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建小组'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
