'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsciousnessTreeView } from './ConsciousnessTreeView'
import { ArrowLeft, RefreshCw, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ConsciousnessTreeClientProps {
  userId: string
  userRole: string | null
}

export function ConsciousnessTreeClient({ userId, userRole }: ConsciousnessTreeClientProps) {
  const router = useRouter()
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [key, setKey] = useState(0) // 用于强制刷新ConsciousnessTreeView

  // 5个部位的成长值状态
  const [growthValues, setGrowthValues] = useState({
    roots: 0,
    trunk: 0,
    branches: 0,
    leaves: 0,
    fruits: 0
  })

  const isAdmin = userRole && ['principal', 'teacher'].includes(userRole)

  // 加载当前意识树数据
  useEffect(() => {
    loadTreeData()
  }, [userId])

  const loadTreeData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('consciousness_tree_view')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data?.consciousness_tree_view) {
        const treeData = data.consciousness_tree_view as any
        setGrowthValues({
          roots: treeData?.roots?.growth_value ?? 0,
          trunk: treeData?.trunk?.growth_value ?? 0,
          branches: treeData?.branches?.growth_value ?? 0,
          leaves: treeData?.leaves?.growth_value ?? 0,
          fruits: treeData?.fruits?.growth_value ?? 0,
        })
      }
    } catch (err) {
      console.error('加载意识树数据失败:', err)
    }
  }

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
        await loadTreeData()
        setKey(prev => prev + 1) // 强制刷新树
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

  // 保存手动调整的成长值（管理员功能）
  const handleSave = async () => {
    if (!isAdmin) return

    try {
      setIsSaving(true)
      setMessage(null)

      const supabase = createClient()

      // 构建完整的意识树数据
      const treeView = {
        roots: { growth_value: growthValues.roots, is_solid: growthValues.roots >= 30 },
        trunk: { growth_value: growthValues.trunk, is_solid: growthValues.trunk >= 30 },
        branches: { growth_value: growthValues.branches, is_solid: growthValues.branches >= 30 },
        leaves: { growth_value: growthValues.leaves, is_solid: growthValues.leaves >= 30 },
        fruits: { growth_value: growthValues.fruits, is_solid: growthValues.fruits >= 40 },
        last_updated: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update({ consciousness_tree_view: treeView })
        .eq('id', userId)

      if (error) throw error

      setMessage({ type: 'success', text: '保存成功！' })
      setKey(prev => prev + 1) // 强制刷新树
    } catch (error) {
      console.error('保存失败:', error)
      setMessage({ type: 'error', text: '保存失败' })
    } finally {
      setIsSaving(false)
    }
  }

  // 滑块改变处理
  const handleSliderChange = (part: keyof typeof growthValues, value: number) => {
    setGrowthValues(prev => ({ ...prev, [part]: value }))
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
                <ConsciousnessTreeView key={key} userId={userId} />
              </div>
            </motion.div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
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
            </motion.div>

            {/* 控制滑块面板（仅管理员可见） */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30"
              >
                <h3 className="text-lg font-semibold mb-4 text-purple-400">
                  🔧 管理员控制面板
                </h3>

                <div className="space-y-4">
                  {/* AI评估按钮 */}
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/30 hover:bg-blue-600/40 disabled:bg-gray-600/30 rounded-lg border border-blue-500/50 transition-all"
                  >
                    <RefreshCw className={`w-5 h-5 ${isEvaluating ? 'animate-spin' : ''}`} />
                    {isEvaluating ? '评估中...' : '触发AI评估'}
                  </button>

                  {/* 成长值控制滑块 */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-gray-300">手动调整成长值</p>

                    {/* 根系滑块 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">根系 (Roots)</label>
                        <span className="text-sm font-mono text-red-400">{growthValues.roots}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={growthValues.roots}
                        onChange={(e) => handleSliderChange('roots', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-red"
                      />
                    </div>

                    {/* 树干滑块 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">树干 (Trunk)</label>
                        <span className="text-sm font-mono text-red-400">{growthValues.trunk}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={growthValues.trunk}
                        onChange={(e) => handleSliderChange('trunk', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-red"
                      />
                    </div>

                    {/* 枝干滑块 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">枝干 (Branches)</label>
                        <span className="text-sm font-mono text-red-400">{growthValues.branches}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={growthValues.branches}
                        onChange={(e) => handleSliderChange('branches', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-red"
                      />
                    </div>

                    {/* 树叶滑块 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">树叶 (Leaves)</label>
                        <span className="text-sm font-mono text-red-400">{growthValues.leaves}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={growthValues.leaves}
                        onChange={(e) => handleSliderChange('leaves', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-red"
                      />
                    </div>

                    {/* 果实滑块 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">果实 (Fruits)</label>
                        <span className="text-sm font-mono text-red-400">{growthValues.fruits}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={growthValues.fruits}
                        onChange={(e) => handleSliderChange('fruits', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-red"
                      />
                    </div>

                    {/* 保存按钮 */}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600/30 hover:bg-green-600/40 disabled:bg-gray-600/30 rounded-lg border border-green-500/50 transition-all mt-4"
                    >
                      <Save className={`w-5 h-5 ${isSaving ? 'animate-pulse' : ''}`} />
                      {isSaving ? '保存中...' : '保存更改'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <p className="text-xs text-gray-400">
                    ⚠️ 调整滑块后点击"保存更改"生效
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 自定义滑块样式 */}
      <style jsx global>{`
        .slider-red::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }

        .slider-red::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }

        .slider-red::-webkit-slider-track {
          background: linear-gradient(to right, #1f2937 0%, #ef4444 100%);
          height: 8px;
          border-radius: 4px;
        }

        .slider-red::-moz-range-track {
          background: linear-gradient(to right, #1f2937 0%, #ef4444 100%);
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
