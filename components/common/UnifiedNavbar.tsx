// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  ChevronDown,
  Key,
  Settings,
  LogOut,
  Home
} from 'lucide-react'

interface UnifiedNavbarProps {
  // 可选：如果已有用户信息可以直接传入，避免重复获取
  userName?: string
  userEmail?: string
  userRole?: string | null
  // 右侧按钮配置
  rightButton?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
  // 是否显示背景模糊效果
  transparent?: boolean
  // 额外的右侧内容（如通知徽章）
  rightExtra?: React.ReactNode
  // 打开个人资料的回调
  onOpenProfile?: () => void
}

export function UnifiedNavbar({
  userName: propUserName,
  userEmail: propUserEmail,
  userRole: propUserRole,
  rightButton,
  transparent = false,
  rightExtra,
  onOpenProfile
}: UnifiedNavbarProps) {
  const router = useRouter()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userName, setUserName] = useState(propUserName || '')
  const [userEmail, setUserEmail] = useState(propUserEmail || '')
  const [userRole, setUserRole] = useState<string | null>(propUserRole || null)
  const [loading, setLoading] = useState(!propUserName)

  useEffect(() => {
    // 如果已经传入了用户信息，不需要再获取
    if (propUserName) return

    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUserEmail(user.email || '')

        // 获取用户资料
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name || '')
          setUserRole(profile.role)
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [propUserName])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const displayName = userName || userEmail?.split('@')[0] || '用户'

  // 默认右侧按钮配置
  const defaultRightButton = {
    label: '返回首页',
    href: '/',
    icon: <Home className="w-5 h-5 text-orange-400" />
  }

  const actualRightButton = rightButton || defaultRightButton

  if (loading) {
    return (
      <nav className={`relative z-20 ${transparent ? 'bg-white/5 backdrop-blur-md' : 'bg-zinc-900'} border-b border-white/10`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="w-32 h-8 bg-zinc-700 rounded animate-pulse"></div>
            <div className="w-24 h-8 bg-zinc-700 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className={`relative z-20 ${transparent ? 'bg-white/5 backdrop-blur-md' : 'bg-zinc-900'} border-b border-white/10`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：用户名下拉菜单 */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors duration-300"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium">{displayName}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 下拉菜单 */}
            {isUserMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                {/* 用户信息头部 */}
                <div className="px-4 py-3 border-b border-zinc-700">
                  <p className="text-sm font-medium text-white">{displayName}</p>
                  <p className="text-xs text-zinc-400 truncate">{userEmail}</p>
                </div>

                {/* 菜单项 */}
                <div className="py-2">
                  {/* 个人资料 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      if (onOpenProfile) {
                        onOpenProfile()
                      } else {
                        window.dispatchEvent(new CustomEvent('openProfileModal'))
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>个人资料</span>
                  </button>

                  {/* 修改密码 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      router.push('/reset-password')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    <span>修改密码</span>
                  </button>

                  {/* 管理后台 - 仅管理员可见 */}
                  {userRole && ['principal', 'teacher'].includes(userRole) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        router.push('/admin')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>管理后台</span>
                    </button>
                  )}

                  {/* 分隔线 */}
                  <div className="my-2 border-t border-zinc-700"></div>

                  {/* 退出登录 */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      handleLogout()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 右侧区域 */}
          <div className="flex items-center gap-3">
            {/* 额外内容（如通知徽章） */}
            {rightExtra}

            {/* 返回按钮 */}
            <button
              onClick={() => {
                if (actualRightButton.href.startsWith('/')) {
                  router.push(actualRightButton.href)
                } else {
                  window.location.href = actualRightButton.href
                }
              }}
              className="flex items-center space-x-2 text-orange-300 hover:text-orange-200 transition-colors duration-300 group"
            >
              <span className="font-medium">{actualRightButton.label}</span>
              <div className="w-8 h-8 bg-orange-600/20 rounded-full flex items-center justify-center group-hover:bg-orange-600/40 transition-colors duration-300">
                {actualRightButton.icon || <Home className="w-5 h-5 text-orange-400" />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
