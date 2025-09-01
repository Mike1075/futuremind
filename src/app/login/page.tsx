'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { UserRole } from '@/types/auth'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { signIn, signUp } = useAuth()

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const initialHeight = window.screen.height
      setKeyboardVisible(currentHeight < initialHeight * 0.75)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        // 登录
        if (email && password) {
          const { error } = await signIn(email, password)
          if (error) {
            setMessage(`登录失败: ${error}`)
          } else {
            setMessage('登录成功！正在跳转...')
            setTimeout(() => {
              router.replace('/dashboard')
            }, 1000)
          }
        } else {
          setMessage('请输入邮箱和密码')
        }
      } else {
        // 注册
        if (email && password && fullName) {
          const { error } = await signUp(email, password, fullName, role)
          if (error) {
            setMessage(`注册失败: ${error}`)
          } else {
            setMessage('注册成功！请检查邮箱验证链接')
            setIsLogin(true)
            setPassword('')
          }
        } else {
          setMessage('请填写所有必填字段')
        }
      }
    } catch (error) {
      setMessage(`操作失败: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${
      keyboardVisible ? 'items-start pt-4' : 'items-center'
    }`}>
      {/* Mobile header */}
      {isMobile && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← 返回
            </button>
            <h1 className="text-white font-medium">
              {isLogin ? '登录' : '注册'}
            </h1>
            <div className="w-8"></div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-black/30"></div>
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              animate={{
                x: [0, Math.random() * 100, 0],
                y: [0, Math.random() * 100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className={`bg-white/10 backdrop-blur-md rounded-2xl w-full border border-white/20 shadow-2xl ${
          isMobile 
            ? `mx-4 ${keyboardVisible ? 'p-4 mt-16' : 'p-6 max-w-sm'}`
            : 'p-8 max-w-md mx-4'
        }`}
      >
        {/* Desktop header */}
        {!isMobile && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Future Mind Institute
            </h1>
            <p className="text-gray-300">
              {isLogin ? '欢迎回来' : '开启意识觉醒之旅'}
            </p>
          </div>
        )}

        {/* Toggle buttons */}
        <div className={`flex bg-white/5 rounded-lg p-1 mb-6 ${isMobile ? 'mb-4' : 'mb-6'}`}>
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              isLogin 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              !isLogin 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                姓名
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                  isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-3'
                }`}
                placeholder="请输入您的姓名"
                required={!isLogin}
              />
            </motion.div>
          )}

          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
                用户角色
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={`w-full bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                  isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-3'
                }`}
              >
                <option value="student" className="bg-gray-800">学员</option>
                <option value="guest" className="bg-gray-800">游客</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                学员可以参与课程和项目，游客只能浏览内容
              </p>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-3'
              }`}
              placeholder={isLogin ? "demo@futuremind.com" : "请输入您的邮箱"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                isMobile ? 'px-3 py-2.5 text-base' : 'px-4 py-3'
              }`}
              placeholder={isLogin ? "demo123" : "请设置密码"}
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${isMobile ? 'text-xs' : 'text-sm'} ${
              message.includes('错误') || message.includes('Error') 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isMobile 
                ? 'py-2.5 text-sm active:scale-95' 
                : 'py-3 transform hover:scale-105 disabled:transform-none'
            }`}
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        {isLogin && (
          <div className={`text-center ${isMobile ? 'mt-4' : 'mt-6'}`}>
            <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              演示模式: 输入任意邮箱和密码即可登录
            </p>
          </div>
        )}

        {!isMobile && (
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              返回首页
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}