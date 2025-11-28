// @ts-nocheck
'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, ArrowLeft, Search, Crown, GraduationCap, User, UserPlus } from 'lucide-react'

interface UserProfile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  role: string | null
  consciousness_level: number | null
  composite_score: number | null
  created_at: string | null
}

const ROLE_CONFIG = {
  principal: {
    label: '校长',
    icon: Crown,
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/50',
    textColor: 'text-yellow-400'
  },
  teacher: {
    label: '教师',
    icon: GraduationCap,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-400'
  },
  student: {
    label: '学员',
    icon: User,
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-400'
  }
}

const LEVEL_NAMES: Record<number, string> = {
  1: '沉睡者',
  2: '觉醒者',
  3: '探索者',
  4: '实践者',
  5: '洞察者',
  6: '先锋者',
  7: '引领者'
}

export default function UsersManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>('')
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState<'all' | 'principal' | 'teacher' | 'student'>('all')
  const [isMounted, setIsMounted] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'teacher' | 'student'>('student')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setIsMounted(true)
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

      // 检查是否是管理员（校长）
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        alert('❌ 系统错误\n\n无法验证您的权限，请稍后重试。')
        router.push('/admin')
        return
      }

      if (!profile || profile.role !== 'principal') {
        alert('⚠️ 您不是校长\n\n只有校长可以访问人员管理页面。')
        router.push('/admin')
        return
      }

      setUserEmail(user.email || '')
      await fetchAllUsers()
    } catch (error) {
      alert('❌ 系统错误\n\n无法验证您的身份，请稍后重试。')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 获取所有用户（不做角色过滤）
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          role,
          consciousness_level,
          composite_score,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return
      }

      setAllUsers(data || [])
    } catch (error) {
      // 静默处理错误
    } finally {
      setLoading(false)
    }
  }

  // 过滤和分组用户
  const { principals, teachers, students, filteredUsers } = useMemo(() => {
    let filtered = allUsers

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 角色分组
    const principals = filtered.filter(u => u.role === 'principal')
    const teachers = filtered.filter(u => u.role === 'teacher')
    const students = filtered.filter(u => u.role === 'student' || !u.role || u.role === null)

    // 标签页过滤
    if (selectedTab === 'principal') filtered = principals
    else if (selectedTab === 'teacher') filtered = teachers
    else if (selectedTab === 'student') filtered = students

    return { principals, teachers, students, filteredUsers: filtered }
  }, [allUsers, searchTerm, selectedTab])

  const handleChangeRole = async (userId: string, userName: string, currentRole: string, newRole: string) => {
    const confirmed = confirm(
      `确定要将「${userName}」的角色从「${ROLE_CONFIG[currentRole as keyof typeof ROLE_CONFIG]?.label || currentRole}」改为「${ROLE_CONFIG[newRole as keyof typeof ROLE_CONFIG]?.label}」吗？`
    )

    if (!confirmed) {
      return
    }

    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()

      if (error) {
        throw error
      }

      // 立即更新本地状态
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
        return updatedUsers
      })

      alert('✅ 角色修改成功')

      // 后台重新获取数据以确保同步
      await fetchAllUsers()
    } catch (error) {
      alert('❌ 修改失败，请稍后重试')
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) {
      alert('请输入邮箱地址')
      return
    }

    setSubmitting(true)
    try {
      // 检查用户是否存在
      const supabase = createClient()
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', newUserEmail.trim())
        .maybeSingle()

      if (existingUser) {
        // 用户已存在，询问是否修改角色
        if (existingUser.role === newUserRole) {
          alert(`该用户已经是${ROLE_CONFIG[newUserRole].label}了`)
          return
        }

        const confirmed = confirm(
          `该用户已注册（当前角色：${ROLE_CONFIG[existingUser.role as keyof typeof ROLE_CONFIG]?.label || existingUser.role}）\n\n是否将其角色改为「${ROLE_CONFIG[newUserRole].label}」？`
        )

        if (confirmed) {
          const { error } = await supabase
            .from('profiles')
            .update({ role: newUserRole })
            .eq('id', existingUser.id)

          if (error) throw error

          alert(`✅ 已将 ${newUserEmail} 的角色更新为${ROLE_CONFIG[newUserRole].label}`)
          setNewUserEmail('')
          setShowAddModal(false)
          await fetchAllUsers()
        }
      } else {
        alert('❌ 该用户尚未注册\n\n请让用户先注册账号，然后再在此处修改其角色。')
      }
    } catch (error) {
      alert('❌ 操作失败，请稍后重试')
    } finally {
      setSubmitting(false)
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
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-7 h-7" />
                  人员管理
                </h1>
                <p className="text-sm text-purple-300 mt-1">管理员：{userEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                设置角色
              </button>
              <span className="text-cyan-400 font-semibold">总计：{allUsers.length} 人</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 cursor-pointer transition-all ${
              selectedTab === 'all' ? 'ring-2 ring-purple-500' : 'hover:border-purple-400/50'
            }`}
            onClick={() => setSelectedTab('all')}
          >
            <Users className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-gray-400 text-sm">全部人员</p>
            <p className="text-2xl font-bold text-white mt-1">{allUsers.length}</p>
          </div>

          <div
            className={`bg-gradient-to-br ${ROLE_CONFIG.principal.bgColor} backdrop-blur-md rounded-xl p-6 border ${ROLE_CONFIG.principal.borderColor} cursor-pointer transition-all ${
              selectedTab === 'principal' ? 'ring-2 ring-yellow-500' : 'hover:border-yellow-500'
            }`}
            onClick={() => setSelectedTab('principal')}
          >
            <Crown className={`w-8 h-8 ${ROLE_CONFIG.principal.textColor} mb-2`} />
            <p className="text-gray-400 text-sm">校长</p>
            <p className="text-2xl font-bold text-white mt-1">{principals.length}</p>
          </div>

          <div
            className={`bg-gradient-to-br ${ROLE_CONFIG.teacher.bgColor} backdrop-blur-md rounded-xl p-6 border ${ROLE_CONFIG.teacher.borderColor} cursor-pointer transition-all ${
              selectedTab === 'teacher' ? 'ring-2 ring-purple-500' : 'hover:border-purple-500'
            }`}
            onClick={() => setSelectedTab('teacher')}
          >
            <GraduationCap className={`w-8 h-8 ${ROLE_CONFIG.teacher.textColor} mb-2`} />
            <p className="text-gray-400 text-sm">教师</p>
            <p className="text-2xl font-bold text-white mt-1">{teachers.length}</p>
          </div>

          <div
            className={`bg-gradient-to-br ${ROLE_CONFIG.student.bgColor} backdrop-blur-md rounded-xl p-6 border ${ROLE_CONFIG.student.borderColor} cursor-pointer transition-all ${
              selectedTab === 'student' ? 'ring-2 ring-cyan-500' : 'hover:border-cyan-500'
            }`}
            onClick={() => setSelectedTab('student')}
          >
            <User className={`w-8 h-8 ${ROLE_CONFIG.student.textColor} mb-2`} />
            <p className="text-gray-400 text-sm">学员</p>
            <p className="text-2xl font-bold text-white mt-1">{students.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 border border-white/10 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-300">没有找到用户</p>
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
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    等级/评分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredUsers.map((user) => {
                  const userRole = (user.role || 'student') as keyof typeof ROLE_CONFIG
                  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.student
                  const Icon = roleConfig.icon

                  return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${roleConfig.color} flex items-center justify-center text-white font-bold`}>
                            {user.full_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div className="text-sm font-medium text-white">
                            {user.full_name || '未设置'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${roleConfig.bgColor} ${roleConfig.textColor} border ${roleConfig.borderColor}`}>
                          <Icon className="w-4 h-4" />
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'student' || !user.role ? (
                          <div className="text-sm">
                            <span className="text-purple-400 font-semibold">L{user.consciousness_level ?? 1}</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-cyan-400">{(user.composite_score ?? 0).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <select
                          value={user.role || 'student'}
                          onChange={(e) => handleChangeRole(user.id, user.full_name || user.email, user.role || 'student', e.target.value)}
                          className="px-3 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                          style={{ colorScheme: 'dark' }}
                        >
                          <option value="principal" className="bg-gray-900">校长</option>
                          <option value="teacher" className="bg-gray-900">教师</option>
                          <option value="student" className="bg-gray-900">学员</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Change Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">设置用户角色</h2>
            <form onSubmit={handleInviteUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    用户邮箱
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="请输入已注册用户的邮箱"
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    设置为
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'teacher' | 'student')}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="student" className="bg-gray-900">学员</option>
                    <option value="teacher" className="bg-gray-900">教师</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500">
                  💡 如果该邮箱已注册，将修改其角色；如果未注册，将提示用户先注册。
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewUserEmail('')
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
                  {submitting ? '处理中...' : '确定'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
