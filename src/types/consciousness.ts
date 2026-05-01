/**
 * 意识树MVP数据类型定义
 * 用于任务-节点关联和状态管理
 */

// 节点类型枚举
export type NodeType = 'awareness' | 'wisdom' | 'creativity' | 'connection'

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed'

// 任务-节点关联映射
export interface TaskNodeMapping {
  taskId: string
  nodeId: string
  contribution: number  // 对节点贡献的进度值 (0-100)
  unlockRequirement?: string[]  // 解锁此任务需要完成的其他任务
  description: string  // 任务描述
}

// 单个节点状态
export interface NodeState {
  nodeId: string
  type: NodeType
  title: string
  level: number
  currentProgress: number  // 0-100
  completedTasks: string[]
  unlocked: boolean
  lastUpdated: Date
  insights?: string[]  // 用户在此节点获得的洞察
}

// 任务状态
export interface TaskState {
  taskId: string
  title: string
  description: string
  status: TaskStatus
  nodeId: string  // 关联的节点ID
  completedAt?: Date
  userInsights?: string  // 用户完成任务时的感悟
}

// 用户整体进度状态
export interface ConsciousnessState {
  userId: string
  nodes: Record<string, NodeState>
  tasks: Record<string, TaskState>
  totalProgress: number  // 整体进度 0-100
  currentLevel: number   // 当前等级
  lastActiveDate: Date
  stats: {
    totalTasksCompleted: number
    consecutiveDays: number
    totalInsights: number
  }
}

// 节点详情显示数据
export interface NodeDetail {
  node: NodeState
  relatedTasks: TaskState[]
  progressHistory: {
    date: Date
    progress: number
    trigger: string  // 触发进度变化的原因
  }[]
  nextUnlocks: string[]  // 完成此节点后会解锁的内容
}

// Hook返回的状态和方法
export interface UseConsciousnessTreeReturn {
  // 状态
  state: ConsciousnessState
  loading: boolean
  error: string | null
  
  // 方法
  completeTask: (taskId: string, userInsights?: string) => Promise<boolean>
  getNodeDetail: (nodeId: string) => NodeDetail
  resetProgress: () => void
  
  // 计算属性
  availableTasks: TaskState[]
  completedTasksToday: number
  nextLevelProgress: number
}

// 预定义的任务-节点映射配置
export const TASK_NODE_MAPPINGS: TaskNodeMapping[] = [
  {
    taskId: 'meditation',
    nodeId: 'root',
    contribution: 30,
    description: '冥想练习提升基础觉察力'
  },
  {
    taskId: 'listening',
    nodeId: 'awareness-1', 
    contribution: 40,
    unlockRequirement: ['meditation'],
    description: '声音探索深化感知能力'
  },
  {
    taskId: 'reflection',
    nodeId: 'awareness-1',
    contribution: 30,
    description: '内观反思巩固觉察成果'
  }
]

// 预定义的节点配置
export const DEFAULT_NODES: Omit<NodeState, 'currentProgress' | 'completedTasks' | 'unlocked' | 'lastUpdated'>[] = [
  {
    nodeId: 'root',
    type: 'awareness',
    title: '觉醒的种子',
    level: 0
  },
  {
    nodeId: 'awareness-1', 
    type: 'awareness',
    title: '初始觉察',
    level: 1
  },
  {
    nodeId: 'wisdom-1',
    type: 'wisdom', 
    title: '智慧萌芽',
    level: 2
  },
  {
    nodeId: 'creativity-1',
    type: 'creativity',
    title: '创造之花', 
    level: 3
  },
  {
    nodeId: 'connection-1',
    type: 'connection',
    title: '共振之果',
    level: 4
  }
]