// @ts-nocheck
'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // 获取重定向地址
  const redirectTo = searchParams?.get('redirect') || '/portal'

  // 确保只在客户端渲染
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 生成固定的粒子配置（修复hydration error）
  const particles = useMemo(() => {
    if (!isMounted) return []
    return [...Array(30)].map((_, i) => ({
      id: i,
      x: Math.random() * 50 - 25,
      y: Math.random() * 50 - 25,
      duration: Math.random() * 4 + 3,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  }, [isMounted])

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.push(redirectTo)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, redirectTo])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error

        setMessage('登录成功，正在跳转...')
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
        setMessage('请检查您的邮箱以确认注册')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // 忘记密码处理
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setMessage('请输入邮箱地址')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 使用环境变量或当前域名构建重定向URL
      // 通过 auth callback 路由处理 PKCE code 交换，然后重定向到 reset-password
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectUrl = `${baseUrl}/auth/callback?type=recovery`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      setMessage('密码重置邮件已发送，请检查您的邮箱（包括垃圾邮件文件夹）')
      // 3秒后返回登录界面
      setTimeout(() => {
        setIsForgotPassword(false)
        setMessage('')
      }, 5000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发送重置邮件失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ethereal background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cosmic-void via-cosmic-deep to-mystic-purple/20" />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: `radial-gradient(circle, ${['#FFD700', '#9D00FF', '#00FFFF'][particle.id % 3]} 0%, transparent 70%)`,
              boxShadow: `0 0 8px ${['#FFD700', '#9D00FF', '#00FFFF'][particle.id % 3]}40`,
            }}
            animate={{
              x: [0, particle.x, 0],
              y: [0, particle.y, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Login card with aurora border */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="card-aurora w-full max-w-md mx-4 relative z-10"
      >
        <div className="card-aurora-inner p-8">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <h1 className="font-sacred text-2xl md:text-3xl text-white tracking-wide mb-3">
              {isForgotPassword ? '重置密码' : (isLogin ? '欢迎回来' : '创建账户')}
            </h1>
            <p className="text-starlight-dim text-sm">
              {isForgotPassword
                ? '输入邮箱地址，我们将发送重置链接'
                : (isLogin ? '登录以继续你的意识觉醒之旅' : '开启你的意识探索之旅')}
            </p>
          </div>

        {/* Forgot Password Form */}
        {isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-amber-500/30 text-white placeholder-white/40 rounded-xl py-3 px-4 pl-12 focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                  placeholder="请输入注册时使用的邮箱"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`text-sm p-3 rounded-lg ${
                message.includes('失败') || message.includes('Error') || message.includes('请输入')
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-stardust w-full py-3"
            >
              {loading ? '发送中...' : '发送重置邮件'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false)
                  setMessage('')
                }}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回登录
              </button>
            </div>
          </form>
        ) : (
        /* Auth Form */
        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                姓名
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-amber-500/30 text-white placeholder-white/40 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                  placeholder="请输入您的姓名"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" strokeWidth={2} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-amber-500/30 text-white placeholder-white/40 rounded-xl py-3 px-4 pl-12 focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                placeholder="请输入您的邮箱"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" strokeWidth={2} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-amber-500/30 text-white placeholder-white/40 rounded-xl py-3 px-4 pl-12 pr-12 focus:outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/40 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all backdrop-blur-sm"
                placeholder="请输入您的密码"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-50 p-1 text-purple-400 hover:text-purple-300"
                style={{ background: 'transparent' }}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <Eye size={20} strokeWidth={2} />
                ) : (
                  <EyeOff size={20} strokeWidth={2} />
                )}
              </button>
            </div>
            {/* 忘记密码链接 - 仅在登录模式显示 */}
            {isLogin && (
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setMessage('')
                  }}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  忘记密码？
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${
              message.includes('错误') || message.includes('Error')
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-stardust w-full py-3"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>

          {/* Switch between login/register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage('')
              }}
              className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400 hover:from-amber-300 hover:via-purple-300 hover:to-cyan-300 transition-all font-medium"
            >
              {isLogin ? '还没有账号？立即注册' : '已有账户？点击登录'}
            </button>
          </div>
        </form>
        )}

        {/* Back to home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-purple-400/70 hover:text-purple-300 transition-colors"
          >
            返回首页
          </button>
        </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader-ethereal"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
