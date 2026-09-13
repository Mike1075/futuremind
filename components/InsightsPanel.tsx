// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Leaf, AlertCircle } from 'lucide-react'

interface Insight {
  id: string
  content: string
  insight_type: string
  depth_score: number
  originality_score: number
  color: string
  created_at: string
  ai_reasoning?: string
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/insights/extract?limit=20')
      const data = await response.json()

      if (data.success) {
        setInsights(data.insights || [])
      } else {
        setError(data.error || '获取失败')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      breakthrough: '突破',
      integration: '整合',
      reflection: '反思',
      awareness: '觉察',
      general: '一般',
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakthrough: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      integration: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      reflection: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      awareness: 'bg-green-500/20 text-green-300 border-green-500/30',
      general: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    }
    return colors[type] || colors.general
  }

  if (loading) {
    return (
      <div className="fixed right-8 top-24 w-96 bg-black/90 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed right-8 top-24 w-96 bg-black/90 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-semibold text-white">洞见叶子</h2>
        <span className="ml-auto text-sm text-gray-400">{insights.length}</span>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {insights.length === 0 ? (
        <div className="text-center py-8">
          <Leaf className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">还没有洞见叶子</p>
          <p className="text-gray-500 text-xs mt-2">
            访问管理面板提取洞见
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
            >
              {/* 类型和评分 */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded border ${getTypeColor(insight.insight_type)}`}>
                  {getTypeLabel(insight.insight_type)}
                </span>
                <div className="flex gap-2 text-xs">
                  <span className="text-gray-400">
                    深度: <strong className="text-yellow-300">{insight.depth_score}</strong>
                  </span>
                  <span className="text-gray-400">
                    原创: <strong className="text-purple-300">{insight.originality_score}</strong>
                  </span>
                </div>
              </div>

              {/* 洞见内容 */}
              <p className="text-sm text-gray-200 leading-relaxed mb-2">
                {insight.content}
              </p>

              {/* AI reasoning */}
              {insight.ai_reasoning && (
                <p className="text-xs text-gray-400 italic">
                  💡 {insight.ai_reasoning}
                </p>
              )}

              {/* 时间 */}
              <p className="text-xs text-gray-500 mt-2">
                {new Date(insight.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 提示 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          这些洞见来自您与Gaia的深度对话
        </p>
      </div>
    </div>
  )
}
