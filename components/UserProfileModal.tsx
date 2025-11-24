'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  // 加载用户信息
  useEffect(() => {
    if (isOpen) {
      loadUserProfile()
    }
  }, [isOpen])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
        // 从 user_metadata 中获取姓名（full_name）
        setNickname(user.user_metadata?.full_name || user.user_metadata?.nickname || '')
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // 1. 更新姓名（保存到 user_metadata 的 full_name 字段）
      if (nickname.trim()) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { full_name: nickname.trim() }
        })

        if (updateError) {
          throw updateError
        }
      }

      // 2. 更新密码（如果填写了新密码）
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: '两次输入的密码不一致' })
          setIsSaving(false)
          return
        }

        if (newPassword.length < 6) {
          setMessage({ type: 'error', text: '密码长度至少为6位' })
          setIsSaving(false)
          return
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (passwordError) {
          throw passwordError
        }
      }

      setMessage({ type: 'success', text: '保存成功！' })

      // 🔥 触发自定义事件通知其他组件刷新用户信息
      window.dispatchEvent(new CustomEvent('userProfileUpdated'))

      // 清空密码字段
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // 2秒后关闭Modal
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      console.error('保存失败:', error)
      setMessage({ type: 'error', text: error.message || '保存失败，请重试' })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
          <h2 className="text-xl font-semibold text-white">个人资料</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-6 space-y-6">
          {/* 邮箱（只读） */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              姓名
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入您的姓名"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">修改密码（选填）</h3>

            {/* 新密码 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少6位"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* 确认密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* 提示消息 */}
          {message && (
            <div className={`px-4 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {message.text}
            </div>
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  )
}
