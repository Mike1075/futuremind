'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsciousnessTreeCanvas } from './ConsciousnessTreeCanvas'
import { TreeParams } from '@/lib/utils/consciousnessTreeGenerator'
import { ArrowLeft, Sparkles } from 'lucide-react'

// 技术参数类型（与TreeParams一致）
export interface TreeTechParams extends TreeParams {}

// 默认生长数据（测试模式使用固定值）
const DEFAULT_GROWTH_DATA = {
  roots: { growth_value: 50, is_solid: true },
  trunk: { growth_value: 10, is_solid: true },  // 从20改为10，更深的暗红色
  branches: { growth_value: 70, is_solid: true },
  leaves: { growth_value: 80, is_solid: true },
  fruits: { growth_value: 40, is_solid: false },
}

interface ConsciousnessTreeClientProps {
  userId: string
  userRole: string | null
}

export function ConsciousnessTreeClient({ userId, userRole }: ConsciousnessTreeClientProps) {
  const router = useRouter()
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

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
    glowIntensity: 0.4,  // 从0.5降到0.4，减少发光避免变白
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
        setMessage({ type: 'success', text: '✅ 真实计算完成！查看下方AI分析详情' })
        setAnalysisData(data.analysis)
        setShowAnalysis(true)
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

  // 技术参数改变处理（对标参考网站的简单方式）
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
          {/* 左侧：意识树可视化 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="relative h-[800px] w-full bg-black rounded-lg">
                <ConsciousnessTreeCanvas
                  growthData={DEFAULT_GROWTH_DATA}
                  techParams={techParams}
                />
              </div>
            </motion.div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
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

            {/* 参数说明卡片 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">📖 参数说明</h3>
              <div className="space-y-4 text-xs text-gray-300">
                <div>
                  <strong className="text-white">递归深度 (Depth)</strong>
                  <p className="mt-1">控制树的分支层级。值越大，分支越多越密集。</p>
                  <p className="text-gray-500">• 1-5: 稀疏的树 | 10: 自然树 | 14: 超密集</p>
                </div>

                <div>
                  <strong className="text-white">分支角度 (Branch Angle)</strong>
                  <p className="mt-1">控制左右分支的夹角。</p>
                  <p className="text-gray-500">• 0°: 垂直生长 | 25°: 自然平衡 | 90°: 水平展开</p>
                </div>

                <div>
                  <strong className="text-white">长度衰减 (Length Decay)</strong>
                  <p className="mt-1">子分支相对父分支的长度比例。</p>
                  <p className="text-gray-500">• 0.5: 快速收缩 | 0.75: 均衡 | 0.9: 延伸型</p>
                </div>

                <div>
                  <strong className="text-white">主干长度 (Trunk Length)</strong>
                  <p className="mt-1">主干的初始长度，影响整体树的尺寸。</p>
                  <p className="text-gray-500">• 50: 矮树 | 120: 标准 | 200: 高大树</p>
                </div>

                <div>
                  <strong className="text-white">主干宽度 (Trunk Width)</strong>
                  <p className="mt-1">主干的粗细程度。</p>
                  <p className="text-gray-500">• 1-10: 细树 | 12: 标准 | 30: 粗壮古树</p>
                </div>

                <div>
                  <strong className="text-white">根深度 (Root Depth)</strong>
                  <p className="mt-1">根系的递归层级，控制根的分叉层数。</p>
                  <p className="text-gray-500">• 0: 无根 | 6: 适中 | 10: 深层根系</p>
                </div>

                <div>
                  <strong className="text-white">根展开角度 (Root Spread)</strong>
                  <p className="mt-1">根系分叉的角度范围。</p>
                  <p className="text-gray-500">• 0°: 垂直向下 | 30°: 自然 | 90°: 横向扩散</p>
                </div>

                <div>
                  <strong className="text-white">粒子大小 (Particle Size)</strong>
                  <p className="mt-1">组成树的每个粒子的基础半径。</p>
                  <p className="text-gray-500">• 0.5: 精细 | 2: 标准 | 5: 粗糙</p>
                </div>

                <div>
                  <strong className="text-white">发光强度 (Glow Intensity)</strong>
                  <p className="mt-1">控制粒子的透明度和发光效果。</p>
                  <p className="text-gray-500">• 0: 完全透明 | 0.5: 半透明 | 1: 不透明</p>
                </div>

                <div>
                  <strong className="text-white">叶子密度 (Leaf Density)</strong>
                  <p className="mt-1">在外层分支生成叶子的概率。</p>
                  <p className="text-gray-500">• 0: 无叶子 | 0.5: 适中 | 1: 浓密</p>
                </div>

                <div>
                  <strong className="text-white">果实概率 (Fruit Probability)</strong>
                  <p className="mt-1">在最外层分支生成果实的概率。</p>
                  <p className="text-gray-500">• 0: 无果实 | 0.05: 稀疏 | 0.5: 硕果累累</p>
                </div>
              </div>
            </motion.div>

            {/* 意识树含义卡片 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-600/10 to-orange-600/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-red-400">🌳 意识树象征</h3>
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

                  {/* AI分析结果展示 */}
                  {analysisData && showAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-black/40 rounded-lg p-4 border border-green-500/30"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-green-400">📊 AI分析详情</h4>
                        <button
                          onClick={() => setShowAnalysis(false)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          ✕ 关闭
                        </button>
                      </div>

                      {/* 数据来源 */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-blue-300 mb-2">📈 数据来源</p>
                        <div className="bg-black/30 rounded p-3 text-xs space-y-1 text-gray-300">
                          <div>在线时长: {analysisData.dataSource.behaviorStats.totalOnlineMinutes} 分钟</div>
                          <div>登录次数: {analysisData.dataSource.behaviorStats.totalLogins} 次</div>
                          <div>对话轮次: {analysisData.dataSource.behaviorStats.totalConversationTurns} 轮</div>
                          <div>作业提交: {analysisData.dataSource.behaviorStats.totalSubmissions} 份（冥想 {analysisData.dataSource.behaviorStats.meditationCount} 份）</div>
                          <div>平均分数: {analysisData.dataSource.behaviorStats.avgScore} 分</div>
                          <div>活跃项目: {analysisData.dataSource.projectStats.activeProjects} 个</div>
                          <div>完成项目: {analysisData.dataSource.projectStats.completedProjects} 个</div>
                        </div>
                      </div>

                      {/* AI整体评估 */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-yellow-300 mb-2">🤖 AI整体评估</p>
                        <div className="bg-black/30 rounded p-3 text-xs text-gray-300">
                          {analysisData.aiEvaluation.overall_summary}
                        </div>
                      </div>

                      {/* 各部位详细评估 */}
                      <div>
                        <p className="text-xs font-semibold text-purple-300 mb-2">🌳 各部位详细评估</p>
                        <div className="space-y-3">
                          {analysisData.aiEvaluation.parts.map((part: any, index: number) => (
                            <div key={index} className="bg-black/30 rounded p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h5 className="text-xs font-semibold text-white">{part.name}</h5>
                                  <p className="text-[10px] text-gray-500">{part.description}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-yellow-400">{part.growth_value}</div>
                                  <div className={`text-[10px] ${part.is_solid ? 'text-green-400' : 'text-red-400'}`}>
                                    {part.is_solid ? '✓ 稳固' : '✗ 虚浮'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-400 mb-1">
                                <strong className="text-blue-300">AI评分理由:</strong> {part.ai_reasoning}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                <strong className="text-orange-300">虚实判断:</strong> {part.solidity_reasoning}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

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
        /* 黄色滑块样式 */
        .slider-yellow {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(to right, #1f2937 0%, #facc15 100%);
          outline: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .slider-yellow:hover {
          opacity: 0.9;
        }

        .slider-yellow::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #facc15;
          cursor: grab;
          box-shadow: 0 0 12px rgba(250, 204, 21, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3);
          border: 2px solid #fff;
          transition: all 0.2s;
        }

        .slider-yellow::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 16px rgba(250, 204, 21, 0.8), 0 4px 8px rgba(0, 0, 0, 0.4);
        }

        .slider-yellow::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.05);
        }

        .slider-yellow::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #facc15;
          cursor: grab;
          border: 2px solid #fff;
          box-shadow: 0 0 12px rgba(250, 204, 21, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .slider-yellow::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 16px rgba(250, 204, 21, 0.8), 0 4px 8px rgba(0, 0, 0, 0.4);
        }

        .slider-yellow::-moz-range-thumb:active {
          cursor: grabbing;
          transform: scale(1.05);
        }

        .slider-yellow::-webkit-slider-track {
          background: linear-gradient(to right, #1f2937 0%, #facc15 100%);
          height: 12px;
          border-radius: 6px;
        }

        .slider-yellow::-moz-range-track {
          background: linear-gradient(to right, #1f2937 0%, #facc15 100%);
          height: 12px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  )
}
