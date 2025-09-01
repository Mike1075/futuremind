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
  CheckCircle,
  Calendar,
  Lightbulb,
  Star,
  Leaf
} from 'lucide-react'
import GaiaDialog from '@/components/GaiaDialog'
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

export default function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGaiaDialog, setShowGaiaDialog] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [consciousnessGrowth, setConsciousnessGrowth] = useState(0)
  
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
          setConsciousnessGrowth((progress as UserProgress).consciousness_growth || 0)
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

  const handleTaskComplete = async (taskId: string) => {
    if (completedTasks.includes(taskId)) return
    
    const newCompletedTasks = [...completedTasks, taskId]
    const newGrowth = consciousnessGrowth + 10
    
    setCompletedTasks(newCompletedTasks)
    setConsciousnessGrowth(newGrowth)

    // Update in database
    try {
      const updateData = {
        user_id: user?.id,
        season_id: 'season-1-sound-symphony',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Current season data
  const currentSeason = {
    title: "第一季：声音的交响",
    subtitle: "探索声音、寂静与实相的奥秘",
    week: Math.floor(currentDay / 7) + 1,
    day: currentDay % 7 || 7
  }

  // Today's main quest
  const todayQuest = {
    title: `第${currentSeason.week}周 第${currentSeason.day}天：敞开与觉察`,
    description: "今天我们将探索声音如何在寂静中诞生，以及觉察如何在敞开中涌现。",
    tasks: [
      { id: 'meditation', title: '晨间冥想：聆听内在的寂静', duration: '20分钟', completed: completedTasks.includes('meditation') },
      { id: 'exploration', title: '探索：火山的次声波', duration: '30分钟', completed: completedTasks.includes('exploration') },
      { id: 'reflection', title: '反思：记录今日的声音发现', duration: '15分钟', completed: completedTasks.includes('reflection') },
      { id: 'practice', title: '实践：与一个声音对话', duration: '25分钟', completed: completedTasks.includes('practice') }
    ]
  }

  // Today's meditation
  const todayMeditation = {
    title: "克氏冥想：觉察的艺术",
    description: "不带任何目的地觉察，让意识如镜子般清澈地反映一切。",
    duration: "20分钟",
    guide: "今天我们将练习纯粹的觉察，不试图改变任何东西，只是观察..."
  }

  // PBL Project status
  const pblProject = {
    title: "伊卡洛斯行动：无形的纽带",
    description: "与全球探索者一起研究意识与物质的互动",
    nextAction: "设计声音频率对植物生长影响的实验",
    progress: 35,
    teamMembers: 4
  }

  // Gaia's whisper
  const gaiaWhisper = {
    message: "今天的声音探索让我想起了一个深刻的问题：如果宇宙本身就是一首交响乐，那么寂静是什么？是乐章间的停顿，还是所有声音的源头？",
    relatedLink: "量子场论中的真空涨落",
    type: "深度思考"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
                <p className="text-sm text-gray-400">{currentSeason.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                {user?.user_metadata?.full_name || user?.email}
              </span>
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
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Season Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-white/10 p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-2">{currentSeason.title}</h2>
                <p className="text-gray-300 mb-4">{currentSeason.subtitle}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>第 {currentSeason.week} 周</span>
                  <span>•</span>
                  <span>第 {currentDay} 天</span>
                  <span>•</span>
                  <span>Level {Math.floor(currentDay / 7) + 1}</span>
                </div>
              </div>
            </motion.div>

            {/* Main Quest */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">今日主线任务</h3>
              </div>
              <h4 className="text-lg font-medium text-purple-300 mb-2">{todayQuest.title}</h4>
              <p className="text-gray-300 mb-6">{todayQuest.description}</p>
              
              <div className="space-y-3">
                {todayQuest.tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      task.completed 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    } transition-colors cursor-pointer`}
                    onClick={() => !task.completed && handleTaskComplete(task.id)}
                  >
                    <div className="flex items-center">
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-400 rounded-full mr-3"></div>
                      )}
                      <div>
                        <p className={`font-medium ${task.completed ? 'text-green-300' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-400">{task.duration}</p>
                      </div>
                    </div>
                    {!task.completed && (
                      <Play className="w-4 h-4 text-purple-400" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Today's Meditation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">今日冥想</h3>
              </div>
              <h4 className="text-lg font-medium text-blue-300 mb-2">{todayMeditation.title}</h4>
              <p className="text-gray-300 mb-4">{todayMeditation.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{todayMeditation.duration}</span>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  开始冥想
                </button>
              </div>
            </motion.div>

            {/* PBL Project */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-orange-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">伊卡洛斯行动</h3>
              </div>
              <h4 className="text-lg font-medium text-orange-300 mb-2">{pblProject.title}</h4>
              <p className="text-gray-300 mb-4">{pblProject.description}</p>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">项目进度</span>
                  <span className="text-sm text-orange-400">{pblProject.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${pblProject.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">下一步行动：</p>
                <p className="text-white font-medium">{pblProject.nextAction}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{pblProject.teamMembers} 位探索者</span>
                </div>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  继续探索
                </button>
              </div>
            </motion.div>

            {/* Gaia's Whisper */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30"
            >
              <div className="flex items-center mb-4">
                <Lightbulb className="w-6 h-6 text-purple-400 mr-3" />
                <h3 className="text-xl font-semibold text-white">盖亚的低语</h3>
              </div>

              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full mb-3">
                  {gaiaWhisper.type}
                </span>
                <p className="text-gray-200 leading-relaxed italic">
                  &ldquo;{gaiaWhisper.message}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button className="text-purple-400 hover:text-purple-300 text-sm underline">
                  {gaiaWhisper.relatedLink}
                </button>
                <button
                  onClick={() => setShowGaiaDialog(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  深入对话
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
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

            {/* Growth Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-yellow-400 mr-3" />
                <h3 className="text-lg font-semibold text-white">成长统计</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">连续探索</span>
                  <span className="text-white font-semibold">{currentDay} 天</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">完成任务</span>
                  <span className="text-white font-semibold">{completedTasks.length} 个</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">意识成长</span>
                  <span className="text-white font-semibold">{consciousnessGrowth} 点</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">当前等级</span>
                  <span className="text-white font-semibold">Level {Math.floor(currentDay / 7) + 1}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold text-white mb-4">快速行动</h3>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-400 mr-3" />
                    <span className="text-white">查看学习历程</span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-green-400 mr-3" />
                    <span className="text-white">探索者联盟</span>
                  </div>
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <Leaf className="w-5 h-5 text-purple-400 mr-3" />
                    <span className="text-white">分享洞见</span>
                  </div>
                </button>
              </div>
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
