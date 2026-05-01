'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  TreePine,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  LogOut,
  Play,
  CheckCircle
} from 'lucide-react'
import GaiaDialog from '@/components/GaiaDialog'
import UploadToGaia from '@/components/UploadToGaia'
import ConsciousnessTree from '@/components/ConsciousnessTree'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
  }
}

interface UserProgress {
  id: string
  user_id: string
  season_id: string
  current_day: number
  completed_tasks: string[]
  consciousness_growth: number
  created_at: string
  updated_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDay, setCurrentDay] = useState(1)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [showGaiaDialog, setShowGaiaDialog] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user as User)
        // Load user progress
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (progress && !progressError) {
          setCurrentDay((progress as UserProgress).current_day || 1)
          setCompletedTasks((progress as UserProgress).completed_tasks || [])
        }
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const todayTasks = [
    { id: 'meditation', title: '今日冥想', description: '克里希那穆提冥想练习', completed: completedTasks.includes('meditation') },
    { id: 'listening', title: '声音探索', description: '聆听自然的声音', completed: completedTasks.includes('listening') },
    { id: 'reflection', title: '内观反思', description: '记录今日觉察', completed: completedTasks.includes('reflection') }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 bg-white/5 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧：返回主页 */}
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
            >
              <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <span className="font-medium">返回主页</span>
            </button>

            {/* 中间：页面标题和用户信息 */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white">仪表板</h2>
              </div>
              <div className="text-sm text-purple-200">
                欢迎，{user?.user_metadata?.full_name || user?.email}
              </div>
            </div>

            {/* 右侧：导航按钮和登出 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/alliance'}
                className="flex items-center space-x-2 text-purple-300 hover:text-purple-200 transition-colors duration-300 group"
              >
                <span className="font-medium">探索者联盟</span>
                <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center group-hover:bg-purple-600/40 transition-colors duration-300">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </button>
              
              <button
                onClick={() => window.location.href = '/portal'}
                className="flex items-center space-x-2 text-green-300 hover:text-green-200 transition-colors duration-300 group"
              >
                <span className="font-medium">个人门户</span>
                <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center group-hover:bg-green-600/40 transition-colors duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Season Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-yellow-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">第一季：声音的交响</h2>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>第 {currentDay} 天</span>
                  <span>{Math.round((currentDay / 30) * 100)}% 完成</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentDay / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                今天的主题：敞开与觉察 - 让我们一起探索声音的奥秘
              </p>
            </motion.div>

            {/* Today's Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-6">
                <Target className="w-6 h-6 text-green-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">今日任务</h2>
              </div>
              <div className="space-y-4">
                {todayTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      task.completed 
                        ? 'bg-green-500/20 border-green-500/30' 
                        : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                        ) : (
                          <Play className="w-5 h-5 text-purple-400 mr-3" />
                        )}
                        <div>
                          <h3 className="font-medium text-white">{task.title}</h3>
                          <p className="text-sm text-gray-400">{task.description}</p>
                        </div>
                      </div>
                      {!task.completed && (
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          开始
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* PBL Project */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">伊卡洛斯行动</h2>
              </div>
              <p className="text-gray-300 mb-4">
                                探索&ldquo;无形的纽带&rdquo; - 与全球探索者一起研究意识与物质的互动
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                加入项目
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Consciousness Tree */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <TreePine className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">意识进化树</h3>
              </div>
              <ConsciousnessTree
                currentDay={currentDay}
                completedTasks={completedTasks}
                className="w-full"
              />
            </motion.div>

            {/* Gaia's Whisper */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">盖亚的低语</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                &ldquo;今天，试着聆听沉默中的声音。真正的智慧往往在最安静的时刻显现。&rdquo;
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowGaiaDialog(true)}
                  className="py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  与盖亚对话
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className="py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  上传文档给盖亚
                </button>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">成长统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">连续天数</span>
                  <span className="text-white font-semibold">{currentDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">完成任务</span>
                  <span className="text-white font-semibold">{completedTasks.length * currentDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">觉察深度</span>
                  <span className="text-white font-semibold">Level {Math.floor(currentDay / 7) + 1}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 快速导航区域 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="container mx-auto px-6 py-8"
      >
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-center text-lg font-semibold text-white mb-6">
            🚀 继续你的探索之旅
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>返回主页</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/alliance'}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              <Users className="w-4 h-4" />
              <span>探索者联盟</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/portal'}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>个人门户</span>
            </button>
          </div>
        </div>
      </motion.div>

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
      <UploadToGaia isOpen={showUpload} onClose={() => setShowUpload(false)} />
    </div>
  )
}
