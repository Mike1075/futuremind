'use client'

import { useState, useEffect } from 'react'
import { User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import UserProfileModal from './UserProfileModal'

export default function UserProfileButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const displayName = user.user_metadata?.nickname || user.user_metadata?.full_name || user.email?.split('@')[0] || '用户'

  return (
    <>
      <div className="fixed top-4 left-4 z-40">
        <div className="relative">
          {/* 用户头像按钮 */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2.5 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-full hover:bg-gray-800/80 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-medium">{displayName}</span>
          </button>

          {/* 下拉菜单 */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={() => {
                  setIsModalOpen(true)
                  setShowDropdown(false)
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-3"
              >
                <User className="w-4 h-4" />
                个人资料
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 点击外部关闭下拉菜单 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* 用户资料Modal */}
      <UserProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
