'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsciousnessTreeView } from './ConsciousnessTreeView'
import { ArrowLeft, RefreshCw, Plus, Zap } from 'lucide-react'

interface ConsciousnessTreeClientProps {
  userId: string
  userRole: string | null
}

export function ConsciousnessTreeClient({ userId, userRole }: ConsciousnessTreeClientProps) {
  const router = useRouter()
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const isAdmin = userRole && ['principal', 'teacher'].includes(userRole)

  // 手动触发AI评估
  const handleEvaluate = async () => {
    try {
      setIsEvaluating(true)
      setMessage(null)

      const response = await fetch('https://lvjezsnwesyblnlkkirz.supabase.co/functions/v1/evaluate-consciousness-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: userId }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '评估成功！意识树已更新' })
        // 刷新页面以显示新数据
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: data.error || '评估失败' })
      }
    } catch (error) {
      console.error('评估失败:', error)
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setIsEvaluating(false)
    }
  }

  // 手动添加成长值（测试用）
  const handleAddGrowth = async (amount: number) => {
    try {
      setMessage(null)
      const response = await fetch('/api/consciousness/add-growth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: `已添加 ${amount} 成长值` })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' })
      }
    } catch (error) {
      console.error('添加成长值失败:', error)
      setMessage({ type: 'error', text: '网络错误' })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 顶部导航 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-md border-b border-white/10"
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/portal')}
              className="flex items-center space-x-2 text-red-300 hover:text-red-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回探索基地</span>
            </button>

            <h1 className="text-2xl font-bold text-white">我的意识树</h1>

            <div className="w-24"></div>
          </div>
        </div>
      </motion.nav>

      {/* 主内容 */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：意识树可视化 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="relative h-[600px] w-full bg-black rounded-lg overflow-hidden">
                <ConsciousnessTreeView userId={userId} />
              </div>
            </motion.div>
          </div>

          {/* 右侧：信息和控制面板 */}
          <div className="space-y-6">
            {/* 系统消息 */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}
              >
                {message.text}
              </motion.div>
            )}

            {/* 说明卡片 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold mb-4 text-red-400">意识树说明</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <strong className="text-white">根系：</strong>知识获取、深度理解
                </div>
                <div>
                  <strong className="text-white">树干：</strong>内在稳态、坚持
                </div>
                <div>
                  <strong className="text-white">枝干：</strong>探索广度
                </div>
                <div>
                  <strong className="text-white">树叶：</strong>洞见产出
                </div>
                <div>
                  <strong className="text-white">果实：</strong>创造产出
                </div>
              </div>

              <div className="mt-6 p-4 bg-black/30 rounded-lg">
                <p className="text-xs text-gray-400">
                  意识树会根据你的学习行为自动生长。包括：在线时长、对话深度、作业质量、PBL项目完成度等。
                </p>
              </div>
            </motion.div>

            {/* 管理员测试面板 */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30"
              >
                <h3 className="text-lg font-semibold mb-4 text-purple-400">
                  🔧 管理员测试面板
                </h3>

                <div className="space-y-3">
                  {/* AI评估按钮 */}
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/30 hover:bg-blue-600/40 disabled:bg-gray-600/30 rounded-lg border border-blue-500/50 transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${isEvaluating ? 'animate-spin' : ''}`} />
                    {isEvaluating ? '评估中...' : '触发AI评估'}
                  </button>

                  {/* 快速添加成长值 */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">快速添加成长值（测试）</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAddGrowth(10)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600/30 hover:bg-green-600/40 rounded-lg border border-green-500/50 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        +10
                      </button>
                      <button
                        onClick={() => handleAddGrowth(50)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600/30 hover:bg-green-600/40 rounded-lg border border-green-500/50 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        +50
                      </button>
                      <button
                        onClick={() => handleAddGrowth(100)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600/30 hover:bg-green-600/40 rounded-lg border border-green-500/50 text-sm"
                      >
                        <Zap className="w-4 h-4" />
                        +100
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <p className="text-xs text-gray-400">
                    ⚠️ 这些是测试功能，仅管理员可见
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
