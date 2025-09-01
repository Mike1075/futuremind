'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  TreePine,
  MessageCircle,
  Sparkles,
  Target,
  Users,
  LogOut,
  Play,
  CheckCircle,
  Menu,
  X
} from 'lucide-react'
import GaiaDialog from '@/components/GaiaDialog'
import ConsciousnessTree from '@/components/ConsciousnessTree'
import MobileBottomNav from '@/components/MobileBottomNav'

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
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  // const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) setShowSidebar(false)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      // 模拟模式：跳过真实的 Supabase 认证检查
      // 创建模拟用户数据
      const mockUser = {
        id: 'demo-user-id',
        email: 'demo@futuremind.com',
        user_metadata: {
          full_name: '演示用户'
        }
      }
      
      setUser(mockUser as User)
      // 使用模拟的用户进度数据
      setCurrentDay(3)
      setCompletedTasks(['meditation'])
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleLogout = async () => {
    // 清理演示认证cookie并返回首页
    try {
      document.cookie = 'demo_auth=; path=/; max-age=0'
    } catch (_) {
      // 忽略客户端cookie清理异常
    }
    // 模拟模式：直接跳转到首页
    router.push('/')
  }

  const handleTreeClick = () => {
    router.push('/consciousness-tree')
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

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 text-gray-400 hover:text-white transition-colors mr-2"
                >
                  {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              <TreePine className={`text-purple-400 mr-3 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
              <h1 className={`font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent ${
                isMobile ? 'text-lg' : 'text-xl'
              }`}>
                {isMobile ? '未来心灵' : '未来心灵学院'}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              {!isMobile && (
                <span className="text-gray-300 text-sm">
                  欢迎，{user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="退出登录"
              >
                <LogOut className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className={`${isMobile ? 'block' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
          {/* Main Content */}
          <div className={`${isMobile ? 'mb-6' : 'lg:col-span-2'} space-y-6 lg:space-y-8`}>
            {/* Season Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-purple-500/30"
            >
              <div className="flex items-center mb-4">
                <Sparkles className={`text-yellow-400 mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <h2 className={`font-semibold text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  {isMobile ? '第一季：声音交响' : '第一季：声音的交响'}
                </h2>
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
                  通过"项目式学习"培养实践能力和团队协作精神
                </p>
            </motion.div>

            {/* Today's Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10"
            >
              <div className={`flex items-center ${isMobile ? 'mb-4' : 'mb-6'}`}>
                <Target className={`text-green-400 mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <h2 className={`font-semibold text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>今日任务</h2>
              </div>
              <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                {todayTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`rounded-lg border transition-all duration-300 ${
                      isMobile ? 'p-3' : 'p-4'
                    } ${
                      task.completed 
                        ? 'bg-green-500/20 border-green-500/30' 
                        : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'}`}>
                      <div className="flex items-center">
                        {task.completed ? (
                          <CheckCircle className={`text-green-400 mr-3 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                        ) : (
                          <Play className={`text-purple-400 mr-3 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                        )}
                        <div>
                          <h3 className={`font-medium text-white ${isMobile ? 'text-sm' : ''}`}>{task.title}</h3>
                          <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>{task.description}</p>
                        </div>
                      </div>
                      {!task.completed && (
                        <button className={`bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                          isMobile ? 'px-3 py-1.5 text-sm w-full' : 'px-4 py-2'
                        }`}>
                          开始
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <button 
                  onClick={() => router.push('/courses')}
                  className={`text-purple-400 hover:text-purple-300 transition-colors ${
                    isMobile ? 'text-sm' : ''
                  }`}
                >
                  查看更多课程 →
                </button>
              </div>
            </motion.div>

            {/* PBL Project */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
              onClick={() => router.push('/projects')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center mb-4">
                <Users className={`text-blue-400 mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <h2 className={`font-semibold text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>伊卡洛斯行动</h2>
              </div>
              <p className={`text-gray-300 mb-4 ${isMobile ? 'text-sm' : ''}`}>
                探索&ldquo;无形的纽带&rdquo; - 与全球探索者一起研究意识与物质的互动
              </p>
              <button className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                isMobile ? 'px-4 py-2 text-sm w-full' : 'px-6 py-3'
              }`}>
                加入项目
              </button>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className={`${
            isMobile 
              ? `fixed inset-y-0 right-0 z-50 w-80 bg-black/90 backdrop-blur-md transform transition-transform duration-300 ease-in-out ${
                  showSidebar ? 'translate-x-0' : 'translate-x-full'
                } overflow-y-auto`
              : 'space-y-6'
          }`}>
            {/* Mobile sidebar header */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">控制面板</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className={`${isMobile ? 'p-4 space-y-4' : 'space-y-6'}`}>
              {/* Consciousness Tree */}
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10 cursor-pointer hover:border-green-500/30 transition-colors"
                onClick={handleTreeClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center mb-4">
                  <TreePine className={`text-green-400 mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>意识进化树</h3>
                </div>
                <ConsciousnessTree
                  currentDay={currentDay}
                  completedTasks={completedTasks}
                  className="w-full"
                  onClick={handleTreeClick}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">点击查看详细</p>
              </motion.div>

              {/* Gaia's Whisper */}
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-purple-500/30"
              >
                <div className="flex items-center mb-4">
                  <MessageCircle className={`text-purple-400 mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                  <h3 className={`font-semibold text-white ${isMobile ? 'text-base' : 'text-lg'}`}>盖亚的低语</h3>
                </div>
                <p className={`text-gray-300 mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  &ldquo;今天，试着聆听沉默中的声音。真正的智慧往往在最安静的时刻显现。&rdquo;
                </p>
                <button
                  onClick={() => {
                    setShowGaiaDialog(true)
                    if (isMobile) setShowSidebar(false)
                  }}
                  className={`w-full bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                    isMobile ? 'py-1.5 text-sm' : 'py-2'
                  }`}
                >
                  与盖亚对话
                </button>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 lg:p-6 border border-white/10"
              >
                <h3 className={`font-semibold text-white mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>成长统计</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>连续天数</span>
                    <span className={`text-white font-semibold ${isMobile ? 'text-sm' : ''}`}>{currentDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>完成任务</span>
                    <span className={`text-white font-semibold ${isMobile ? 'text-sm' : ''}`}>{completedTasks.length * currentDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-gray-400 ${isMobile ? 'text-sm' : ''}`}>觉察深度</span>
                    <span className={`text-white font-semibold ${isMobile ? 'text-sm' : ''}`}>Level {Math.floor(currentDay / 7) + 1}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Gaia Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={() => setShowGaiaDialog(true)}
        className={`fixed bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 z-50 ${
          isMobile 
            ? 'bottom-4 right-4 w-12 h-12 active:scale-95' 
            : 'bottom-8 right-8 w-16 h-16 hover:scale-110'
        }`}
      >
        <MessageCircle className={`text-white ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
      </motion.button>

      {/* Mobile sidebar overlay */}
      {isMobile && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onGaiaClick={() => setShowGaiaDialog(true)}
        />
      )}

      {/* Gaia Dialog */}
      <GaiaDialog isOpen={showGaiaDialog} onClose={() => setShowGaiaDialog(false)} />
    </div>
  )
}