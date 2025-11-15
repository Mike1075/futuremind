'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  consciousness_level: number
  composite_score: number
  percentile_rank: number
}

export function ConsciousnessLevelBadge() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('consciousness_level, composite_score, percentile_rank')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('加载等级失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !profile) {
    return null
  }

  const level = profile.consciousness_level || 1
  const score = profile.composite_score || 0
  const percentile = profile.percentile_rank ? Math.round(profile.percentile_rank * 100) : 0

  // 等级颜色
  const getLevelColor = (level: number) => {
    const colors = [
      'from-gray-500 to-gray-600',      // Level 1
      'from-green-500 to-green-600',    // Level 2
      'from-blue-500 to-blue-600',      // Level 3
      'from-purple-500 to-purple-600',  // Level 4
      'from-pink-500 to-pink-600',      // Level 5
      'from-orange-500 to-orange-600',  // Level 6
      'from-yellow-400 to-yellow-500',  // Level 7
    ]
    return colors[level - 1] || colors[0]
  }

  // 等级名称
  const getLevelName = (level: number) => {
    const names = [
      '初醒者',    // Level 1
      '探索者',    // Level 2
      '觉察者',    // Level 3
      '实践者',    // Level 4
      '贤者',      // Level 5
      '智者',      // Level 6
      '觉醒者',    // Level 7
    ]
    return names[level - 1] || names[0]
  }

  // 进度条（到下一级的进度）
  const getNextLevelProgress = () => {
    // 简化版：基于综合评分计算进度
    // Level 1: 0-20, Level 2: 20-40, etc.
    const levelBase = (level - 1) * (100 / 7)
    const nextLevelBase = level * (100 / 7)
    const progress = ((score - levelBase) / (nextLevelBase - levelBase)) * 100
    return Math.min(100, Math.max(0, progress))
  }

  const nextLevelProgress = level < 7 ? getNextLevelProgress() : 100

  return (
    <div className="fixed top-24 left-8 z-50 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[280px]">
      {/* Level Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center`}>
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Level {level}</h3>
          <p className="text-gray-300 text-sm">{getLevelName(level)}</p>
        </div>
      </div>

      {/* Score Info */}
      <div className="bg-white/5 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">综合评分</span>
          <span className="text-sm font-bold text-white">{score}/100</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">百分位排名</span>
          <span className="text-sm font-bold text-purple-300">前 {100 - percentile}%</span>
        </div>
      </div>

      {/* Progress to Next Level */}
      {level < 7 && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">到 Level {level + 1} 的进度</span>
            <span className="text-xs text-green-300">{Math.round(nextLevelProgress)}%</span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getLevelColor(level + 1)} transition-all duration-500`}
              style={{ width: `${nextLevelProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <TrendingUp className="w-3 h-3" />
            <span>继续探索以提升等级</span>
          </div>
        </div>
      )}

      {/* Max Level */}
      {level === 7 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
          <span className="text-sm text-yellow-200 font-medium">🎉 已达最高等级！</span>
        </div>
      )}
    </div>
  )
}
