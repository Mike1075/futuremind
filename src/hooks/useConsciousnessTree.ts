'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
// import { createClient } from '@/lib/supabase/client'
import {
  ConsciousnessState,
  NodeState,
  TaskState,
  NodeDetail,
  UseConsciousnessTreeReturn,
  TASK_NODE_MAPPINGS,
  DEFAULT_NODES
} from '@/types/consciousness'

const STORAGE_KEY = 'consciousness_state'

// 初始化默认状态
const createInitialState = (userId: string): ConsciousnessState => {
  const now = new Date()
  
  const nodes: Record<string, NodeState> = {}
  DEFAULT_NODES.forEach(nodeConfig => {
    nodes[nodeConfig.nodeId] = {
      ...nodeConfig,
      currentProgress: nodeConfig.nodeId === 'root' ? 100 : 0, // 根节点默认完成
      completedTasks: [],
      unlocked: nodeConfig.nodeId === 'root', // 只有根节点默认解锁
      lastUpdated: now
    }
  })

  const tasks: Record<string, TaskState> = {}
  TASK_NODE_MAPPINGS.forEach(mapping => {
    tasks[mapping.taskId] = {
      taskId: mapping.taskId,
      title: getTaskTitle(mapping.taskId),
      description: mapping.description,
      status: 'pending',
      nodeId: mapping.nodeId
    }
  })

  return {
    userId,
    nodes,
    tasks,
    totalProgress: 20, // 根节点完成贡献的基础进度
    currentLevel: 1,
    lastActiveDate: now,
    stats: {
      totalTasksCompleted: 0,
      consecutiveDays: 1,
      totalInsights: 0
    }
  }
}

// 获取任务标题的辅助函数
const getTaskTitle = (taskId: string): string => {
  const titles: Record<string, string> = {
    meditation: '今日冥想',
    listening: '声音探索', 
    reflection: '内观反思'
  }
  return titles[taskId] || taskId
}

