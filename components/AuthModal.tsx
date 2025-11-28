// @ts-nocheck
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Sparkles, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
      const redirectUrl = `${baseUrl}/reset-password`

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
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-cosmic rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mode === 'login' ? '欢迎回来' : mode === 'register' ? '加入我们' : '重置密码'}
                </h2>
                <p className="text-cosmic-400">
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
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cosmic-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-cosmic-800/50 border border-cosmic-700 rounded-lg text-white placeholder-cosmic-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
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
                    className="w-full py-3 bg-gradient-cosmic text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cosmic-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 bg-cosmic-800/50 border border-cosmic-700 rounded-lg text-white placeholder-cosmic-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
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
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cosmic-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-cosmic-800/50 border border-cosmic-700 rounded-lg text-white placeholder-cosmic-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-cosmic-300 text-sm font-medium mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cosmic-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-4 py-3 bg-cosmic-800/50 border border-cosmic-700 rounded-lg text-white placeholder-cosmic-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      placeholder="••••••••"
                    />
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
                  className="w-full py-3 bg-gradient-cosmic text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="text-cosmic-400 hover:text-primary-400 transition-colors text-sm"
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
