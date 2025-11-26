'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { CourseContent } from '@/lib/supabase/database.types'
import { EarthStageCircle } from './EarthStageCircle'
import { getEarthProgress } from '@/lib/utils/interaction-tracker'

interface Stage {
  stageNumber: number
  contents: CourseContent[]
  completedCount: number
  totalCount: number
  isUnlocked: boolean
}

interface EarthCourseViewProps {
  courseSystem: {
    id: string
    title: string
    description: string | null
    system_key: string
  }
  contents: CourseContent[]
  completionMap: Map<string, boolean>
}

const UNLOCK_THRESHOLD = 0.8 // 80%完成度解锁下一阶段

// localStorage缓存key
const PROGRESS_CACHE_KEY = 'earth_course_progress'

export function EarthCourseView({
  courseSystem,
  contents,
  completionMap
}: EarthCourseViewProps) {
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<number | null>(null)

  // 从localStorage获取缓存的进度，优先使用缓存值
  const getInitialProgress = () => {
    // 服务端计算的初始进度
    const serverProgress = contents.length > 0
      ? Math.round((Array.from(completionMap.values()).filter(Boolean).length / contents.length) * 100)
      : 0

    // 尝试从localStorage获取缓存
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(PROGRESS_CACHE_KEY)
        if (cached) {
          const cacheData = JSON.parse(cached)
          // 检查是否是同一个课程系统的缓存
          if (cacheData.systemKey === courseSystem.system_key) {
            // 使用缓存值（可能是上次的真实进度）
            return cacheData.progress ?? serverProgress
          }
        }
      } catch {
        // localStorage不可用或解析失败，使用服务端值
      }
    }
    return serverProgress
  }

  const [overallProgress, setOverallProgress] = useState<number>(getInitialProgress)

  // 异步获取真实进度（后台更新，用户感知不到）
  useEffect(() => {
    const fetchRealProgress = async () => {
      if (contents.length === 0) return

      try {
        const contentIds = contents.map(c => c.id)
        const progressPromises = contentIds.map(id => getEarthProgress(id))
        const progressResults = await Promise.all(progressPromises)

        const validResults = progressResults.filter(r => r !== null)
        if (validResults.length === 0) return

        const totalProgress = validResults.reduce((sum, r) => sum + (r?.progress || 0), 0)
        const avgProgress = Math.round(totalProgress / validResults.length)

        // 只有当真实进度与当前不同时才更新
        setOverallProgress(prev => {
          if (prev !== avgProgress) {
            // 保存到localStorage缓存
            try {
              localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify({
                systemKey: courseSystem.system_key,
                progress: avgProgress,
                timestamp: Date.now()
              }))
            } catch {
              // localStorage不可用，忽略
            }
            return avgProgress
          }
          return prev
        })
      } catch (error) {
        console.error('Failed to fetch real progress:', error)
      }
    }

    fetchRealProgress()
  }, [contents, courseSystem.system_key])

  // 将内容按阶段分组（根据title中的"第X阶段"来分组）
  const stages: Stage[] = []

  contents.forEach(content => {
    // 从标题中提取阶段号（例如"第一阶段"-> 1, "第二阶段"-> 2）
    const stageMatch = content.title.match(/第([一二三四五六七八九十]+)阶段/)
    let stageNumber = content.sequence_number // 默认使用sequence_number

    if (stageMatch) {
      const chineseNumbers: Record<string, number> = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
      }
      stageNumber = chineseNumbers[stageMatch[1]] || content.sequence_number
    }

    // 查找或创建阶段
    let stage = stages.find(s => s.stageNumber === stageNumber)
    if (!stage) {
      stage = {
        stageNumber,
        contents: [],
        completedCount: 0,
        totalCount: 0,
        isUnlocked: stageNumber === 1 // 第一阶段总是解锁的
      }
      stages.push(stage)
    }

    stage.contents.push(content)
    stage.totalCount++
    if (completionMap.get(content.id)) {
      stage.completedCount++
    }
  })

  // 排序阶段
  stages.sort((a, b) => a.stageNumber - b.stageNumber)

  // 计算每个阶段的解锁状态
  for (let i = 1; i < stages.length; i++) {
    const prevStage = stages[i - 1]
    const prevStageCompletion = prevStage.totalCount > 0
      ? prevStage.completedCount / prevStage.totalCount
      : 0

    stages[i].isUnlocked = prevStageCompletion >= UNLOCK_THRESHOLD
  }

  // 计算总体进度（用于显示完成单元数）
  const totalContents = contents.length
  const completedContents = Array.from(completionMap.values()).filter(Boolean).length

  // 获取阶段的图标
  const getStageIcon = (stageNumber: number) => {
    const icons = ['🎧', '🌊', '🧠', '👥', '🌌', '🚀']
    return icons[stageNumber - 1] || '✨'
  }

  // 获取阶段颜色
  const getStageColor = (stageNumber: number) => {
    const colors = [
      'from-green-500 to-emerald-600',
      'from-blue-500 to-cyan-600',
      'from-purple-500 to-pink-600',
      'from-orange-500 to-red-600',
      'from-indigo-500 to-violet-600',
      'from-yellow-500 to-amber-600'
    ]
    return colors[stageNumber - 1] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href="/portal"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回学习中心
        </Link>

        {/* 课程头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">🌍</span>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
                {courseSystem.title}
              </h1>
              <p className="text-gray-400 text-lg mt-1">{courseSystem.description}</p>
            </div>
          </div>

          {/* 总体进度 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">总体学习进度</span>
              <span className="text-white font-medium">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${overallProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="text-sm text-gray-400">
              已完成 {completedContents} / {totalContents} 个单元 · {stages.filter(s => s.isUnlocked).length} / {stages.length} 个阶段已解锁
            </p>
          </div>
        </div>

        {/* 圆形阶段导航 */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">学习旅程</h2>
          <EarthStageCircle
            stages={stages}
            completionMap={completionMap}
            systemKey={courseSystem.system_key}
          />
        </div>

        {/* 原列表视图（备用，已隐藏）*/}
        <div className="hidden space-y-6">
          <h2 className="text-2xl font-bold mb-4">学习旅程</h2>

          {stages.map((stage, index) => {
            const stageProgress = stage.totalCount > 0
              ? Math.round((stage.completedCount / stage.totalCount) * 100)
              : 0
            const willUnlockNext = index < stages.length - 1 && stageProgress >= UNLOCK_THRESHOLD * 100

            return (
              <div
                key={stage.stageNumber}
                className={`relative border rounded-lg overflow-hidden transition-all ${
                  stage.isUnlocked
                    ? 'bg-gray-900/50 border-gray-800'
                    : 'bg-gray-900/20 border-gray-800/50'
                }`}
              >
                {/* 解锁动画遮罩 */}
                {showUnlockAnimation === stage.stageNumber && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse z-10" />
                )}

                {/* 未解锁遮罩 */}
                {!stage.isUnlocked && (
                  <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <svg className="w-16 h-16 text-gray-600 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-300 font-medium mb-2">🔒 阶段未解锁</p>
                      <p className="text-gray-500 text-sm">
                        完成前一阶段 {Math.round(UNLOCK_THRESHOLD * 100)}% 的内容后解锁
                      </p>
                      {index > 0 && (
                        <p className="text-gray-400 text-sm mt-2">
                          第{index}阶段进度：{stages[index - 1].completedCount}/{stages[index - 1].totalCount}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 阶段头部 */}
                <div
                  className={`w-full px-6 py-5 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-4">
                    {/* 阶段图标 */}
                    <div className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r ${
                      stage.isUnlocked ? getStageColor(stage.stageNumber) : 'from-gray-700 to-gray-600'
                    } text-white text-2xl`}>
                      {getStageIcon(stage.stageNumber)}
                    </div>

                    <div className="text-left">
                      <h3 className={`text-lg font-semibold ${stage.isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                        {stage.contents[0]?.title || `第${stage.stageNumber}阶段`}
                      </h3>
                      {stage.contents[0]?.subtitle && (
                        <p className={`text-sm mt-1 ${stage.isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {stage.contents[0].subtitle}
                        </p>
                      )}

                      {/* 进度条 */}
                      {stage.isUnlocked && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-32 bg-gray-800 rounded-full h-1.5">
                              <div
                                className={`bg-gradient-to-r ${getStageColor(stage.stageNumber)} h-1.5 rounded-full transition-all`}
                                style={{ width: `${stageProgress}%` }}
                              />
                            </div>
                            <span>{stageProgress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <div className="flex items-center gap-3">
                    {stageProgress === 100 && stage.isUnlocked && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                        ✓ 已完成
                      </span>
                    )}
                    {willUnlockNext && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium animate-pulse">
                        🎉 可解锁下一阶段
                      </span>
                    )}
                  </div>
                </div>

                {/* 阶段内容列表 */}
                {stage.isUnlocked && (
                  <div className="px-6 pb-5 space-y-3 border-t border-gray-800">
                    {stage.contents.map((content, contentIndex) => {
                      const isCompleted = completionMap.get(content.id) === true
                      // 对于阶段内的内容，第一个总是解锁的，其余需要完成前一个
                      const isContentUnlocked = contentIndex === 0 || completionMap.get(stage.contents[contentIndex - 1].id) === true

                      return (
                        <div key={content.id} className="pt-3">
                          <Link
                            href={isContentUnlocked ? `/courses/${courseSystem.system_key}/${content.id}` : '#'}
                            className={`block p-4 rounded-lg transition-all ${
                              isContentUnlocked
                                ? 'bg-gray-900/30 hover:bg-gray-900/50 border border-gray-800 hover:border-gray-700'
                                : 'bg-gray-900/10 border border-gray-800/30 cursor-not-allowed opacity-50'
                            }`}
                            onClick={(e) => {
                              if (!isContentUnlocked) e.preventDefault()
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {/* 序号或完成标识 */}
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                  isCompleted
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                    : isContentUnlocked
                                    ? 'bg-gradient-to-br from-gray-700 to-gray-600 text-white'
                                    : 'bg-gray-800 text-gray-600'
                                }`}>
                                  {isCompleted ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    contentIndex + 1
                                  )}
                                </div>

                                <div>
                                  <h4 className={`font-medium ${isContentUnlocked ? 'text-white' : 'text-gray-600'}`}>
                                    {content.title.replace(/第[一二三四五六七八九十]+阶段[：:]\s*/, '')}
                                  </h4>
                                  {content.subtitle && (
                                    <p className={`text-sm mt-0.5 ${isContentUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {content.subtitle}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {isCompleted && (
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-medium">
                                  已完成
                                </span>
                              )}
                              {!isContentUnlocked && (
                                <span className="px-2 py-1 bg-gray-700/50 text-gray-500 text-xs rounded-full font-medium">
                                  🔒 锁定
                                </span>
                              )}
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 提示信息 */}
        <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">学习提示</h4>
              <p className="text-sm text-gray-300">
                完成当前阶段 {Math.round(UNLOCK_THRESHOLD * 100)}% 的内容后，将自动解锁下一阶段。
                每个单元包含知识点学习、苏格拉底式提问和课后反思，建议按顺序完成。
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
