'use client'

import { useEffect, useState } from 'react'
import { ConsciousnessTreeCanvas } from './ConsciousnessTreeCanvas'
import { TreeGrowthData, TreeParams } from '@/lib/utils/consciousnessTreeGenerator'
import { createClient } from '@/lib/supabase/client'

// 🔥 组件版本号 - 用于诊断缓存问题
const COMPONENT_VERSION = '2.0.1-debug'

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
 * 旧格式1: { main_roots: [...], stability, branches_and_leaves }
 * 旧格式2: { growth_value: 0-100, is_solid }
 * 新格式: { count, depth_level, thickness, height_level, avg_length, is_solid }
 */
function migrateOldFormat(dbData: any): TreeGrowthData {
  // 🔥 检测旧格式1：main_roots 格式
  const isMainRootsFormat = dbData?.roots?.main_roots !== undefined

  if (isMainRootsFormat) {
    // 检测到 main_roots 旧格式，进行转换

    const mainRoots = dbData.roots.main_roots || []
    const totalRootLength = mainRoots.reduce((sum: number, root: any) => sum + (root.length || 0), 0)
    const avgRootLength = mainRoots.length > 0 ? totalRootLength / mainRoots.length : 0

    const trunkThickness = dbData?.trunk?.thickness ?? 0
    const trunkStability = dbData?.trunk?.stability ?? 0
    const totalLeaves = dbData?.branches_and_leaves?.total_leaves ?? 0
    const fruitsCount = Array.isArray(dbData?.fruits) ? dbData.fruits.length : 0

    // 🔥 检测是否为初始空状态（新用户默认值）
    const isInitialEmptyState =
      totalRootLength === 0 &&
      totalLeaves === 0 &&
      fruitsCount === 0 &&
      (trunkThickness <= 1 && trunkStability <= 1)

    if (isInitialEmptyState) {
      // 检测到初始空状态，返回种子状态
      return {
        roots: { count: 0, depth_level: 0, is_solid: false },
        trunk: { thickness: 0, height_level: 0, is_solid: false },
        branches: { count: 0, avg_length: 0, is_solid: false },
        leaves: { count: 0, is_solid: false },
        fruits: { count: 0, is_solid: false },
      }
    }

    // 根据依赖链计算虚实
    const rootsSolid = totalRootLength > 0
    const trunkSolid = rootsSolid && trunkThickness > 0

    return {
      roots: {
        count: mainRoots.length,
        depth_level: avgRootLength,
        is_solid: rootsSolid
      },
      trunk: {
        thickness: trunkThickness,
        height_level: trunkStability * 10,  // stability 1 → height_level 10
        is_solid: trunkSolid
      },
      branches: {
        count: Math.floor(totalLeaves / 10),  // 估算：每10片叶子对应1个枝
        avg_length: totalLeaves > 0 ? 5 : 0,  // 有叶子就给一个中等长度
        is_solid: trunkSolid && totalLeaves > 0
      },
      leaves: {
        count: totalLeaves,
        is_solid: trunkSolid && totalLeaves > 0
      },
      fruits: {
        count: fruitsCount,
        is_solid: trunkSolid && fruitsCount > 0
      }
    }
  }

  // 🔥 检测旧格式2：growth_value 格式
  const isGrowthValueFormat = dbData?.roots?.growth_value !== undefined

  if (isGrowthValueFormat) {
    // 检测到 growth_value 旧格式，进行转换

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
        count: Math.round((leavesValue / 100) * 200),   // 0-100 → 0-200（增加叶子上限）
        is_solid: dbData?.leaves?.is_solid ?? false
      },
      fruits: {
        count: Math.round((fruitsValue / 100) * 20),   // 0-100 → 0-20
        is_solid: dbData?.fruits?.is_solid ?? false
      },
    }
  }

  // 🔥 新格式直接返回（添加默认值保护）
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

export function ConsciousnessTreeView({ userId, isPreview = false, techParams }: ConsciousnessTreeViewProps) {
  const [growthData, setGrowthData] = useState<TreeGrowthData>(INITIAL_GROWTH_DATA)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 组件挂载时的初始化
  useEffect(() => {
    // 版本: COMPONENT_VERSION - 用于调试时启用日志
  }, [])

  useEffect(() => {
    loadTreeData()
  }, [userId]) // 只在userId改变时加载，techParams改变不触发

  const loadTreeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 添加超时保护（5秒）
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
        // 如果没有数据，使用种子状态
        setGrowthData(INITIAL_GROWTH_DATA)
      }
    } catch {
      // 预览模式下即使加载失败也显示种子状态
      if (isPreview) {
        setGrowthData(INITIAL_GROWTH_DATA)
        setError(null)
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
    </div>
  )
}
