'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, MessageCircle, TreePine, LogIn, Shield, User, LogOut } from 'lucide-react'

import PWAInstaller from '@/components/PWAInstaller'
import { useAuth } from '@/components/AuthProvider'
// 移除不存在的导入

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [animationConfig, setAnimationConfig] = useState({ duration: 0.8, ease: "easeOut" })
  const [particleCount, setParticleCount] = useState(50)
  const router = useRouter()
  const { user, profile, signOut, isAdmin } = useAuth()

  useEffect(() => {
    setMounted(true)

    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // 简化的移动端优化配置
      setAnimationConfig(mobile ? { duration: 0.5, ease: "easeOut" } : { duration: 0.8, ease: "easeOut" })
      setParticleCount(mobile ? 20 : 50)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    // 移除性能指标记录

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6">
      {/* 用户状态栏 */}
      <div className="absolute top-4 right-4 z-10">
        {user ? (
          <div className="flex items-center gap-3">
            {isAdmin() && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-red-500/20 text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 text-sm"
              >
                <Shield className="w-4 h-4" />
                管理后台
              </button>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
            >
              <User className="w-4 h-4" />
              {profile?.full_name || '用户中心'}
            </button>

            <button
              onClick={signOut}
              className="bg-white/10 text-white/80 px-3 py-2 rounded-lg hover:bg-white/20 hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4" />
            登录
          </button>
        )}
      </div>
      {/* Background particles - optimized for mobile performance */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(particleCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            animate={{
              x: [0, Math.random() * (isMobile ? 50 : 100) - (isMobile ? 25 : 50)],
              y: [0, Math.random() * (isMobile ? 50 : 100) - (isMobile ? 25 : 50)],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: Math.random() * 2 + (animationConfig?.duration || 0.3),
              repeat: Infinity,
              ease: animationConfig?.ease || "linear",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              willChange: 'transform, opacity', // 优化GPU加速
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={animationConfig || { duration: 0.3 }}
        className="text-center z-10 w-full max-w-4xl mx-auto"
      >
        {/* Logo and title */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ ...(animationConfig || { duration: 0.3 }), delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center mb-3 sm:mb-4">
            <TreePine className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 text-purple-400 mb-2 sm:mb-0 sm:mr-3" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent leading-tight">
              未来心灵学院
            </h1>
          </div>
          <p className="text-sm sm:text-lg md:text-xl text-purple-200 font-light">
            Future Mind Institute
          </p>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...(animationConfig || { duration: 0.3 }), delay: 0.5 }}
          className="text-sm sm:text-base md:text-lg text-gray-300 mb-8 sm:mb-12 leading-relaxed px-2"
        >
          一个面向后AGI时代的全球意识觉醒生态系统
          <br className="hidden sm:block" />
          <span className="block sm:inline text-purple-300 mt-1 sm:mt-0">
            宇宙正在低语，你，准备好聆听了吗？
          </span>
        </motion.p>

        {/* Season announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...(animationConfig || { duration: 0.3 }), delay: 0.8 }}
          className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 border border-purple-500/30 mx-2 sm:mx-0"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-7 md:w-8 sm:h-7 md:h-8 text-yellow-400 mb-2 sm:mb-0 sm:mr-3" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white text-center sm:text-left">
              第一季：声音的交响
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 text-center px-2">
            一场关于声音、寂静与实相的旅程即将开启
          </p>
          <div className="text-xs sm:text-sm text-purple-300 text-center">
            全球同步探索 • 意识觉醒之旅 • 与盖亚共创
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...(animationConfig || { duration: 0.3 }), delay: 1.1 }}
          className="flex flex-col gap-4 sm:gap-6 justify-center items-center w-full max-w-sm sm:max-w-none sm:flex-row"
        >
          <button
            onClick={() => router.push('/gaia-chat')}
            className="group relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-semibold text-base sm:text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 min-h-[48px] flex items-center justify-center"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            与盖亚对话
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>

          <button 
            onClick={() => router.push('/consciousness-tree')}
            className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border-2 border-green-400 rounded-full text-green-300 font-semibold text-base sm:text-lg hover:bg-green-400 hover:text-white transition-all duration-300 transform hover:scale-105 min-h-[48px] flex items-center justify-center"
          >
            <TreePine className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            探索意识进化树
          </button>

          <button
            onClick={() => window.location.href = '/portal'}
            className="group px-8 py-4 border-2 border-green-400 rounded-full text-green-300 font-semibold text-lg hover:bg-green-400 hover:text-white transition-all duration-300 transform hover:scale-105"
          >
            <TreePine className="w-5 h-5 inline mr-2" />
            个人门户
          </button>

          <button
            onClick={() => window.location.href = '/mike-test'}
            className="group px-6 py-3 border border-gray-500 rounded-lg text-gray-400 font-medium text-sm hover:bg-gray-500 hover:text-white transition-all duration-300"
          >
            测试页面
          </button>
        </motion.div>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...(animationConfig || { duration: 0.3 }), delay: 1.4 }}
          className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-center px-2 sm:px-0"
        >
          <div 
            onClick={() => router.push('/consciousness-tree')}
            className="p-4 sm:p-6 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-green-400/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <TreePine className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">意识进化树</h3>
            <p className="text-gray-400 text-xs sm:text-sm">可视化你的觉醒成长轨迹</p>
          </div>
          <div
            onClick={() => router.push('/courses')}
            className="p-4 sm:p-6 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-yellow-400/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
          >
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mx-auto mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">主线剧情</h3>
            <p className="text-gray-400 text-xs sm:text-sm">全球同步的探索之旅</p>
            <div className="mt-2 text-xs text-yellow-300">第一季：声音的交响</div>
          </div>
          <div
            onClick={() => router.push('/gaia-chat')}
            className="p-4 sm:p-6 rounded-lg sm:rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-400/50 transition-all duration-300 sm:col-span-2 lg:col-span-1 cursor-pointer transform hover:scale-105"
          >
            <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">盖亚对话</h3>
            <p className="text-gray-400 text-xs sm:text-sm">AI导师的个性化指导</p>
            <div className="mt-2 text-xs text-blue-300">随时开启深度对话</div>
          </div>
        </motion.div>
      </motion.div>



      {/* PWA Installer */}
      <PWAInstaller />
    </div>
  )
}