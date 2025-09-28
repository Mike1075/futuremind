'use client'

import { useState, useEffect } from 'react'
import consciousnessTreeAPI, { DomainScores, ConsciousnessTreeView, EvaluationResult } from '@/lib/api/consciousness-tree'

export default function TestConsciousnessTreePage() {
  const [treeView, setTreeView] = useState<ConsciousnessTreeView | null>(null)
  const [domainScores, setDomainScores] = useState<DomainScores | null>(null)
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载数据
  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 获取意识树视图
      const treeResult = await consciousnessTreeAPI.getConsciousnessTreeView()
      if (treeResult.success) {
        setTreeView(treeResult.data!)
      } else {
        console.error('获取意识树视图失败:', treeResult.error)
      }

      // 获取领域探索记录
      const domainResult = await consciousnessTreeAPI.getDomainExploration()
      if (domainResult.success) {
        setDomainScores(domainResult.data!.domain_scores)
      } else {
        console.error('获取领域探索记录失败:', domainResult.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 触发AI评估
  const triggerEvaluation = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await consciousnessTreeAPI.evaluateAndGrowTree()
      if (result.success) {
        setEvaluationResult(result.data!)
        // 重新加载数据以显示更新后的结果
        await loadData()
      } else {
        setError(result.error || '评估失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '评估失败')
    } finally {
      setLoading(false)
    }
  }

  // 手动更新测试
  const testManualUpdate = async () => {
    setLoading(true)
    setError(null)

    try {
      const testGrowth = {
        self_awareness_growth: 5,
        life_sciences_growth: 3,
        universal_laws_growth: 4,
        creative_expression_growth: 6,
        social_connection_growth: 2
      }

      const result = await consciousnessTreeAPI.manualUpdateTree(testGrowth)
      if (result.success) {
        alert('手动更新成功！')
        await loadData()
      } else {
        setError(result.error || '手动更新失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '手动更新失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatScore = (score: number) => score.toFixed(1)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">意识树系统测试</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>错误: </strong>{error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 控制面板 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">控制面板</h2>

          <button
            onClick={loadData}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? '加载中...' : '刷新数据'}
          </button>

          <button
            onClick={triggerEvaluation}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? '评估中...' : '触发AI评估'}
          </button>

          <button
            onClick={testManualUpdate}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
          >
            {loading ? '更新中...' : '测试手动更新'}
          </button>
        </div>

        {/* 当前状态 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">当前状态</h2>

          {domainScores && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">领域分数</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>自我觉察:</span>
                  <span className="font-mono">{formatScore(domainScores.self_awareness.depth_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span>生命科学:</span>
                  <span className="font-mono">{formatScore(domainScores.life_sciences.depth_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span>宇宙法则:</span>
                  <span className="font-mono">{formatScore(domainScores.universal_laws.depth_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span>创造表达:</span>
                  <span className="font-mono">{formatScore(domainScores.creative_expression.depth_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span>社会联结:</span>
                  <span className="font-mono">{formatScore(domainScores.social_connection.depth_score)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 意识树视图 */}
      {treeView && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">意识树视图</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 根部 */}
              <div>
                <h3 className="font-medium mb-3">根部系统</h3>
                <div className="space-y-2 text-sm">
                  {treeView.roots.main_roots.map((root, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="capitalize">{root.domain.replace('_', ' ')}:</span>
                      <span className="font-mono">{formatScore(root.length)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 树干 */}
              <div>
                <h3 className="font-medium mb-3">树干</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>厚度:</span>
                    <span className="font-mono">{formatScore(treeView.trunk.thickness)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>稳定性:</span>
                    <span className="font-mono">{formatScore(treeView.trunk.stability)}</span>
                  </div>
                </div>
              </div>

              {/* 枝叶 */}
              <div>
                <h3 className="font-medium mb-3">枝叶</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>叶子总数:</span>
                    <span className="font-mono">{treeView.branches_and_leaves.total_leaves}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>果实:</span>
                    <span className="font-mono">{treeView.fruits.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {treeView.last_updated && (
              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                最后更新: {new Date(treeView.last_updated).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 评估结果 */}
      {evaluationResult && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">最新评估结果</h2>
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">成长增量</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>自我觉察:</span>
                    <span className="font-mono">+{evaluationResult.evaluation.growth_scores.self_awareness_growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>生命科学:</span>
                    <span className="font-mono">+{evaluationResult.evaluation.growth_scores.life_sciences_growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>宇宙法则:</span>
                    <span className="font-mono">+{evaluationResult.evaluation.growth_scores.universal_laws_growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>创造表达:</span>
                    <span className="font-mono">+{evaluationResult.evaluation.growth_scores.creative_expression_growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>社会联结:</span>
                    <span className="font-mono">+{evaluationResult.evaluation.growth_scores.social_connection_growth}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">评估信息</h3>
                <div className="space-y-2 text-sm">
                  <div>分析消息数: {evaluationResult.evaluation.messages_analyzed}</div>
                  <div>评估时间: {new Date(evaluationResult.timestamp).toLocaleString('zh-CN')}</div>
                </div>
              </div>
            </div>

            {evaluationResult.evaluation.ai_reasoning && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium mb-2">AI评估理由</h3>
                <p className="text-sm text-gray-700">{evaluationResult.evaluation.ai_reasoning}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}