export const useConsciousnessTree = (userId?: string): UseConsciousnessTreeReturn => {
  const [state, setState] = useState<ConsciousnessState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const supabase = createClient() // 暂时注释掉，使用本地存储

  // 初始化状态
  useEffect(() => {
    const initializeState = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        // 尝试从本地存储加载
        const savedState = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          // 转换日期字符串回Date对象
          Object.values(parsedState.nodes as Record<string, NodeState>).forEach(node => {
            node.lastUpdated = new Date(node.lastUpdated)
          })
          parsedState.lastActiveDate = new Date(parsedState.lastActiveDate)
          
          // 转换任务的完成时间
          Object.values(parsedState.tasks as Record<string, any>).forEach(task => {
            if (task.completedAt) {
              task.completedAt = new Date(task.completedAt)
            }
          })
          
          setState(parsedState)
        } else {
          // 创建新状态
          const initialState = createInitialState(userId)
          setState(initialState)
          localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(initialState))
        }
      } catch (err) {
        console.error('Error initializing consciousness state:', err)
        setError('Failed to initialize state')
        // 降级到默认状态
        const initialState = createInitialState(userId || 'anonymous')
        setState(initialState)
      } finally {
        setLoading(false)
      }
    }

    initializeState()
  }, [userId])

  // 保存状态到本地存储
  const saveState = useCallback((newState: ConsciousnessState) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${newState.userId}`, JSON.stringify(newState))
    } catch (err) {
      console.error('Error saving state:', err)
    }
  }, [])

  // 完成任务的核心逻辑
  const completeTask = useCallback(async (taskId: string, userInsights?: string): Promise<boolean> => {
    if (!state) return false

    const task = state.tasks[taskId]
    if (!task || task.status === 'completed') return false

    try {
      const mapping = TASK_NODE_MAPPINGS.find(m => m.taskId === taskId)
      if (!mapping) return false

      const node = state.nodes[mapping.nodeId]
      if (!node || !node.unlocked) return false

      const now = new Date()
      
      // 更新任务状态
      const updatedTask: TaskState = {
        ...task,
        status: 'completed',
        completedAt: now,
        userInsights
      }

      // 更新节点进度
      const newProgress = Math.min(100, node.currentProgress + mapping.contribution)
      const updatedNode: NodeState = {
        ...node,
        currentProgress: newProgress,
        completedTasks: [...node.completedTasks, taskId],
        lastUpdated: now,
        insights: userInsights ? [...(node.insights || []), userInsights] : node.insights
      }

      // 检查是否需要解锁新节点
      const updatedNodes = { ...state.nodes, [mapping.nodeId]: updatedNode }
      
      // 解锁逻辑：基于当前进度解锁新节点
      if (newProgress >= 100 && node.level < 4) {
        const nextNodeId = getNextNodeId(node.level)
        if (nextNodeId && updatedNodes[nextNodeId]) {
          updatedNodes[nextNodeId] = {
            ...updatedNodes[nextNodeId],
            unlocked: true,
            lastUpdated: now
          }
        }
      }

      // 计算新的总进度
      const totalProgress = calculateTotalProgress(updatedNodes)
      const currentLevel = Math.floor(totalProgress / 25) + 1

      const newState: ConsciousnessState = {
        ...state,
        tasks: { ...state.tasks, [taskId]: updatedTask },
        nodes: updatedNodes,
        totalProgress,
        currentLevel,
        lastActiveDate: now,
        stats: {
          ...state.stats,
          totalTasksCompleted: state.stats.totalTasksCompleted + 1,
          totalInsights: userInsights ? state.stats.totalInsights + 1 : state.stats.totalInsights
        }
      }

      setState(newState)
      saveState(newState)

      // 可以在这里添加庆祝动画触发
      console.log('🎉 任务完成!', { taskId, nodeId: mapping.nodeId, newProgress })
      
      return true
    } catch (err) {
      console.error('Error completing task:', err)
      setError('Failed to complete task')
      return false
    }
  }, [state, saveState])

  // 获取节点详情
  const getNodeDetail = useCallback((nodeId: string): NodeDetail => {
    if (!state) {
      throw new Error('State not initialized')
    }

    const node = state.nodes[nodeId]
    if (!node) {
      throw new Error(`Node ${nodeId} not found`)
    }

    const relatedTasks = Object.values(state.tasks).filter(task => task.nodeId === nodeId)
    
    // 模拟进度历史（实际项目中应从数据库获取）
    const progressHistory = [
      {
        date: new Date(node.lastUpdated.getTime() - 86400000), // 昨天
        progress: Math.max(0, node.currentProgress - 30),
        trigger: '每日任务完成'
      },
      {
        date: node.lastUpdated,
        progress: node.currentProgress,
        trigger: '最近任务完成'
      }
    ]

    const nextUnlocks = node.currentProgress >= 100 && node.level < 4 
      ? [`${node.type}-${node.level + 1}级节点`]
      : []

    return {
      node,
      relatedTasks,
      progressHistory,
      nextUnlocks
    }
  }, [state])

  // 重置进度（开发测试用）
  const resetProgress = useCallback(() => {
    if (!userId) return
    
    const initialState = createInitialState(userId)
    setState(initialState)
    saveState(initialState)
    console.log('🔄 Progress reset')
  }, [userId, saveState])

  // 计算可用任务
  const availableTasks = useMemo(() => {
    if (!state) return []
    
    return Object.values(state.tasks).filter(task => {
      if (task.status === 'completed') return false
      
      const mapping = TASK_NODE_MAPPINGS.find(m => m.taskId === task.taskId)
      if (!mapping) return false
      
      // 检查节点是否解锁
      const node = state.nodes[mapping.nodeId]
      if (!node?.unlocked) return false
      
      // 检查前置任务要求
      if (mapping.unlockRequirement) {
        return mapping.unlockRequirement.every(reqTaskId => 
          state.tasks[reqTaskId]?.status === 'completed'
        )
      }
      
      return true
    })
  }, [state])

  // 计算今日完成任务数
  const completedTasksToday = useMemo(() => {
    if (!state) return 0
    
    const today = new Date().toDateString()
    return Object.values(state.tasks).filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return false
      
      // 确保 completedAt 是 Date 对象
      const completedDate = task.completedAt instanceof Date 
        ? task.completedAt 
        : new Date(task.completedAt)
      
      return completedDate.toDateString() === today
    }).length
  }, [state])

  // 计算到下一等级的进度
  const nextLevelProgress = useMemo(() => {
    if (!state) return 0
    
    const currentLevelBase = (state.currentLevel - 1) * 25
    const nextLevelBase = state.currentLevel * 25
    const progressInLevel = state.totalProgress - currentLevelBase
    const levelRange = nextLevelBase - currentLevelBase
    
    return Math.min(100, (progressInLevel / levelRange) * 100)
  }, [state])

  if (!state) {
    return {
      state: createInitialState('loading'),
      loading,
      error,
      completeTask: async () => false,
      getNodeDetail: () => { throw new Error('Not ready') },
      resetProgress: () => {},
      availableTasks: [],
      completedTasksToday: 0,
      nextLevelProgress: 0
    }
  }

  return {
    state,
    loading,
    error,
    completeTask,
    getNodeDetail,
    resetProgress,
    availableTasks,
    completedTasksToday,
    nextLevelProgress
  }
}

// 辅助函数
const getNextNodeId = (currentLevel: number): string | null => {
  const levelMap: Record<number, string> = {
    0: 'awareness-1',
    1: 'wisdom-1', 
    2: 'creativity-1',
    3: 'connection-1'
  }
  return levelMap[currentLevel] || null
}

const calculateTotalProgress = (nodes: Record<string, NodeState>): number => {
  const nodeValues = Object.values(nodes)
  const totalPossible = nodeValues.length * 100
  const totalCurrent = nodeValues.reduce((sum, node) => sum + node.currentProgress, 0)
  return Math.round((totalCurrent / totalPossible) * 100)
}