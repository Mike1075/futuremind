'use client'

import { DatabaseConsciousnessRoots } from '@/components/ui/database-consciousness-roots'
import { ConsciousnessLevelBadge } from '@/components/ConsciousnessLevelBadge'
import { FruitsOverlay } from '@/components/FruitsOverlay'
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
  const [useMockMode, setUseMockMode] = useState(true) // 默认启用Mock模式用于测试
  const [testLevel, setTestLevel] = useState(4)
  const [testProgress, setTestProgress] = useState(65)

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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {isMounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
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
                onClick={() => router.push('/explorer-alliance')}
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
        <DatabaseConsciousnessRoots
          mockMode={useMockMode}
          mockLevel={testLevel}
          mockProgress={testProgress}
          mockDomains={{
            self_awareness: 0.7,
            life_sciences: 0.6,
            universal_laws: 0.65,
            creative_expression: 0.8,
            social_connection: 0.75
          }}
        />
      </div>

      {/* 测试控制面板 */}
      {useMockMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="fixed bottom-8 left-8 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg z-50 space-y-3"
        >
          <div className="text-green-400 font-semibold text-sm mb-2">🧪 测试模式</div>

          {/* 等级选择 */}
          <div>
            <label className="text-white text-xs block mb-1">等级 (Level {testLevel})</label>
            <input
              type="range"
              min="1"
              max="7"
              value={testLevel}
              onChange={(e) => setTestLevel(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>L1🔴</span><span>L2🟠</span><span>L3🟡</span><span>L4🟢</span>
              <span>L5🔵</span><span>L6🔵</span><span>L7🟣</span>
            </div>
          </div>

          {/* 进度选择 */}
          <div>
            <label className="text-white text-xs block mb-1">进度 ({testProgress}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={testProgress}
              onChange={(e) => setTestProgress(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>种子</span><span>发芽</span><span>幼苗</span><span>小树</span><span>大树</span>
            </div>
          </div>

          {/* 快捷测试按钮 */}
          <div className="grid grid-cols-5 gap-1 mt-2">
            <button
              onClick={() => { setTestLevel(1); setTestProgress(10) }}
              className="text-xs px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-white rounded"
            >种子🌰</button>
            <button
              onClick={() => { setTestLevel(2); setTestProgress(30) }}
              className="text-xs px-2 py-1 bg-orange-600/30 hover:bg-orange-600/50 text-white rounded"
            >发芽🌱</button>
            <button
              onClick={() => { setTestLevel(3); setTestProgress(50) }}
              className="text-xs px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-white rounded"
            >幼苗🌿</button>
            <button
              onClick={() => { setTestLevel(5); setTestProgress(70) }}
              className="text-xs px-2 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-white rounded"
            >小树🌲</button>
            <button
              onClick={() => { setTestLevel(7); setTestProgress(90) }}
              className="text-xs px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-white rounded"
            >大树🌳</button>
          </div>

          <button
            onClick={() => setUseMockMode(false)}
            className="w-full text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded mt-2"
          >
            切换到真实数据
          </button>
        </motion.div>
      )}

      {/* Mock Mode Toggle (when disabled) */}
      {!useMockMode && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          onClick={() => setUseMockMode(true)}
          className="fixed bottom-8 left-8 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg shadow-lg transition-all duration-300 z-50"
        >
          🔒 切换到测试模式
        </motion.button>
      )}

      {/* Fruits Overlay */}
      <FruitsOverlay />

      {/* Consciousness Level Badge */}
      <ConsciousnessLevelBadge />

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