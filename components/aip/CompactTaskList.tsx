'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import type { Task } from '@/lib/aip/types'

interface CompactTaskListProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function CompactTaskList({ tasks, onTaskClick }: CompactTaskListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: '已完成',
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20'
        }
      case 'in_progress':
        return {
          label: '进行中',
          icon: Clock,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20'
        }
      case 'pending':
        return {
          label: '待处理',
          icon: AlertCircle,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20'
        }
      default:
        return {
          label: '未知',
          icon: Circle,
          color: 'text-zinc-500',
          bg: 'bg-zinc-500/10',
          border: 'border-zinc-500/20'
        }
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { label: '高', color: 'text-red-500', bg: 'bg-red-500/10' }
      case 'medium':
        return { label: '中', color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
      case 'low':
        return { label: '低', color: 'text-green-500', bg: 'bg-green-500/10' }
      default:
        return { label: '中', color: 'text-zinc-500', bg: 'bg-zinc-500/10' }
    }
  }

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">我的任务</h3>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            全部 ({taskCounts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            待处理 ({taskCounts.pending})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              filter === 'in_progress'
                ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            进行中 ({taskCounts.in_progress})
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="max-h-[600px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <Circle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {filter === 'all' ? '暂无任务' : `暂无${getStatusConfig(filter).label}任务`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredTasks.map((task) => {
              const statusConfig = getStatusConfig(task.status)
              const priorityConfig = getPriorityConfig(task.priority)
              const StatusIcon = statusConfig.icon

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className="p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className={`p-1.5 rounded-lg ${statusConfig.bg} border ${statusConfig.border} flex-shrink-0 mt-0.5`}>
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-zinc-100">
                          {task.title}
                        </h4>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5 transition-colors" />
                      </div>

                      {task.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 text-xs rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
                          优先级: {priorityConfig.label}
                        </span>

                        {/* Due Date */}
                        {task.due_date && (
                          <span className="text-xs text-zinc-500">
                            截止: {new Date(task.due_date).toLocaleDateString('zh-CN')}
                          </span>
                        )}

                        {/* Project Name */}
                        {task.project && (
                          <span className="text-xs text-zinc-600">
                            • {task.project.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer Summary */}
      {tasks.length > 0 && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              共 {tasks.length} 个任务
            </span>
            <span className="text-zinc-500">
              完成率: {Math.round((taskCounts.completed / tasks.length) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
