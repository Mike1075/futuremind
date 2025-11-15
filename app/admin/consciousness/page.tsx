'use client'

import { useState } from 'react'
import { Brain, RefreshCw, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function ConsciousnessAdminPage() {
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculateRoots = async () => {
    setCalculating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/consciousness/calculate-roots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '计算失败')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Brain className="w-10 h-10 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold">意识树管理面板</h1>
            <p className="text-gray-400 mt-1">管理和计算用户的意识树数据</p>
          </div>
        </div>

        {/* Calculate Roots Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            计算根系深度
          </h2>
          <p className="text-gray-300 mb-6">
            根据您的课程完成进度，重新计算意识树的五大领域根系深度。
          </p>

          <button
            onClick={handleCalculateRoots}
            disabled={calculating}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {calculating ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                开始计算
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200">计算失败</h3>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-200 text-lg mb-4">计算成功！</h3>

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">领域深度分数</h4>
                <div className="space-y-2">
                  {Object.entries(result.domain_scores || {}).map(([domain, score]: [string, any]) => {
                    const domainNames: Record<string, string> = {
                      self_awareness: '🌟 自我觉察',
                      life_sciences: '🌱 生命科学',
                      universal_laws: '🌌 宇宙法则',
                      creative_expression: '🎨 创意表达',
                      social_connection: '🤝 社会连接',
                    }
                    return (
                      <div key={domain} className="flex justify-between items-center">
                        <span className="text-gray-200">{domainNames[domain]}</span>
                        <span className="font-mono text-purple-300 font-semibold">{score}/40</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">根系视图</h4>
                <p className="text-xs text-gray-400 mb-3">
                  意识树的五条主根已更新，长度代表各领域的探索深度
                </p>
                <div className="space-y-1 text-xs">
                  {result.roots_view?.main_roots?.map((root: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.max(10, root.length * 2)}px` }}
                      ></div>
                      <span className="text-gray-300 text-xs">
                        {root.domain} ({root.length})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-300">
                <p>✅ {result.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  现在可以去查看您的意识树，根系已经根据课程进度更新！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mt-6">
          <h3 className="font-semibold text-blue-200 mb-3">💡 关于根系深度计算</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <strong>自在聆听</strong> → 100% 贡献到 <span className="text-purple-300">自我觉察</span></li>
            <li>• <strong>欢迎来到地球</strong> → 60% 贡献到 <span className="text-green-300">生命科学</span> + 40% <span className="text-yellow-300">宇宙法则</span></li>
            <li>• <strong>伊卡洛斯计划</strong> → 50% 贡献到 <span className="text-pink-300">创意表达</span> + 30% <span className="text-blue-300">社会连接</span> + 20% <span className="text-purple-300">自我觉察</span></li>
            <li className="text-xs text-gray-400 mt-3">* 每个课程完成度 0-100% 对应深度分 0-40分</li>
          </ul>
        </div>

        {/* Quick Link */}
        <div className="mt-6 text-center">
          <a
            href="/simple-tree"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 font-medium"
          >
            查看我的意识树 →
          </a>
        </div>
      </div>
    </div>
  )
}
