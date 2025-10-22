'use client'

import { DatabaseConsciousnessRoots } from '@/components/ui/database-consciousness-roots'
import { motion } from 'framer-motion'
import { TreePine, Users, LogOut, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import GaiaDialog from '@/components/GaiaDialog'

export default function SimpleTreePage() {
  const router = useRouter()
  const supabase = createClient()
  const [showGaiaDialog, setShowGaiaDialog] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // 确保只在客户端渲染
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 生成固定的粒子配置
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-20"
            animate={{
              x: [0, particle.x],
              y: [0, particle.y],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
          />
        ))}
      </div>

      {/* 顶部导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 bg-black/20 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回个人门户 */}
            <button
              onClick={() => router.push('/portal')}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
            >
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-medium">返回门户</span>
            </button>

            {/* 中间：标题 */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
                  <TreePine className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">意识进化树</h2>
              </div>
              <div className="text-sm text-green-200 hidden sm:block">你的觉醒成长轨迹</div>
            </div>

            {/* 右侧：快捷入口与登出 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/alliance')}
                className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
              >
                <span className="font-medium">探索者联盟</span>
                <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-300 hover:text-red-200 transition-colors duration-300 group"
              >
                <span className="font-medium">登出</span>
                <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center group-hover:bg-red-600/40 transition-colors duration-300">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* 意识树主体内容 */}
      <div className="relative z-10 w-full" style={{ height: 'calc(100vh - 80px)' }}>
        <DatabaseConsciousnessRoots />
      </div>

      {/* Floating Gaia Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={() => setShowGaiaDialog(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 z-50"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </motion.button>

      {/* Gaia Dialog */}
      <GaiaDialog isOpen={showGaiaDialog} onClose={() => setShowGaiaDialog(false)} />
    </div>
  )
}