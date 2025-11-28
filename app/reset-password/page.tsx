'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Key, Eye, EyeOff, CheckCircle } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 检查用户是否已通过Supabase重置链接自动登录
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setIsValidSession(false)
        setMessage('无效的重置链接，请重新申请密码重置')
        // 3秒后跳转到登录页
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setIsValidSession(true)
      }
    }

    // 监听认证状态变化（处理从邮件链接跳转过来的情况）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true)
      }
    })

    checkSession()

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setMessage('密码至少需要6位字符')
      return
    }

    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
      setMessage('密码重置成功！正在跳转到登录页面...')

      // 登出用户，让他们用新密码重新登录
      await supabase.auth.signOut()

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '密码重置失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载中状态
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-void">
        <div className="text-center">
          <div className="loader-ethereal mx-auto mb-4"></div>
          <p className="text-starlight-muted text-body">验证重置链接中...</p>
        </div>
      </div>
    )
  }

  // 无效链接状态
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-void px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="card-glass p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-life-pink/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-life-pink" />
              </div>
              <h1 className="text-h2 text-starlight mb-2">链接已失效</h1>
              <p className="text-body text-starlight-muted mb-6">{message}</p>
              <p className="text-small text-starlight-dim">正在跳转到登录页面...</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // 成功状态
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-void px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="card-glass p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-wisdom-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-wisdom-green" />
              </div>
              <h1 className="text-h2 text-starlight mb-2">密码重置成功</h1>
              <p className="text-body text-starlight-muted">{message}</p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cosmic-void px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="card-glass p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-mystic-purple/30 to-ethereal-blue/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-mystic-purple/40">
              <Key className="w-8 h-8 text-starlight" />
            </div>
            <h1 className="text-h2 text-starlight mb-2">重置密码</h1>
            <p className="text-body text-starlight-muted">请输入您的新密码</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-small font-medium text-starlight-dim mb-2">新密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-ethereal w-full pr-12"
                  placeholder="请输入新密码（至少6位字符）"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-starlight-muted hover:text-starlight transition-colors"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-small font-medium text-starlight-dim mb-2">确认新密码</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-ethereal w-full pr-12"
                  placeholder="请再次输入新密码"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-starlight-muted hover:text-starlight transition-colors"
                >
                  {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {message && (
              <div className={`text-small p-3 rounded-lg ${
                message.includes('成功')
                  ? 'bg-wisdom-green/20 text-wisdom-green border border-wisdom-green/30'
                  : 'bg-life-pink/20 text-life-pink border border-life-pink/30'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-stardust w-full py-3"
            >
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-mystic-purple hover:text-mystic-purple-light transition-colors flex items-center justify-center mx-auto text-small"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回登录
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cosmic-void flex items-center justify-center">
        <div className="loader-ethereal"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
