'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CONSCIOUSNESS_LEVEL_COLORS, getLevelPrimaryColor } from '@/lib/consciousness-config'

interface Profile {
  consciousness_level: number | null
  composite_score: number | null
  percentile_rank: number | null
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

  // 等级颜色 - 使用新的7脉轮配色系统
  const getLevelColor = (level: number): { primary: string; light: string; accent: string } => {
    const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
    const config = CONSCIOUSNESS_LEVEL_COLORS[levelKey]

    // 默认灰色（如果等级无效）
    if (!config) {
      return {
        primary: '#9CA3AF',
        light: '#D1D5DB',
        accent: '#FFA500'
      }
    }

    // 返回主色和亮色用于渐变
    return {
      primary: config.colors.primary,
      light: config.colors.light,
      accent: config.colors.accent
    }
  }

  // 等级名称 - 使用新的7脉轮系统名称
  const getLevelName = (level: number) => {
    const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
    const config = CONSCIOUSNESS_LEVEL_COLORS[levelKey]
    return config?.name || '未知'
  }

  // 获取脉轮信息
  const getChakraInfo = (level: number) => {
    const levelKey = `level_${level}` as keyof typeof CONSCIOUSNESS_LEVEL_COLORS
    const config = CONSCIOUSNESS_LEVEL_COLORS[levelKey]
    return config?.chakra || ''
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
  const currentLevelColor = getLevelColor(level)
  const nextLevelColor = level < 7 ? getLevelColor(level + 1) : currentLevelColor

  return (
    <div className="fixed top-24 left-8 z-50 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 min-w-[280px]">
      {/* Level Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${currentLevelColor.primary}, ${currentLevelColor.light})`
          }}
        >
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Level {level}</h3>
          <p className="text-gray-300 text-sm">{getLevelName(level)}</p>
          <p className="text-gray-400 text-xs">{getChakraInfo(level)}</p>
        </div>
      </div>

      {/* Progress to Next Level */}
      {level < 7 && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">到 Level {level + 1} 的进度</span>
            <span
              className="text-xs font-medium"
              style={{ color: nextLevelColor.primary }}
            >
              {Math.round(nextLevelProgress)}%
            </span>
          </div>
          <div className="h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${nextLevelProgress}%`,
                background: `linear-gradient(90deg, ${nextLevelColor.primary}, ${nextLevelColor.light})`
              }}
            ></div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <TrendingUp className="w-3 h-3" />
            <span>继续探索以提升到 {getLevelName(level + 1)}</span>
          </div>
        </div>
      )}

      {/* Max Level */}
      {level === 7 && (
        <div
          className="rounded-lg p-3 text-center border"
          style={{
            background: `linear-gradient(135deg, ${currentLevelColor.primary}20, ${currentLevelColor.accent}20)`,
            borderColor: `${currentLevelColor.primary}50`
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: currentLevelColor.light }}
          >
            🎉 已达最高等级！
          </span>
        </div>
      )}
    </div>
  )
}
