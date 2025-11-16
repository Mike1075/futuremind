'use client'

import { useState, useMemo } from 'react'
import { DatabaseConsciousnessRoots } from '@/components/ui/database-consciousness-roots'
import { getTreeStage, getTreeStageName, getTreeStageDescription } from '@/lib/consciousness/tree-stage-config'
import { TreePine, Sparkles, RefreshCw } from 'lucide-react'
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
      icon: '🌰'
    },
    {
      name: '发芽期',
      stage: 'sprout',
      progress: 30,
      domains: { self_awareness: 5, life_sciences: 3, universal_laws: 0, creative_expression: 0, social_connection: 0 },
      icon: '🌱'
    },
    {
      name: '幼苗期',
      stage: 'seedling',
      progress: 50,
      domains: { self_awareness: 8, life_sciences: 6, universal_laws: 4, creative_expression: 2, social_connection: 0 },
      icon: '🌿'
    },
    {
      name: '小树期',
      stage: 'young',
      progress: 70,
      domains: { self_awareness: 12, life_sciences: 10, universal_laws: 8, creative_expression: 6, social_connection: 4 },
      icon: '🌳'
    },
    {
      name: '大树期',
      stage: 'mature',
      progress: 90,
      domains: { self_awareness: 20, life_sciences: 18, universal_laws: 15, creative_expression: 12, social_connection: 10 },
      icon: '🌲'
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
              {presets.map((preset) => (
                <button
                  key={preset.stage}
                  onClick={() => applyPreset(preset)}
                  className={`w-full py-2 px-3 rounded-lg text-left transition-all flex items-center space-x-2 ${
                    currentStage === preset.stage
                      ? 'bg-green-600/20 border border-green-500/50 text-green-300'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{preset.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.progress}% 进度</div>
                  </div>
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
      <div className="flex-1 relative">
        {/* Tree Preview */}
        <div className="absolute inset-0">
          <DatabaseConsciousnessRoots
            key={refreshKey}
            mockMode={true}
            mockLevel={mockLevel}
            mockProgress={mockProgress}
            mockDomains={mockDomains}
          />
        </div>

        {/* Floating Info Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg p-4 min-w-64"
        >
          <div className="text-xs text-gray-400 mb-1">实时预览</div>
          <div className="text-lg font-bold text-white">{stageName}</div>
          <div className="text-sm text-gray-300 mt-1">Level {mockLevel} · {mockProgress}% 进度</div>
          <div className="grid grid-cols-5 gap-1 mt-3">
            {Object.entries(mockDomains).map(([key, value]) => (
              <div
                key={key}
                className="bg-gray-800 rounded px-1 py-0.5 text-center"
                title={key}
              >
                <div className="text-xs text-gray-500">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
