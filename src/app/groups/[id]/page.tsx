'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { authClient } from '@/lib/auth'
import { Group, GroupMember, GroupApplication } from '@/types/auth'
import { 
  Users, 
  Calendar, 
  Settings,
  UserPlus,
  MessageSquare,
  ArrowLeft,
  Crown,
  User
} from 'lucide-react'

export default function GroupDetailPage() {
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [applications, setApplications] = useState<GroupApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'applications'>('overview')
  
  const router = useRouter()
  const params = useParams()
  const { user, profile, hasPermission } = useAuth()
  const groupId = params.id as string

  useEffect(() => {
    if (groupId) {
      loadGroupData()
    }
  }, [groupId])

  const loadGroupData = async () => {
    setLoading(true)
    
    // 这里需要实现获取小组详情的API
    // 暂时使用模拟数据
    const mockGroup: Group = {
      id: groupId,
      name: '意识觉醒探索小组',
      description: '一个专注于探索意识本质和觉醒实践的学习小组。我们通过冥想、哲学讨论和实践练习来深入理解意识的奥秘。',
      creator_id: 'mock-creator-id',
      max_members: 20,
      current_members: 8,
      status: 'recruiting',
      tags: ['意识', '觉醒', '冥想', '哲学'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setGroup(mockGroup)
    setLoading(false)
  }

  const handleJoinGroup = async () => {
    if (!user || !group) return

    const { error } = await authClient.joinGroup(user.id, group.id, '希望加入这个小组，一起探索意识的奥秘')
    
    if (error) {
      alert(`申请失败: ${error.message}`)
    } else {
      alert('申请已提交，等待小组管理员审核')
    }
  }

  const isGroupLeader = group?.creator_id === user?.id
  const canManageGroup = isGroupLeader || hasPermission('groups', 'update')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">小组不存在</h1>
          <button
            onClick={() => router.push('/groups')}
            className="text-purple-400 hover:text-purple-300"
          >
            返回小组列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 头部导航 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/groups')}
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                返回小组列表
              </button>
              <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            </div>
            
            {canManageGroup && (
              <button
                onClick={() => router.push(`/groups/${group.id}/settings`)}
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                管理
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧主要内容 */}
          <div className="lg:col-span-2">
            {/* 小组信息卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{group.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                
                {group.status === 'recruiting' && group.current_members < group.max_members && !isGroupLeader && (
                  <button
                    onClick={handleJoinGroup}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    申请加入
                  </button>
                )}
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                {group.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{group.current_members}</div>
                  <div className="text-sm text-gray-400">当前成员</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{group.max_members}</div>
                  <div className="text-sm text-gray-400">最大成员</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.round((group.current_members / group.max_members) * 100)}%
                  </div>
                  <div className="text-sm text-gray-400">满员率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.floor((Date.now() - new Date(group.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-400">创建天数</div>
                </div>
              </div>

              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {group.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* 标签页导航 */}
            <div className="flex bg-white/5 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === 'overview' 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                概览
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === 'members' 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                成员
              </button>
              {canManageGroup && (
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    activeTab === 'applications' 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  申请管理
                </button>
              )}
            </div>

            {/* 标签页内容 */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
            >
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">小组活动</h3>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        <span className="text-white font-medium">每周讨论会</span>
                        <span className="text-xs text-gray-400">每周日 20:00</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        深入探讨意识相关话题，分享学习心得和实践体验
                      </p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-medium">冥想练习</span>
                        <span className="text-xs text-gray-400">每周三 19:00</span>
                      </div>
                      <p className="text-gray-300 text-sm">
                        集体冥想练习，提升觉知能力和内在平静
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">小组成员</h3>
                  <div className="space-y-3">
                    {/* 模拟成员数据 */}
                    {Array.from({ length: group.current_members }, (_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">成员 {i + 1}</span>
                            {i === 0 && (
                              <Crown className="w-4 h-4 text-yellow-400" title="小组长" />
                            )}
                          </div>
                          <span className="text-sm text-gray-400">
                            {i === 0 ? '小组长' : '成员'} · 加入于 {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'applications' && canManageGroup && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">加入申请</h3>
                  <div className="space-y-3">
                    {applications.length === 0 ? (
                      <div className="text-center py-8">
                        <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400">暂无待处理的申请</p>
                      </div>
                    ) : (
                      applications.map((application) => (
                        <div key={application.id} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-medium">
                                  {application.user?.full_name || '未知用户'}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {application.user?.email}
                                </span>
                              </div>
                              {application.message && (
                                <p className="text-gray-300 text-sm mb-3">
                                  "{application.message}"
                                </p>
                              )}
                              <span className="text-xs text-gray-400">
                                申请时间: {new Date(application.created_at).toLocaleString()}
                              </span>
                            </div>
                            
                            {application.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => {/* 实现批准逻辑 */}}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  批准
                                </button>
                                <button
                                  onClick={() => {/* 实现拒绝逻辑 */}}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                >
                                  拒绝
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* 右侧信息栏 */}
          <div className="space-y-6">
            {/* 快速信息 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">小组信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">创建时间</span>
                  <span className="text-white">{new Date(group.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">成员数量</span>
                  <span className="text-white">{group.current_members}/{group.max_members}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">状态</span>
                  <span className={`${
                    group.status === 'recruiting' ? 'text-green-300' :
                    group.status === 'active' ? 'text-blue-300' :
                    group.status === 'completed' ? 'text-gray-300' :
                    'text-yellow-300'
                  }`}>
                    {group.status === 'recruiting' ? '招募中' :
                     group.status === 'active' ? '活跃' :
                     group.status === 'completed' ? '已完成' : '已归档'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 快速操作 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/groups/${group.id}/chat`)}
                  className="w-full bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  小组聊天
                </button>
                
                <button
                  onClick={() => router.push(`/groups/${group.id}/activities`)}
                  className="w-full bg-white/10 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  活动安排
                </button>
                
                {canManageGroup && (
                  <button
                    onClick={() => router.push(`/groups/${group.id}/settings`)}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    小组设置
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
