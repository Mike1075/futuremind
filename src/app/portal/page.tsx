'use client'

import { useState, useEffect, useCallback } from 'react'
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
  CheckCircle,
  Calendar,
  TrendingUp,
  Book,
  Zap
} from 'lucide-react'
import GaiaDialog from '@/components/GaiaDialog'
import ConsciousnessTree3D from '@/components/ConsciousnessTree3D'

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

export default function PersonalPortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentDay, setCurrentDay] = useState(1)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [showGaiaDialog, setShowGaiaDialog] = useState(false)
  const [consciousnessLevel, setConsciousnessLevel] = useState(1)
  const [totalGrowth, setTotalGrowth] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setConsciousnessLevel((profile as any).consciousness_level || 1)
      }

      // Load user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (progress && !progressError) {
        setCurrentDay((progress as UserProgress).current_day || 1)
        setCompletedTasks((progress as UserProgress).completed_tasks || [])
        setTotalGrowth((progress as UserProgress).consciousness_growth || 0)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user as User)
        // Load user progress and profile
        await loadUserData(user.id)
      } else {
        router.push('/login')
      }
      setLoading(false)
    }

    getUser()
  }, [router, supabase, loadUserData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const completeTask = async (taskId: string) => {
    if (completedTasks.includes(taskId)) return

    const newCompletedTasks = [...completedTasks, taskId]
    const newGrowth = totalGrowth + 10

    setCompletedTasks(newCompletedTasks)
    setTotalGrowth(newGrowth)

    // Update in database
    try {
      const updateData = {
        user_id: user?.id,
        season_id: 'current-season', // 这里应该是实际的season ID
        completed_tasks: newCompletedTasks,
        consciousness_growth: newGrowth,
        current_day: currentDay
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('user_progress')
        .upsert(updateData)
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const todayTasks = [
    { 
      id: 'meditation', 
      title: '今日冥想', 
      description: '克里希那穆提冥想练习 - 观察思维的流动', 
      completed: completedTasks.includes('meditation'),
      duration: '15分钟',
      type: 'practice'
    },
    { 
      id: 'listening', 
      title: '声音探索', 
      description: '聆听自然的声音，感受声音的层次', 
      completed: completedTasks.includes('listening'),
      duration: '20分钟',
      type: 'exploration'
    },
    { 
      id: 'reflection', 
      title: '内观反思', 
      description: '记录今日觉察和内在体验', 
      completed: completedTasks.includes('reflection'),
      duration: '10分钟',
      type: 'reflection'
    },
    { 
      id: 'reading', 
      title: '智慧阅读', 
      description: '阅读今日推荐的意识觉醒文章', 
      completed: completedTasks.includes('reading'),
      duration: '25分钟',
      type: 'study'
    }
  ]

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'practice': return Zap
      case 'exploration': return TreePine
      case 'reflection': return Book
      case 'study': return Sparkles
      default: return Target
    }
  }

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'practice': return 'from-yellow-500 to-orange-500'
      case 'exploration': return 'from-green-500 to-emerald-500'
      case 'reflection': return 'from-blue-500 to-indigo-500'
      case 'study': return 'from-purple-500 to-pink-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <TreePine className="w-8 h-8 text-purple-400 mr-3" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  个人探索基地
                </h1>
                <p className="text-sm text-gray-400">
                  欢迎回来，{user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">意识等级</div>
                <div className="text-lg font-bold text-purple-400">Level {consciousnessLevel}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Sparkles className="w-6 h-6 text-yellow-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">第一季：声音的交响</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-300">第 {currentDay} 天</div>
                    <div className="text-xs text-purple-300">{Math.round((currentDay / 30) * 100)}% 完成</div>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(currentDay / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                今天的主题：敞开与觉察 - 让我们一起探索声音的奥秘，感受宇宙的低语
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
                <h2 className="text-xl font-semibold text-white">今日探索任务</h2>
                <div className="ml-auto text-sm text-gray-400">
                  {completedTasks.length}/{todayTasks.length} 已完成
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayTasks.map((task, index) => {
                  const Icon = getTaskIcon(task.type)
                  return (
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
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${getTaskColor(task.type)} mr-3`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white mb-1">{task.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="w-3 h-3 mr-1" />
                              {task.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <button 
                              onClick={() => completeTask(task.id)}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              开始
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
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
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
                    进行中
                  </span>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                探索&ldquo;无形的纽带&rdquo; - 与全球探索者一起研究意识与物质的互动
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>参与者: 127人</span>
                  <span>进度: 第2阶段</span>
                </div>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  查看详情
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* 3D Consciousness Tree */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <TreePine className="w-6 h-6 text-green-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">3D意识进化树</h3>
              </div>
              <ConsciousnessTree3D 
                currentDay={currentDay} 
                completedTasks={completedTasks}
                className="w-full"
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  拖拽旋转 • 滚轮缩放 • 点击节点查看详情
                </p>
              </div>
            </motion.div>

            {/* Growth Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                成长统计
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">连续天数</span>
                  <span className="text-white font-semibold">{currentDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">完成任务</span>
                  <span className="text-white font-semibold">{completedTasks.length * currentDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">意识成长</span>
                  <span className="text-white font-semibold">{totalGrowth} 点</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">觉察深度</span>
                  <span className="text-white font-semibold">Level {consciousnessLevel}</span>
                </div>
              </div>
            </motion.div>

            {/* Gaia's Whisper */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center mb-4">
                <MessageCircle className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">盖亚的低语</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                &ldquo;今天，试着聆听沉默中的声音。真正的智慧往往在最安静的时刻显现。每一次呼吸都是与宇宙的对话。&rdquo;
              </p>
              <button 
                onClick={() => setShowGaiaDialog(true)}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                与盖亚深度对话
              </button>
            </motion.div>
          </div>
        </div>
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
