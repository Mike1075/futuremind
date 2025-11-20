'use client'

import { useEffect, useState } from 'react'
import { ConsciousnessTreeCanvas } from './ConsciousnessTreeCanvas'
import { TreeGrowthData } from '@/lib/utils/consciousnessTreeGenerator'
import { createClient } from '@/lib/supabase/client'

interface ConsciousnessTreeViewProps {
  userId: string
}

// 默认初始数据（全为0）
const INITIAL_GROWTH_DATA: TreeGrowthData = {
  roots: { growth_value: 0, is_solid: false },
  trunk: { growth_value: 0, is_solid: false },
  branches: { growth_value: 0, is_solid: false },
  leaves: { growth_value: 0, is_solid: false },
  fruits: { growth_value: 0, is_solid: false },
}

export function ConsciousnessTreeView({ userId }: ConsciousnessTreeViewProps) {
  const [growthData, setGrowthData] = useState<TreeGrowthData>(INITIAL_GROWTH_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTreeData()
  }, [userId])

  const loadTreeData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // 从 profiles 表获取 consciousness_tree_view
      const { data, error } = await supabase
        .from('profiles')
        .select('consciousness_tree_view')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data?.consciousness_tree_view) {
        // 验证数据结构并与默认数据合并，确保所有字段都存在
        const dbData = data.consciousness_tree_view as any
        const mergedData: TreeGrowthData = {
          roots: {
            growth_value: dbData?.roots?.growth_value ?? 0,
            is_solid: dbData?.roots?.is_solid ?? false
          },
          trunk: {
            growth_value: dbData?.trunk?.growth_value ?? 0,
            is_solid: dbData?.trunk?.is_solid ?? false
          },
          branches: {
            growth_value: dbData?.branches?.growth_value ?? 0,
            is_solid: dbData?.branches?.is_solid ?? false
          },
          leaves: {
            growth_value: dbData?.leaves?.growth_value ?? 0,
            is_solid: dbData?.leaves?.is_solid ?? false
          },
          fruits: {
            growth_value: dbData?.fruits?.growth_value ?? 0,
            is_solid: dbData?.fruits?.is_solid ?? false
          },
        }
        setGrowthData(mergedData)
      }
    } catch (err) {
      console.error('加载意识树数据失败:', err)
      setError('无法加载意识树数据')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-red-400">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <ConsciousnessTreeCanvas growthData={growthData} />

      {/* 树的状态信息（可选，调试用） */}
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs space-y-1">
        <div className="font-bold mb-2 text-red-400">意识树生长数据</div>
        <div>根系: {growthData.roots.growth_value}% {growthData.roots.is_solid ? '✓' : '虚'}</div>
        <div>树干: {growthData.trunk.growth_value}% {growthData.trunk.is_solid ? '✓' : '虚'}</div>
        <div>枝干: {growthData.branches.growth_value}% {growthData.branches.is_solid ? '✓' : '虚'}</div>
        <div>树叶: {growthData.leaves.growth_value}% {growthData.leaves.is_solid ? '✓' : '虚'}</div>
        <div>果实: {growthData.fruits.growth_value}% {growthData.fruits.is_solid ? '✓' : '虚'}</div>
      </div>
    </div>
  )
}
