'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { withAuth } from '@/components/withAuth'
import { authClient } from '@/lib/auth'
import { ExtendedUserProfile, UserRole } from '@/types/auth'
import { 
  Users, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  ArrowLeft,
  MoreVertical,
  UserCheck,
  UserX,
  Crown
} from 'lucide-react'

function UserManagement() {
  const [users, setUsers] = useState<ExtendedUserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<ExtendedUserProfile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUsers()
  }, [searchTerm, roleFilter])

  const loadUsers = async () => {
    setLoading(true)
    
    // 模拟用户数据
    const mockUsers: ExtendedUserProfile[] = [
      {
        id: '1',
        email: 'admin@futuremind.com',
        full_name: '系统管理员',
        avatar_url: null,
        consciousness_level: 10,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        email: 'student1@example.com',
        full_name: '张三',
        avatar_url: null,
        consciousness_level: 3,
        role: 'student',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        email: 'guest1@example.com',
        full_name: '李四',
        avatar_url: null,
        consciousness_level: 1,
        role: 'guest',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    let filteredUsers = mockUsers
    
    if (roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter)
    }
    
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setUsers(filteredUsers)
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const { error } = await authClient.updateUserProfile(userId, { role: newRole })
    
    if (error) {
      alert(`更新失败: ${error.message}`)
    } else {
      alert('用户角色已更新')
      loadUsers()
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-300'
      case 'student': return 'bg-blue-500/20 text-blue-300'
      case 'guest': return 'bg-gray-500/20 text-gray-300'
      default: return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return '管理员'
      case 'student': return '学员'
      case 'guest': return '游客'
      default: return '未知'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 头部导航 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-white/80 hover:text-white transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                返回后台
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                用户管理
              </h1>
            </div>
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
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-gray-800">全部角色</option>
              <option value="admin" className="bg-gray-800">管理员</option>
              <option value="student" className="bg-gray-800">学员</option>
              <option value="guest" className="bg-gray-800">游客</option>
            </select>
          </div>
        </div>

        {/* 用户列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">用户</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">角色</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">意识等级</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">注册时间</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                            {user.role === 'admin' ? (
                              <Crown className="w-5 h-5 text-white" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{user.full_name || '未设置姓名'}</div>
                            <div className="text-gray-400 text-sm">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium">{user.consciousness_level}</div>
                          <div className="w-16 bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                              style={{ width: `${(user.consciousness_level / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowEditModal(true)
                            }}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="编辑用户"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            className="bg-white/10 border border-white/20 rounded text-white text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="admin" className="bg-gray-800">管理员</option>
                            <option value="student" className="bg-gray-800">学员</option>
                            <option value="guest" className="bg-gray-800">游客</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">暂无用户</h3>
            <p className="text-gray-400">
              {searchTerm || roleFilter !== 'all' 
                ? '没有找到符合条件的用户' 
                : '还没有注册用户'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(UserManagement, 'admin')
