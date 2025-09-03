'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
import { DynamicConsciousnessTree } from '@/components/DynamicConsciousnessTree'
import { useConsciousnessTree } from '@/hooks/useConsciousnessTree'

export default function TestDashboardPage() {
  const [showGaiaDialog, setShowGaiaDialog] = useState(false)
  
  // 使用我们的意识树Hook (测试用户)
  const consciousness = useConsciousnessTree('test-dashboard-user')

  // 任务完成处理函数
  const handleCompleteTask = async (taskId: string) => {
    const success = await consciousness.completeTask(taskId, `完成了${taskId}，感到内心平静和觉察力提升`)
    if (success) {
      console.log('🎉 Dashboard任务完成成功！', taskId)
    }
  }

  // 使用consciousness Hook的数据
  const todayTasks = consciousness.availableTasks.map(task => ({
    id: task.taskId,
    title: task.title,
    description: task.description,
    completed: task.status === 'completed'
  })).concat(
    // 添加已完成的任务显示
    Object.values(consciousness.state?.tasks || {})
      .filter(task => task.status === 'completed')
      .map(task => ({
        id: task.taskId,
        title: task.title,
        description: task.description,
        completed: true
      }))
  ).filter((task, index, self) => 
    // 去重
    index === self.findIndex(t => t.id === task.id)
  )

  if (consciousness.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <TreePine className="w-8 h-8 text-purple-400 mr-3" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                未来心灵学院 - 测试版
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">测试用户</span>
              <div className="p-2 text-gray-400">
                <LogOut className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 测试说明 */}
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <h2 className="text-green-400 font-semibold mb-2">🧪 测试版Dashboard</h2>
          <p className="text-green-300 text-sm">
            这是集成了真实功能的Dashboard测试版。点击"开始"按钮完成任务，观察右侧意识树的实时响应！
          </p>
        </div>

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
                  <span>Level {consciousness.state?.currentLevel || 1}</span>
                  <span>{consciousness.state?.totalProgress || 0}% 完成</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${consciousness.nextLevelProgress}%` }}
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
                <span className="ml-auto text-sm text-gray-400">
                  可用: {consciousness.availableTasks.length} | 今日完成: {consciousness.completedTasksToday}
                </span>
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
                        <button 
                          onClick={() => handleCompleteTask(task.id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 hover:scale-105"
                          disabled={consciousness.loading}
                        >
                          {consciousness.loading ? '处理中...' : '开始'}
                        </button>
                      )}
                      {task.completed && (
                        <div className="text-green-400 text-sm">✓ 已完成</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              {todayTasks.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  🎉 所有任务已完成！点击右下角重置按钮可以重新测试
                </div>
              )}
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
                探索"无形的纽带" - 与全球探索者一起研究意识与物质的互动
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
              <DynamicConsciousnessTree
                consciousnessState={consciousness.state}
                width={350}
                height={300}
                onGrowthComplete={() => {
                  console.log('🌱 树木生长完成！')
                }}
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
                "今天，试着聆听沉默中的声音。真正的智慧往往在最安静的时刻显现。"
              </p>
              <button
                onClick={() => setShowGaiaDialog(true)}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                与盖亚对话
              </button>
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
                  <span className="text-gray-400">当前等级</span>
                  <span className="text-white font-semibold">Level {consciousness.state?.currentLevel || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">完成任务</span>
                  <span className="text-white font-semibold">{consciousness.state?.stats?.totalTasksCompleted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">今日完成</span>
                  <span className="text-white font-semibold">{consciousness.completedTasksToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">总进度</span>
                  <span className="text-white font-semibold">{consciousness.state?.totalProgress || 0}%</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Reset Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        onClick={() => consciousness.resetProgress()}
        className="fixed bottom-8 left-8 w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 z-50"
        title="重置所有进度"
      >
        <span className="text-white text-xl">🔄</span>
      </motion.button>

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