// @ts-nocheck
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 内联 SVG 图标组件 - 避免 lucide-react 的渲染问题
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
)

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
)

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        })
        if (error) throw error
      }

      // 登录/注册成功
      if (onSuccess) {
        onSuccess()
      }
      onClose()
      // 刷新页面以更新登录状态
      window.location.reload()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('发生未知错误')
      }
    } finally {
      setLoading(false)
    }
  }

  // 忘记密码处理
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      // 使用 auth callback 路由处理 PKCE code 交换，然后重定向到 reset-password
      const redirectUrl = `${baseUrl}/auth/callback?type=recovery`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setMessage('密码重置邮件已发送，请检查您的邮箱')
      // 5秒后返回登录界面
      setTimeout(() => {
        setMode('login')
        setMessage('')
      }, 5000)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('发送重置邮件失败')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* 模态框 */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-cosmic-900 to-black border border-cosmic-700 rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-cosmic-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 标题 */}
              <div className="text-center mb-8">
                <h2 className="font-sacred text-2xl md:text-3xl text-white tracking-wide mb-3">
                  {mode === 'login' ? '欢迎回来' : mode === 'register' ? '加入我们' : '重置密码'}
                </h2>
                <p className="text-starlight-dim text-sm">
                  {mode === 'login'
                    ? '登录以继续你的意识觉醒之旅'
                    : mode === 'register'
                    ? '创建账号，开启全新的探索'
                    : '输入邮箱，我们将发送重置链接'}
                </p>
              </div>

              {/* 忘记密码表单 */}
              {mode === 'forgot' ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-cosmic-300 text-sm font-medium mb-2">
                      邮箱
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <MailIcon />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-amber-500/30 rounded-xl text-white placeholder-white/40 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                        placeholder="请输入注册时使用的邮箱"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm"
                    >
                      {message}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-stardust w-full py-3"
                  >
                    {loading ? '发送中...' : '发送重置邮件'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login')
                      setError('')
                      setMessage('')
                    }}
                    className="w-full flex items-center justify-center text-cosmic-400 hover:text-primary-400 transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回登录
                  </button>
                </form>
              ) : (
              /* 登录/注册表单 */
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-cosmic-300 text-sm font-medium mb-2">
                      姓名
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <UserIcon />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-amber-500/30 rounded-xl text-white placeholder-white/40 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                        placeholder="请输入您的姓名"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-cosmic-300 text-sm font-medium mb-2">
                    邮箱
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <MailIcon />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-amber-500/30 rounded-xl text-white placeholder-white/40 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-cosmic-300 text-sm font-medium mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <LockIcon />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3 bg-white/5 border border-amber-500/30 rounded-xl text-white placeholder-white/40 focus:border-purple-500/70 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 text-purple-400 hover:text-purple-300"
                    >
                      {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                  {/* 忘记密码链接 - 仅在登录模式显示 */}
                  {mode === 'login' && (
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot')
                          setError('')
                        }}
                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        忘记密码？
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-stardust w-full py-3"
                >
                  {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
                </button>
              </form>
              )}

              {/* 切换模式 - 忘记密码模式时隐藏 */}
              {mode !== 'forgot' && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login')
                      setError('')
                    }}
                    className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400 hover:from-amber-300 hover:via-purple-300 hover:to-cyan-300 transition-all font-medium"
                  >
                    {mode === 'login'
                      ? '还没有账号？立即注册'
                      : '已有账号？返回登录'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
