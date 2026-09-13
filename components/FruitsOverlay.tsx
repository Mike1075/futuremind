// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import type { Json } from '@/types/database'

interface Fruit {
  id: string
  fruit_type: string
  maturity_level: number
  size: number | null
  color: string | null
  metadata: Json | null
  harvested_at?: string | null
}

export function FruitsOverlay() {
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [hoveredFruit, setHoveredFruit] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFruits()
  }, [])

  const loadFruits = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('consciousness_fruits')
        .select('*')
        .eq('user_id', user.id)
        .order('maturity_level', { ascending: false })
        .limit(12) // 最多显示12个果实

      if (error) throw error

      setFruits(data || [])
    } catch (error) {
      console.error('加载果实失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || fruits.length === 0) {
    return null
  }

  // 果实类型图标
  const getFruitIcon = (type: string) => {
    const icons: Record<string, string> = {
      project_completion: '🍎',
      community_recognition: '🍓',
      knowledge_contribution: '🍇',
      collaboration_achievement: '🍊',
    }
    return icons[type] || '🍏'
  }

  // 果实类型名称
  const getFruitTypeName = (type: string) => {
    const names: Record<string, string> = {
      project_completion: '项目完成',
      community_recognition: '社区认可',
      knowledge_contribution: '知识贡献',
      collaboration_achievement: '协作成就',
    }
    return names[type] || type
  }

  // 为每个果实生成一个固定的位置
  const getFruitPosition = (index: number, total: number) => {
    // 在树的上半部分分散放置果实
    const cols = Math.ceil(Math.sqrt(total))
    const row = Math.floor(index / cols)
    const col = index % cols

    const offsetX = (col - cols / 2) * 120 + Math.random() * 40 - 20
    const offsetY = -200 - row * 80 + Math.random() * 30 - 15

    return {
      left: `calc(50% + ${offsetX}px)`,
      top: `calc(50% + ${offsetY}px)`,
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      <AnimatePresence>
        {fruits.map((fruit, index) => {
          const position = getFruitPosition(index, fruits.length)
          const isHovered = hoveredFruit === fruit.id
          const scale = (fruit.size || 20) / 20 // 标准化大小
          const metadata = (fruit.metadata as any) || {}

          return (
            <motion.div
              key={fruit.id}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: position.left,
                top: position.top,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: fruit.maturity_level > 30 ? 1 : 0.6,
                y: [0, -10, 0],
              }}
              transition={{
                scale: { duration: 0.5, delay: index * 0.1 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              onMouseEnter={() => setHoveredFruit(fruit.id)}
              onMouseLeave={() => setHoveredFruit(null)}
            >
              {/* 果实图标 */}
              <div
                className="relative"
                style={{
                  fontSize: `${24 + scale * 8}px`,
                  filter: fruit.maturity_level >= 80 ? 'brightness(1.2)' : 'brightness(0.9)',
                }}
              >
                {getFruitIcon(fruit.fruit_type)}

                {/* 成熟度光晕 */}
                {fruit.maturity_level >= 80 && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${fruit.color || '#a855f7'}66 0%, transparent 70%)`,
                      transform: 'scale(2)',
                    }}
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </div>

              {/* 工具提示 */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl"
                    style={{ pointerEvents: 'auto' }}
                  >
                    {/* 箭头 */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-black/95"></div>
                    </div>

                    {/* 内容 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getFruitIcon(fruit.fruit_type)}</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">
                            {metadata.project_name || '未命名项目'}
                          </h4>
                          <p className="text-xs text-gray-400">{getFruitTypeName(fruit.fruit_type)}</p>
                        </div>
                      </div>

                      {/* 成熟度进度条 */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-gray-400">成熟度</span>
                          <span className="text-white font-semibold">{fruit.maturity_level}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${fruit.maturity_level}%`,
                              background: fruit.color || '#a855f7',
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* 项目信息 */}
                      <div className="flex gap-3 text-xs text-gray-300">
                        {metadata.member_count !== undefined && (
                          <div>
                            <span className="text-gray-500">成员:</span>
                            <span className="ml-1 text-white">{metadata.member_count}</span>
                          </div>
                        )}
                        {metadata.completion_percentage !== undefined && (
                          <div>
                            <span className="text-gray-500">进度:</span>
                            <span className="ml-1 text-white">{metadata.completion_percentage}%</span>
                          </div>
                        )}
                        {metadata.likes_count !== undefined && (
                          <div>
                            <span className="text-gray-500">点赞:</span>
                            <span className="ml-1 text-white">{metadata.likes_count}</span>
                          </div>
                        )}
                      </div>

                      {/* 收获状态 */}
                      {fruit.harvested_at && (
                        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-green-300 flex items-center gap-1">
                          <span>✓</span>
                          <span>已收获</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
