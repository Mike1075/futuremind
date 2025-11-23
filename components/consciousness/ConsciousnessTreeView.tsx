'use client'

import { useEffect, useState } from 'react'
import { ConsciousnessTreeCanvas } from './ConsciousnessTreeCanvas'
import { TreeGrowthData, TreeParams } from '@/lib/utils/consciousnessTreeGenerator'
import { createClient } from '@/lib/supabase/client'

interface ConsciousnessTreeViewProps {
  userId: string
  isPreview?: boolean  // 预览模式（隐藏调试信息）
  techParams?: Partial<TreeParams>  // 技术参数（实时调整）
}

// 默认初始数据（种子状态）
const INITIAL_GROWTH_DATA: TreeGrowthData = {
  roots: { count: 0, depth_level: 0, is_solid: false },
  trunk: { thickness: 0, height_level: 0, is_solid: false },
  branches: { count: 0, avg_length: 0, is_solid: false },
  leaves: { count: 0, is_solid: false },
  fruits: { count: 0, is_solid: false },
}

/**
 * 旧格式到新格式的数据转换函数
 * 旧格式: { growth_value: 0-100, is_solid }
 * 新格式: { count, depth_level, thickness, height_level, avg_length, is_solid }
 */
function migrateOldFormat(dbData: any): TreeGrowthData {
  // 检测是否为旧格式（有 growth_value 字段）
  const isOldFormat = dbData?.roots?.growth_value !== undefined

  if (!isOldFormat) {
    // 新格式直接返回（添加默认值保护）
    return {
      roots: {
        count: dbData?.roots?.count ?? 0,
        depth_level: dbData?.roots?.depth_level ?? 0,
        is_solid: dbData?.roots?.is_solid ?? false
      },
      trunk: {
        thickness: dbData?.trunk?.thickness ?? 0,
        height_level: dbData?.trunk?.height_level ?? 0,
        is_solid: dbData?.trunk?.is_solid ?? false
      },
      branches: {
        count: dbData?.branches?.count ?? 0,
        avg_length: dbData?.branches?.avg_length ?? 0,
        is_solid: dbData?.branches?.is_solid ?? false
      },
      leaves: {
        count: dbData?.leaves?.count ?? 0,
        is_solid: dbData?.leaves?.is_solid ?? false
      },
      fruits: {
        count: dbData?.fruits?.count ?? 0,
        is_solid: dbData?.fruits?.is_solid ?? false
      },
    }
  }

  // 旧格式转换：growth_value (0-100) → 对应的新格式参数
  const rootsValue = dbData?.roots?.growth_value ?? 0
  const trunkValue = dbData?.trunk?.growth_value ?? 0
  const branchesValue = dbData?.branches?.growth_value ?? 0
  const leavesValue = dbData?.leaves?.growth_value ?? 0
  const fruitsValue = dbData?.fruits?.growth_value ?? 0

  return {
    roots: {
      count: Math.round((rootsValue / 100) * 20),  // 0-100 → 0-20
      depth_level: (rootsValue / 100) * 10,        // 0-100 → 0-10
      is_solid: dbData?.roots?.is_solid ?? false
    },
    trunk: {
      thickness: (trunkValue / 100) * 50,          // 0-100 → 0-50
      height_level: trunkValue,                     // 0-100 → 0-100
      is_solid: dbData?.trunk?.is_solid ?? false
    },
    branches: {
      count: Math.round((branchesValue / 100) * 20), // 0-100 → 0-20
      avg_length: (branchesValue / 100) * 10,        // 0-100 → 0-10
      is_solid: dbData?.branches?.is_solid ?? false
    },
    leaves: {
      count: Math.round((leavesValue / 100) * 50),   // 0-100 → 0-50
      is_solid: dbData?.leaves?.is_solid ?? false
    },
    fruits: {
      count: Math.round((fruitsValue / 100) * 20),   // 0-100 → 0-20
      is_solid: dbData?.fruits?.is_solid ?? false
    },
  }
}

export function ConsciousnessTreeView({ userId, isPreview = false, techParams }: ConsciousnessTreeViewProps) {
  const [growthData, setGrowthData] = useState<TreeGrowthData>(INITIAL_GROWTH_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTreeData()
  }, [userId]) // 只在userId改变时加载，techParams改变不触发

  const loadTreeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 🔥 添加超时保护（5秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('加载超时')), 5000)
      })

      const supabase = createClient()

      // 从 profiles 表获取 consciousness_tree_view
      const dataPromise = supabase
        .from('profiles')
        .select('consciousness_tree_view')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([dataPromise, timeoutPromise]) as any

      if (error) throw error

      if (data?.consciousness_tree_view) {
        // 使用迁移函数自动处理新旧格式
        const migratedData = migrateOldFormat(data.consciousness_tree_view)
        setGrowthData(migratedData)
      } else {
        // 🔥 如果没有数据，使用种子状态（而不是报错）
        console.log('用户还没有意识树数据，显示种子状态')
        setGrowthData(INITIAL_GROWTH_DATA)
      }
    } catch (err) {
      console.error('加载意识树数据失败:', err)
      // 🔥 预览模式下即使加载失败也显示种子状态
      if (isPreview) {
        console.log('预览模式：加载失败，显示种子状态')
        setGrowthData(INITIAL_GROWTH_DATA)
        setError(null)  // 清除错误，避免显示错误界面
      } else {
        setError('无法加载意识树数据')
      }
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
      <ConsciousnessTreeCanvas growthData={growthData} techParams={techParams} zoom={1} isPreview={isPreview} />

      {/* 树的状态信息（仅在非预览模式显示） */}
      {!isPreview && (
        <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs space-y-1">
          <div className="font-bold mb-2 text-red-400">意识树生长数据</div>
          <div>🌱 根系: {growthData.roots.count}个 深度{growthData.roots.depth_level.toFixed(1)} {growthData.roots.is_solid ? '实' : '虚'}</div>
          <div>🪵 树干: 厚度{growthData.trunk.thickness.toFixed(1)} 高度{growthData.trunk.height_level.toFixed(1)} {growthData.trunk.is_solid ? '实' : '虚'}</div>
          <div>🌿 枝干: {growthData.branches.count}个 长度{growthData.branches.avg_length.toFixed(1)} {growthData.branches.is_solid ? '实' : '虚'}</div>
          <div>🍃 树叶: {growthData.leaves.count}片 {growthData.leaves.is_solid ? '实' : '虚'}</div>
          <div>🍎 果实: {growthData.fruits.count}个 {growthData.fruits.is_solid ? '实' : '虚'}</div>
        </div>
      )}
    </div>
  )
}
