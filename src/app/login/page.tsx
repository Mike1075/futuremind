'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

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

    // 模拟API调用 - 任意邮箱密码都可以登录
    if (isLogin) {
      if (email && password) {
        setMessage('登录成功！正在跳转...')
        // 在演示模式下写入临时认证cookie，配合中间件放行
        try {
          if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            document.cookie = 'demo_auth=1; path=/; max-age=86400'
          }
        } catch (_) {
          // 忽略客户端cookie写入异常
        }
        // 使用replace确保跳转成功，并添加调试信息
        setTimeout(() => {
          console.log('正在跳转到dashboard...')
          router.replace('/dashboard')
        }, 1000)
      } else {
        setMessage('请输入邮箱和密码')
        setLoading(false)
      }
    } else {
      if (email && password && fullName) {
        setMessage('注册成功！请登录')
        setIsLogin(true)
        setPassword('')
        setLoading(false)
      } else {
        setMessage('请填写所有必填字段')
        setLoading(false)
      }
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