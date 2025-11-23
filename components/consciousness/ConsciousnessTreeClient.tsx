'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ConsciousnessTreeCanvas } from './ConsciousnessTreeCanvas'
import { ConsciousnessTreeView } from './ConsciousnessTreeView'
import { TreeParams, TreeGrowthData } from '@/lib/utils/consciousnessTreeGenerator'
import { ArrowLeft, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// 默认生长数据（累积生长制 - 可手动调控）
const INITIAL_GROWTH_DATA: TreeGrowthData = {
  roots: { count: 12, depth_level: 3.5, is_solid: true },
  trunk: { thickness: 10, height_level: 5, is_solid: true },
  branches: { count: 10, avg_length: 0, is_solid: true },
  leaves: { count: 0, is_solid: false },
  fruits: { count: 0, is_solid: false },
}

interface ConsciousnessTreeClientProps {
  userId: string
  userRole: string | null
}

export function ConsciousnessTreeClient({ userId, userRole }: ConsciousnessTreeClientProps) {
  const router = useRouter()
  const [growthData, setGrowthData] = useState<TreeGrowthData>(INITIAL_GROWTH_DATA)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isPrincipal = userRole === 'principal'

  // 技术参数状态（简化版）
  const [techParams, setTechParams] = useState<TreeParams>({
    particleSize: 2,
    glowIntensity: 0.5,
  })

  // 缩放控制
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))

  // 刷新意识树数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const supabase = createClient()

      // 重新从数据库获取最新的意识树数据
      const { data, error } = await supabase
        .from('profiles')
        .select('consciousness_tree_view')
        .eq('id', userId)
        .single()

      if (error) throw error

      // 通过更新key强制ConsciousnessTreeView重新加载
      setRefreshKey(prev => prev + 1)

      setMessage({ type: 'success', text: '✅ 已刷新到最新状态' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('[刷新失败]', error)
      setMessage({ type: 'error', text: '❌ 刷新失败，请稍后重试' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsRefreshing(false)
    }
  }, [userId])

  // 更新生长数据的通用函数
  const updateGrowthData = (part: keyof TreeGrowthData, field: string, value: number | boolean) => {
    setGrowthData(prev => ({
      ...prev,
      [part]: {
        ...prev[part],
        [field]: value
      }
    }))
  }

  // 重置为初始值
  const resetToDefaults = () => {
    setGrowthData(INITIAL_GROWTH_DATA)
    setMessage({ type: 'success', text: '✅ 已重置为默认值' })
  }

  // 清空为种子状态
  const resetToSeed = () => {
    setGrowthData({
      roots: { count: 0, depth_level: 0, is_solid: false },
      trunk: { thickness: 0, height_level: 0, is_solid: false },
      branches: { count: 0, avg_length: 0, is_solid: false },
      leaves: { count: 0, is_solid: false },
      fruits: { count: 0, is_solid: false },
    })
    setMessage({ type: 'success', text: '🌱 已重置为种子状态' })
  }

  // 非校长用户：显示真实数据视图（带缩放功能）
  if (!isPrincipal) {
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

              <h1 className="text-2xl font-bold text-white">我的意识进化树</h1>

              {/* 刷新和缩放控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  title="刷新最新数据"
                >
                  <RefreshCw className={`w-5 h-5 text-green-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <div className="w-px h-6 bg-white/10"></div>
                <button
                  onClick={handleZoomOut}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="缩小"
                >
                  <ZoomOut className="w-5 h-5 text-red-300" />
                </button>
                <span className="text-sm text-gray-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="放大"
                >
                  <ZoomIn className="w-5 h-5 text-red-300" />
                </button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* 主内容：意识树视图 */}
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
          >
            <div
              className="relative h-[800px] w-full bg-black rounded-lg overflow-hidden"
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center'
                }}
              >
                <ConsciousnessTreeView key={refreshKey} userId={userId} isPreview={false} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // 校长用户：显示测试工作台
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

            <h1 className="text-2xl font-bold text-white">意识树测试工作台（累积生长制）</h1>

            {/* 缩放控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-5 h-5 text-red-300" />
              </button>
              <span className="text-sm text-gray-400 w-16 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                title="放大"
              >
                <ZoomIn className="w-5 h-5 text-red-300" />
              </button>
            </div>
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
              <div className="relative h-[800px] w-full bg-black rounded-lg overflow-auto">
                <ConsciousnessTreeCanvas
                  growthData={growthData}
                  techParams={techParams}
                  zoom={zoom}
                />
              </div>

              {/* 当前数据显示 */}
              <div className="mt-4 bg-black/60 rounded-lg p-4 grid grid-cols-5 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 mb-1">🌱 根</div>
                  <div className="text-white font-mono">count: {growthData.roots.count}</div>
                  <div className="text-white font-mono">depth: {growthData.roots.depth_level.toFixed(1)}</div>
                  <div className={growthData.roots.is_solid ? 'text-green-400' : 'text-red-400'}>
                    {growthData.roots.is_solid ? '✓ 实' : '○ 虚'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">🪵 干</div>
                  <div className="text-white font-mono">thick: {growthData.trunk.thickness}</div>
                  <div className="text-white font-mono">height: {growthData.trunk.height_level}</div>
                  <div className={growthData.trunk.is_solid ? 'text-green-400' : 'text-red-400'}>
                    {growthData.trunk.is_solid ? '✓ 实' : '○ 虚'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">🌿 枝</div>
                  <div className="text-white font-mono">count: {growthData.branches.count}</div>
                  <div className="text-white font-mono">length: {growthData.branches.avg_length.toFixed(1)}</div>
                  <div className={growthData.branches.is_solid ? 'text-green-400' : 'text-red-400'}>
                    {growthData.branches.is_solid ? '✓ 实' : '○ 虚'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">🍃 叶</div>
                  <div className="text-white font-mono">count: {growthData.leaves.count}</div>
                  <div className="h-4"></div>
                  <div className={growthData.leaves.is_solid ? 'text-green-400' : 'text-red-400'}>
                    {growthData.leaves.is_solid ? '✓ 实' : '○ 虚'}
                  </div>
                </div>

                <div>
                  <div className="text-gray-400 mb-1">🍎 果</div>
                  <div className="text-white font-mono">count: {growthData.fruits.count}</div>
                  <div className="h-4"></div>
                  <div className={growthData.fruits.is_solid ? 'text-green-400' : 'text-red-400'}>
                    {growthData.fruits.is_solid ? '✓ 实' : '○ 虚'}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6 max-h-[900px] overflow-y-auto pr-2">
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

            {/* 快捷操作 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-4 border border-purple-400/30"
            >
              <h3 className="text-sm font-semibold text-purple-400 mb-3">⚡ 快捷操作</h3>
              <div className="flex gap-2">
                <button
                  onClick={resetToDefaults}
                  className="flex-1 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/40 rounded-lg text-xs transition-all"
                >
                  恢复默认
                </button>
                <button
                  onClick={resetToSeed}
                  className="flex-1 px-3 py-2 bg-green-600/30 hover:bg-green-600/40 rounded-lg text-xs transition-all"
                >
                  🌱 种子状态
                </button>
              </div>
            </motion.div>

            {/* 🌱 根系控制 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-green-400">🌱 根系 (Roots)</h3>

              <div className="space-y-4">
                {/* count */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">领域数量 (count)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.roots.count}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="1"
                    value={growthData.roots.count}
                    onChange={(e) => updateGrowthData('roots', 'count', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">涉及的知识领域数量</p>
                </div>

                {/* depth_level */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">探索深度 (depth_level)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.roots.depth_level.toFixed(1)} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={growthData.roots.depth_level}
                    onChange={(e) => updateGrowthData('roots', 'depth_level', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">知识探索的深度</p>
                </div>

                {/* is_solid */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">虚实状态 (is_solid)</label>
                  <button
                    onClick={() => updateGrowthData('roots', 'is_solid', !growthData.roots.is_solid)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      growthData.roots.is_solid
                        ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                        : 'bg-red-600/30 text-red-400 border border-red-500/50'
                    }`}
                  >
                    {growthData.roots.is_solid ? '✓ 实心' : '○ 虚线'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 🪵 树干控制 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-yellow-500/10 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">🪵 树干 (Trunk)</h3>

              <div className="space-y-4">
                {/* thickness */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">觉察粗度 (thickness)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.trunk.thickness} / 50</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={growthData.trunk.thickness}
                    onChange={(e) => updateGrowthData('trunk', 'thickness', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">觉察力和定力</p>
                </div>

                {/* height_level */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">练习高度 (height_level)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.trunk.height_level} / 100</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={growthData.trunk.height_level}
                    onChange={(e) => updateGrowthData('trunk', 'height_level', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">坚持练习的时长</p>
                </div>

                {/* is_solid */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">虚实状态 (is_solid)</label>
                  <button
                    onClick={() => updateGrowthData('trunk', 'is_solid', !growthData.trunk.is_solid)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      growthData.trunk.is_solid
                        ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                        : 'bg-red-600/30 text-red-400 border border-red-500/50'
                    }`}
                  >
                    {growthData.trunk.is_solid ? '✓ 实心' : '○ 虚线'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 🌿 枝条控制 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-blue-400">🌿 枝条 (Branches)</h3>

              <div className="space-y-4">
                {/* count */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">里程碑数 (count)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.branches.count}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={growthData.branches.count}
                    onChange={(e) => updateGrowthData('branches', 'count', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">项目里程碑/深度探究次数</p>
                </div>

                {/* avg_length */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">洞见程度 (avg_length)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.branches.avg_length.toFixed(1)} / 20</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={growthData.branches.avg_length}
                    onChange={(e) => updateGrowthData('branches', 'avg_length', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">洞见的精辟程度</p>
                </div>

                {/* is_solid */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">虚实状态 (is_solid)</label>
                  <button
                    onClick={() => updateGrowthData('branches', 'is_solid', !growthData.branches.is_solid)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      growthData.branches.is_solid
                        ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                        : 'bg-red-600/30 text-red-400 border border-red-500/50'
                    }`}
                  >
                    {growthData.branches.is_solid ? '✓ 实心' : '○ 虚线'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 🍃 叶子控制 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-emerald-400">🍃 叶子 (Leaves)</h3>

              <div className="space-y-4">
                {/* count */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">顿悟数量 (count)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.leaves.count}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={growthData.leaves.count}
                    onChange={(e) => updateGrowthData('leaves', 'count', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">Aha Moments 总数</p>
                </div>

                {/* is_solid */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">虚实状态 (is_solid)</label>
                  <button
                    onClick={() => updateGrowthData('leaves', 'is_solid', !growthData.leaves.is_solid)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      growthData.leaves.is_solid
                        ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                        : 'bg-red-600/30 text-red-400 border border-red-500/50'
                    }`}
                  >
                    {growthData.leaves.is_solid ? '✓ 实心' : '○ 虚线'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 🍎 果实控制 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-red-400">🍎 果实 (Fruits)</h3>

              <div className="space-y-4">
                {/* count */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">完成项目数 (count)</label>
                    <span className="text-sm font-mono text-yellow-400">{growthData.fruits.count}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={growthData.fruits.count}
                    onChange={(e) => updateGrowthData('fruits', 'count', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">完成项目/贡献总数</p>
                </div>

                {/* is_solid */}
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">虚实状态 (is_solid)</label>
                  <button
                    onClick={() => updateGrowthData('fruits', 'is_solid', !growthData.fruits.is_solid)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      growthData.fruits.is_solid
                        ? 'bg-green-600/30 text-green-400 border border-green-500/50'
                        : 'bg-red-600/30 text-red-400 border border-red-500/50'
                    }`}
                  >
                    {growthData.fruits.is_solid ? '✓ 实心' : '○ 虚线'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* 🎨 技术参数 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-purple-400">🎨 技术参数</h3>

              <div className="space-y-4">
                {/* particleSize */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">粒子大小 (particleSize)</label>
                    <span className="text-sm font-mono text-yellow-400">{techParams.particleSize.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={techParams.particleSize}
                    onChange={(e) => setTechParams({...techParams, particleSize: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* glowIntensity */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-300">发光强度 (glowIntensity)</label>
                    <span className="text-sm font-mono text-yellow-400">{techParams.glowIntensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={techParams.glowIntensity}
                    onChange={(e) => setTechParams({...techParams, glowIntensity: parseFloat(e.target.value)})}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>

            {/* 说明卡片 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-red-600/10 to-orange-600/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/30"
            >
              <h3 className="text-lg font-semibold mb-4 text-red-400">📖 累积生长制说明</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p><strong className="text-white">数据驱动：</strong>根/干/枝/叶/果完全独立控制</p>
                <p><strong className="text-white">虚实线：</strong>实心=连续光带，虚线=稀疏点阵</p>
                <p><strong className="text-white">种子状态：</strong>所有参数为0时显示种子</p>
                <p><strong className="text-white">实时生效：</strong>调整滑块立即重新渲染</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
