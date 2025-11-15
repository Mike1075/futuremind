'use client'

import { useState } from 'react'
import { Brain, RefreshCw, CheckCircle, XCircle, Loader, Heart, Clock, Sparkles, Apple, Trophy } from 'lucide-react'

export default function ConsciousnessAdminPage() {
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [calculatingTrunk, setCalculatingTrunk] = useState(false)
  const [trunkResult, setTrunkResult] = useState<any>(null)
  const [trunkError, setTrunkError] = useState<string | null>(null)

  const [recordingMeditation, setRecordingMeditation] = useState(false)
  const [meditationDuration, setMeditationDuration] = useState(15)
  const [meditationNotes, setMeditationNotes] = useState('')
  const [meditationResult, setMeditationResult] = useState<any>(null)

  const [extractingInsights, setExtractingInsights] = useState(false)
  const [insightsResult, setInsightsResult] = useState<any>(null)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  const [calculatingFruits, setCalculatingFruits] = useState(false)
  const [fruitsResult, setFruitsResult] = useState<any>(null)
  const [fruitsError, setFruitsError] = useState<string | null>(null)

  const [calculatingLevel, setCalculatingLevel] = useState(false)
  const [levelResult, setLevelResult] = useState<any>(null)
  const [levelError, setLevelError] = useState<string | null>(null)

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

  const handleCalculateTrunk = async () => {
    setCalculatingTrunk(true)
    setTrunkError(null)
    setTrunkResult(null)

    try {
      const response = await fetch('/api/consciousness/calculate-trunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '计算失败')
      }

      setTrunkResult(data)
    } catch (err: any) {
      setTrunkError(err.message)
    } finally {
      setCalculatingTrunk(false)
    }
  }

  const handleRecordMeditation = async () => {
    if (meditationDuration < 1) {
      alert('请输入有效的冥想时长')
      return
    }

    setRecordingMeditation(true)
    setMeditationResult(null)

    try {
      const response = await fetch('/api/meditation/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration_minutes: meditationDuration,
          notes: meditationNotes,
          meditation_type: 'general',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '记录失败')
      }

      setMeditationResult(data)
      setMeditationNotes('')

      // 记录成功后自动重新计算树干
      setTimeout(() => handleCalculateTrunk(), 500)
    } catch (err: any) {
      alert('记录失败：' + err.message)
    } finally {
      setRecordingMeditation(false)
    }
  }

  const handleExtractInsights = async () => {
    setExtractingInsights(true)
    setInsightsError(null)
    setInsightsResult(null)

    try {
      const response = await fetch('/api/insights/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: 30,
          min_depth_score: 60,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '提取失败')
      }

      setInsightsResult(data)
    } catch (err: any) {
      setInsightsError(err.message)
    } finally {
      setExtractingInsights(false)
    }
  }

  const handleCalculateFruits = async () => {
    setCalculatingFruits(true)
    setFruitsError(null)
    setFruitsResult(null)

    try {
      const response = await fetch('/api/consciousness/calculate-fruits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '计算失败')
      }

      setFruitsResult(data)
    } catch (err: any) {
      setFruitsError(err.message)
    } finally {
      setCalculatingFruits(false)
    }
  }

  const handleCalculateLevel = async () => {
    setCalculatingLevel(true)
    setLevelError(null)
    setLevelResult(null)

    try {
      const response = await fetch('/api/consciousness/calculate-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '计算失败')
      }

      setLevelResult(data)
    } catch (err: any) {
      setLevelError(err.message)
    } finally {
      setCalculatingLevel(false)
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

        {/* Meditation Record Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            记录冥想练习
          </h2>
          <p className="text-gray-300 mb-4">
            记录您的冥想时长，系统会根据冥想数据动态调整意识树的树干粗细。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                冥想时长（分钟）
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={meditationDuration}
                onChange={(e) => setMeditationDuration(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                笔记（可选）
              </label>
              <textarea
                value={meditationNotes}
                onChange={(e) => setMeditationNotes(e.target.value)}
                placeholder="记录您的感受和体会..."
                rows={3}
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            <button
              onClick={handleRecordMeditation}
              disabled={recordingMeditation}
              className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              {recordingMeditation ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  保存冥想记录
                </>
              )}
            </button>

            {meditationResult && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-sm text-green-200">
                ✅ {meditationResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Calculate Trunk Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            计算树干粗细
          </h2>
          <p className="text-gray-300 mb-6">
            根据您最近90天的冥想练习，计算意识树的树干粗细和稳定性。
          </p>

          <button
            onClick={handleCalculateTrunk}
            disabled={calculatingTrunk}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {calculatingTrunk ? (
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

        {/* Trunk Error Display */}
        {trunkError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200">计算失败</h3>
              <p className="text-red-300 text-sm mt-1">{trunkError}</p>
            </div>
          </div>
        )}

        {/* Trunk Result Display */}
        {trunkResult && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-200 text-lg mb-4">树干计算成功！</h3>

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">树干数据</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200">粗细度</span>
                    <span className="font-mono text-green-300 font-semibold text-lg">{trunkResult.trunk?.thickness || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200">稳定性</span>
                    <span className="font-mono text-green-300 font-semibold">{trunkResult.trunk?.stability || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">冥想统计</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">总次数:</span>
                    <span className="ml-2 text-white font-semibold">{trunkResult.meditation_stats?.total_sessions || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">独立天数:</span>
                    <span className="ml-2 text-white font-semibold">{trunkResult.meditation_stats?.unique_days || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">最长连续:</span>
                    <span className="ml-2 text-white font-semibold">{trunkResult.meditation_stats?.longest_streak || 0}天</span>
                  </div>
                  <div>
                    <span className="text-gray-400">规律性:</span>
                    <span className="ml-2 text-white font-semibold">{trunkResult.meditation_stats?.regularity_score || 0}分</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-300">
                <p>✅ {trunkResult.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Extract Insights Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            提取洞见叶子
          </h2>
          <p className="text-gray-300 mb-6">
            AI分析您与Gaia的对话，提取深刻的洞见并生成叶子挂在意识树上。
          </p>

          <button
            onClick={handleExtractInsights}
            disabled={extractingInsights}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {extractingInsights ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                AI分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始提取
              </>
            )}
          </button>

          {extractingInsights && (
            <div className="mt-4 text-sm text-yellow-200">
              ⏳ AI正在分析您最近30天与Gaia的对话，这可能需要1-2分钟...
            </div>
          )}
        </div>

        {/* Insights Error Display */}
        {insightsError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200">提取失败</h3>
              <p className="text-red-300 text-sm mt-1">{insightsError}</p>
            </div>
          </div>
        )}

        {/* Insights Result Display */}
        {insightsResult && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-200 text-lg mb-4">洞见提取成功！</h3>

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">提取统计</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">分析消息:</span>
                    <span className="ml-2 text-white font-semibold">{insightsResult.stats?.total_messages_analyzed || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">提取洞见:</span>
                    <span className="ml-2 text-white font-semibold">{insightsResult.stats?.insights_extracted || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">保存成功:</span>
                    <span className="ml-2 text-white font-semibold">{insightsResult.stats?.insights_saved || 0}</span>
                  </div>
                </div>
              </div>

              {insightsResult.insights && insightsResult.insights.length > 0 && (
                <div className="bg-black/30 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">洞见列表</h4>
                  <div className="space-y-3">
                    {insightsResult.insights.map((insight: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.insight_type === 'breakthrough' ? 'bg-yellow-500/20 text-yellow-300' :
                            insight.insight_type === 'integration' ? 'bg-purple-500/20 text-purple-300' :
                            insight.insight_type === 'reflection' ? 'bg-blue-500/20 text-blue-300' :
                            insight.insight_type === 'awareness' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {insight.insight_type || 'general'}
                          </span>
                          <div className="flex gap-2 text-xs">
                            <span className="text-gray-400">深度: <strong className="text-yellow-300">{insight.depth_score}</strong></span>
                            <span className="text-gray-400">原创: <strong className="text-purple-300">{insight.originality_score}</strong></span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">{insight.content}</p>
                        {insight.ai_reasoning && (
                          <p className="text-xs text-gray-400 mt-2 italic">💡 {insight.ai_reasoning}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-300">
                <p>✅ {insightsResult.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  这些洞见已经生成为意识树的叶子，访问意识树即可查看！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calculate Fruits Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Apple className="w-5 h-5 text-orange-400" />
            计算成果果实
          </h2>
          <p className="text-gray-300 mb-6">
            基于您的项目完成度、社区参与度和协作质量，计算意识树上的成果果实。
          </p>

          <button
            onClick={handleCalculateFruits}
            disabled={calculatingFruits}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {calculatingFruits ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Apple className="w-5 h-5" />
                开始计算
              </>
            )}
          </button>

          {calculatingFruits && (
            <div className="mt-4 text-sm text-orange-200">
              ⏳ 正在分析您的项目数据和社区反响...
            </div>
          )}
        </div>

        {/* Fruits Error Display */}
        {fruitsError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200">计算失败</h3>
              <p className="text-red-300 text-sm mt-1">{fruitsError}</p>
            </div>
          </div>
        )}

        {/* Fruits Result Display */}
        {fruitsResult && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6 mb-6 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-200 text-lg mb-4">计算成功！</h3>

              {fruitsResult.stats && (
                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">统计信息</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">总项目数:</span>
                      <span className="ml-2 text-white font-semibold">{fruitsResult.stats.total_projects || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">新增果实:</span>
                      <span className="ml-2 text-white font-semibold">{fruitsResult.stats.fruits_created || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">更新果实:</span>
                      <span className="ml-2 text-white font-semibold">{fruitsResult.stats.fruits_updated || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">已收获:</span>
                      <span className="ml-2 text-white font-semibold">{fruitsResult.stats.harvested_fruits || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {fruitsResult.fruits && fruitsResult.fruits.length > 0 && (
                <div className="bg-black/30 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">果实详情</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {fruitsResult.fruits.map((fruit: any) => {
                      const typeLabels: Record<string, string> = {
                        project_completion: '🎯 项目完成',
                        community_recognition: '❤️ 社区认可',
                        knowledge_contribution: '📚 知识贡献',
                        collaboration_achievement: '🤝 协作成就',
                      }
                      return (
                        <div key={fruit.id} className="bg-white/5 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                {typeLabels[fruit.fruit_type] || fruit.fruit_type}
                              </span>
                              <p className="text-sm font-medium text-white mt-2">
                                {fruit.metadata?.project_name || '未命名项目'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">成熟度</p>
                              <p className="text-lg font-bold text-orange-300">{fruit.maturity_level}%</p>
                            </div>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-400 mt-2">
                            <span>成员: {fruit.metadata?.member_count || 0}</span>
                            <span>任务: {fruit.metadata?.completed_tasks || 0}/{fruit.metadata?.total_tasks || 0}</span>
                            <span>点赞: {fruit.metadata?.likes_count || 0}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-300">
                <p>✅ {fruitsResult.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  成果果实已生成！访问意识树即可看到您的成就！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calculate Consciousness Level Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            计算意识等级
          </h2>
          <p className="text-gray-300 mb-6">
            综合评估您的领域深度、活跃度、质量和对话深度，计算您的意识等级（1-7级）。
          </p>

          <button
            onClick={handleCalculateLevel}
            disabled={calculatingLevel}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            {calculatingLevel ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5" />
                开始计算
              </>
            )}
          </button>

          {calculatingLevel && (
            <div className="mt-4 text-sm text-purple-200">
              ⏳ 正在综合分析您的所有意识树数据...
            </div>
          )}
        </div>

        {/* Level Error Display */}
        {levelError && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-200">计算失败</h3>
              <p className="text-red-300 text-sm mt-1">{levelError}</p>
            </div>
          </div>
        )}

        {/* Level Result Display */}
        {levelResult && (
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-2xl mb-2">
                  意识等级 Level {levelResult.consciousness_level}
                </h3>
                <p className="text-purple-200 mb-4">
                  综合评分：<span className="font-bold text-white">{levelResult.composite_score}</span> 分
                  <span className="ml-3 text-sm">（百分位：前 {100 - levelResult.percentile_rank}%）</span>
                </p>

                {levelResult.scores && (
                  <div className="bg-black/30 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">分项得分</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">领域深度</span>
                          <span className="text-sm font-semibold text-purple-300">{levelResult.scores.domain_depth}</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                            style={{ width: `${levelResult.scores.domain_depth}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">活跃度</span>
                          <span className="text-sm font-semibold text-green-300">{levelResult.scores.activity}</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                            style={{ width: `${levelResult.scores.activity}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">质量</span>
                          <span className="text-sm font-semibold text-yellow-300">{levelResult.scores.quality}</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                            style={{ width: `${levelResult.scores.quality}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-400">对话深度</span>
                          <span className="text-sm font-semibold text-blue-300">{levelResult.scores.dialogue_depth}</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                            style={{ width: `${levelResult.scores.dialogue_depth}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {levelResult.stats && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">数据统计</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                      <div>
                        <span className="text-gray-400">冥想:</span>
                        <span className="ml-1 text-white font-semibold">{levelResult.stats.meditation_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">对话:</span>
                        <span className="ml-1 text-white font-semibold">{levelResult.stats.conversation_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">作业:</span>
                        <span className="ml-1 text-white font-semibold">{levelResult.stats.submission_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">洞见:</span>
                        <span className="ml-1 text-white font-semibold">{levelResult.stats.insight_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">果实:</span>
                        <span className="ml-1 text-white font-semibold">{levelResult.stats.fruit_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">根深:</span>
                        <span className="ml-1 text-white font-semibold">{levelResult.stats.avg_root_depth}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-sm text-white">
                  <p>✅ {levelResult.message}</p>
                  <p className="text-xs text-purple-200 mt-2">
                    您的意识等级已记录到历史，继续保持觉察和成长！
                  </p>
                </div>
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
