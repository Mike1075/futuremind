'use client'

import { useState, useMemo } from 'react'
import { SimpleTreeRenderer } from '@/components/ui/simple-tree-renderer'
import { LottieTreeRenderer } from '@/components/ui/lottie-tree-renderer'
import { DynamicConsciousnessTree } from '@/components/ui/dynamic-consciousness-tree'
import { DynamicConsciousnessTreeV2 } from '@/components/ui/dynamic-consciousness-tree-v2'
import { DynamicConsciousnessTreeV3 } from '@/components/ui/dynamic-consciousness-tree-v3'
import { getTreeStage, getTreeStageName, getTreeStageDescription } from '@/lib/consciousness/tree-stage-config'
import { TreePine, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TreePreviewPage() {
  // Mock 数据状态
  const [mockLevel, setMockLevel] = useState(1)
  const [mockProgress, setMockProgress] = useState(0)
  const [mockDomains, setMockDomains] = useState({
    self_awareness: 0,
    life_sciences: 0,
    universal_laws: 0,
    creative_expression: 0,
    social_connection: 0
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [showComparison, setShowComparison] = useState(false)

  // 计算当前阶段
  const currentStage = useMemo(() => getTreeStage(mockProgress), [mockProgress])
  const stageName = useMemo(() => getTreeStageName(currentStage), [currentStage])
  const stageDescription = useMemo(() => getTreeStageDescription(currentStage), [currentStage])

  // 快速预设
  const presets = [
    {
      name: '种子期',
      stage: 'seed',
      progress: 10,
      domains: { self_awareness: 3, life_sciences: 0, universal_laws: 0, creative_expression: 0, social_connection: 0 },
      icon: '🌰',
      isHealthy: true
    },
    {
      name: '发芽期',
      stage: 'sprout',
      progress: 30,
      domains: { self_awareness: 5, life_sciences: 3, universal_laws: 0, creative_expression: 0, social_connection: 0 },
      icon: '🌱',
      isHealthy: true
    },
    {
      name: '幼苗期',
      stage: 'seedling',
      progress: 50,
      domains: { self_awareness: 8, life_sciences: 6, universal_laws: 4, creative_expression: 2, social_connection: 0 },
      icon: '🌿',
      isHealthy: true
    },
    {
      name: '小树期',
      stage: 'young',
      progress: 70,
      domains: { self_awareness: 12, life_sciences: 10, universal_laws: 8, creative_expression: 6, social_connection: 4 },
      icon: '🌳',
      isHealthy: true
    },
    {
      name: '大树期-健康',
      stage: 'mature',
      progress: 90,
      domains: { self_awareness: 20, life_sciences: 18, universal_laws: 15, creative_expression: 12, social_connection: 10 },
      icon: '🌲',
      isHealthy: true
    },
    // 畸形情况测试
    {
      name: '⚠️ 只做项目',
      stage: 'mature',
      progress: 70,
      domains: { self_awareness: 2, life_sciences: 0, universal_laws: 0, creative_expression: 0, social_connection: 35 },
      icon: '🥀',
      isHealthy: false
    },
    {
      name: '⚠️ 空有进度',
      stage: 'mature',
      progress: 80,
      domains: { self_awareness: 0, life_sciences: 0, universal_laws: 0, creative_expression: 0, social_connection: 0 },
      icon: '🌰',
      isHealthy: false
    },
    {
      name: '⚠️ 发展失衡',
      stage: 'mature',
      progress: 65,
      domains: { self_awareness: 25, life_sciences: 2, universal_laws: 1, creative_expression: 0, social_connection: 1 },
      icon: '🥀',
      isHealthy: false
    }
  ]

  const applyPreset = (preset: typeof presets[0]) => {
    setMockProgress(preset.progress)
    setMockDomains(preset.domains)
    setRefreshKey(prev => prev + 1) // 触发树重新渲染
  }

  const resetAll = () => {
    setMockLevel(1)
    setMockProgress(0)
    setMockDomains({
      self_awareness: 0,
      life_sciences: 0,
      universal_laws: 0,
      creative_expression: 0,
      social_connection: 0
    })
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Control Panel */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TreePine className="w-6 h-6 text-green-400" />
              <h1 className="text-xl font-bold text-white">树形态预览</h1>
            </div>
            <button
              onClick={resetAll}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              title="重置所有"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Current Stage Display */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">当前阶段</span>
              <span className="text-2xl">{presets.find(p => p.stage === currentStage)?.icon || '🌱'}</span>
            </div>
            <div className="text-lg font-semibold text-white mb-1">{stageName}</div>
            <div className="text-sm text-gray-400">{stageDescription}</div>
          </div>

          {/* Level Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              意识等级 (Level {mockLevel})
            </label>
            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map(level => (
                <button
                  key={level}
                  onClick={() => setMockLevel(level)}
                  className={`py-2 rounded-md text-sm font-medium transition-all ${
                    mockLevel === level
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              等级进度: {mockProgress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={mockProgress}
              onChange={(e) => {
                setMockProgress(Number(e.target.value))
                setRefreshKey(prev => prev + 1)
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
              <span>60%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              快速预设
            </label>
            <div className="space-y-2">
              {presets.map((preset, index) => (
                <button
                  key={`preset-${index}`}
                  onClick={() => applyPreset(preset)}
                  className={`w-full py-2 px-3 rounded-lg text-left transition-all flex items-center space-x-2 ${
                    preset.isHealthy
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-red-900/20 border border-red-500/50 text-red-300'
                  }`}
                >
                  <span className="text-xl">{preset.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.progress}% 进度</div>
                  </div>
                  {!preset.isHealthy && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Domain Depth Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              五大领域深度
            </label>
            <div className="space-y-3">
              {[
                { key: 'self_awareness', label: '🧘 自我觉察', color: 'purple' },
                { key: 'life_sciences', label: '🧬 生命科学', color: 'green' },
                { key: 'universal_laws', label: '🌌 宇宙法则', color: 'yellow' },
                { key: 'creative_expression', label: '🎨 创意表达', color: 'pink' },
                { key: 'social_connection', label: '🤝 社会连接', color: 'blue' }
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{label}</span>
                    <span>{mockDomains[key as keyof typeof mockDomains]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={mockDomains[key as keyof typeof mockDomains]}
                    onChange={(e) => {
                      setMockDomains(prev => ({
                        ...prev,
                        [key]: Number(e.target.value)
                      }))
                      setRefreshKey(prev => prev + 1)
                    }}
                    className={`w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${color}-600`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">预览模式</span>
            </div>
            <p className="text-xs text-gray-400">
              调整参数后树会自动重新生成。拖动滑块或点击预设按钮即可查看不同阶段的树形态。
            </p>
          </div>
        </div>
      </div>

      {/* Right Preview Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Dynamic 算法树预览</h2>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                {showComparison ? '隐藏对比' : '显示旧版本对比'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Preview */}
        <div className="flex-1 relative">
          {!showComparison ? (
            // 只显示 Dynamic V3 版本
            <div className="absolute inset-0 bg-black">
              <DynamicConsciousnessTreeV3
                key={refreshKey}
                levelProgress={mockProgress}
                consciousnessLevel={mockLevel}
                domainDepths={mockDomains}
                className="w-full h-full"
              />
            </div>
          ) : (
            // 显示三版本对比
            <div className="absolute inset-0 grid grid-cols-3">
              {/* Canvas Version */}
              <div className="relative border-r border-gray-800">
                <div className="absolute inset-0 bg-black">
                  <SimpleTreeRenderer
                    key={refreshKey}
                    levelProgress={mockProgress}
                    consciousnessLevel={mockLevel}
                    domainDepths={mockDomains}
                  />
                </div>
                <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                  Canvas（旧）
                </div>
              </div>

              {/* Lottie Version */}
              <div className="relative border-r border-gray-800">
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <LottieTreeRenderer
                    key={refreshKey}
                    levelProgress={mockProgress}
                    consciousnessLevel={mockLevel}
                    domainDepths={mockDomains}
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Lottie
                </div>
              </div>

              {/* Dynamic V3 Version */}
              <div className="relative">
                <div className="absolute inset-0 bg-black">
                  <DynamicConsciousnessTreeV3
                    key={refreshKey}
                    levelProgress={mockProgress}
                    consciousnessLevel={mockLevel}
                    domainDepths={mockDomains}
                    className="w-full h-full"
                  />
                </div>
                <div className="absolute top-4 left-4 bg-green-600/90 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Dynamic V3
                </div>
              </div>
            </div>
          )}

          {/* Floating Info Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg p-4"
          >
            <div className="text-xs text-gray-400 mb-1">实时预览</div>
            <div className="text-lg font-bold text-white mb-2">{stageName}</div>
            <div className="text-sm text-gray-300 mb-2">
              Level {mockLevel} · {mockProgress}% 进度
            </div>
            <div className="text-xs text-gray-400">
              总深度: {Object.values(mockDomains).reduce((a, b) => a + b, 0)}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
