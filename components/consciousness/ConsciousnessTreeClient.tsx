'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsciousnessTreeView, TreeTechParams } from './ConsciousnessTreeView'
import { ArrowLeft, Sparkles } from 'lucide-react'

interface ConsciousnessTreeClientProps {
  userId: string
  userRole: string | null
}

export function ConsciousnessTreeClient({ userId, userRole }: ConsciousnessTreeClientProps) {
  const router = useRouter()
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const isAdmin = userRole && ['principal', 'teacher'].includes(userRole)

  // 技术参数状态（实时调整，测试模式）
  const [techParams, setTechParams] = useState<TreeTechParams>({
    depth: 10,
    branchAngle: 25,
    lengthDecay: 0.75,
    trunkLength: 120,
    trunkWidth: 12,
    rootDepth: 6,
    rootSpread: 30,
    particleSize: 2,
    glowIntensity: 0.5,
    leafDensity: 0.5,
    fruitProbability: 0.05,
  })

  // 手动触发AI真实计算
  const handleRealCalculation = async () => {
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
        setMessage({ type: 'success', text: '✅ 真实计算完成！请刷新页面查看真实数据' })
      } else {
        setMessage({ type: 'error', text: data.error || '计算失败' })
      }
    } catch (error) {
      console.error('真实计算失败:', error)
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setIsEvaluating(false)
    }
  }

  // 技术参数改变处理（实时更新）
  const handleTechParamChange = (param: keyof TreeTechParams, value: number) => {
    setTechParams(prev => ({ ...prev, [param]: value }))
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
          {/* 左侧：意识树可视化（增加高度，添加滚动） */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="relative h-[1200px] w-full bg-black rounded-lg overflow-auto">
                <div className="h-[2000px] w-full">
                  <ConsciousnessTreeView userId={userId} techParams={techParams} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6 max-h-[1200px] overflow-y-auto pr-2">
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

            {/* 测试模式提示 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/30"
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🧪</span>
                <h3 className="text-sm font-semibold text-blue-400">测试模式</h3>
              </div>
              <p className="text-xs text-gray-400">
                当前为测试环境，调整参数实时生效。点击下方"真实计算"按钮才会调用AI计算真实数据。
              </p>
            </motion.div>

            {/* 说明卡片 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold mb-4 text-red-400">意识树说明</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div><strong className="text-white">根系：</strong>知识获取、深度理解</div>
                <div><strong className="text-white">树干：</strong>内在稳态、坚持</div>
                <div><strong className="text-white">枝干：</strong>探索广度</div>
                <div><strong className="text-white">树叶：</strong>洞见产出</div>
                <div><strong className="text-white">果实：</strong>创造产出</div>
              </div>
            </motion.div>

            {/* 管理员功能 */}
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

                <div className="space-y-6">
                  {/* AI真实计算按钮 */}
                  <button
                    onClick={handleRealCalculation}
                    disabled={isEvaluating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 disabled:bg-gray-600/30 rounded-lg border border-purple-500/50 transition-all"
                  >
                    <Sparkles className={`w-5 h-5 ${isEvaluating ? 'animate-spin' : ''}`} />
                    {isEvaluating ? '计算中...' : '✨ 真实计算（调用AI）'}
                  </button>

                  {/* 技术参数控制（实时更新） */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <p className="text-sm font-semibold text-yellow-300">⚡ 技术参数（实时调整）</p>

                    {/* 递归深度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">递归深度 (Depth)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.depth}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="14"
                        step="1"
                        value={techParams.depth}
                        onChange={(e) => handleTechParamChange('depth', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 分支角度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">分支角度 (Branch Angle)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.branchAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={techParams.branchAngle}
                        onChange={(e) => handleTechParamChange('branchAngle', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 长度衰减 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">长度衰减 (Length Decay)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.lengthDecay.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="0.9"
                        step="0.01"
                        value={techParams.lengthDecay}
                        onChange={(e) => handleTechParamChange('lengthDecay', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 主干长度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">主干长度 (Trunk Length)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.trunkLength}</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        step="1"
                        value={techParams.trunkLength}
                        onChange={(e) => handleTechParamChange('trunkLength', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 主干宽度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">主干宽度 (Trunk Width)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.trunkWidth}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={techParams.trunkWidth}
                        onChange={(e) => handleTechParamChange('trunkWidth', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 根深度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">根深度 (Root Depth)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.rootDepth}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="1"
                        value={techParams.rootDepth}
                        onChange={(e) => handleTechParamChange('rootDepth', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 根展开角度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">根展开角度 (Root Spread)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.rootSpread}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="1"
                        value={techParams.rootSpread}
                        onChange={(e) => handleTechParamChange('rootSpread', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 粒子大小 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">粒子大小 (Particle Size)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.particleSize.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={techParams.particleSize}
                        onChange={(e) => handleTechParamChange('particleSize', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 发光强度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">发光强度 (Glow Intensity)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.glowIntensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={techParams.glowIntensity}
                        onChange={(e) => handleTechParamChange('glowIntensity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 叶子密度 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">叶子密度 (Leaf Density)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.leafDensity.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={techParams.leafDensity}
                        onChange={(e) => handleTechParamChange('leafDensity', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>

                    {/* 果实概率 */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm text-gray-400">果实概率 (Fruit Probability)</label>
                        <span className="text-sm font-mono text-yellow-400">{techParams.fruitProbability.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={techParams.fruitProbability}
                        onChange={(e) => handleTechParamChange('fruitProbability', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <p className="text-xs text-gray-400">
                    ⚡ 技术参数实时生效，无延迟
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    ✨ 点击"真实计算"才会调用AI计算真实数据
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 自定义滑块样式 */}
      <style jsx global>{`
        .slider-yellow::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #facc15;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
        }

        .slider-yellow::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #facc15;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(250, 204, 21, 0.5);
        }

        .slider-yellow::-webkit-slider-track {
          background: linear-gradient(to right, #1f2937 0%, #facc15 100%);
          height: 8px;
          border-radius: 4px;
        }

        .slider-yellow::-moz-range-track {
          background: linear-gradient(to right, #1f2937 0%, #facc15 100%);
          height: 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
