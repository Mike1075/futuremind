// @ts-nocheck
'use client'

import { useState, memo, useCallback } from 'react'
import type { Task } from '@/lib/aip/types'
import { updateTask } from '@/lib/aip/api'

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  projectId: string
  onUpdate: () => void
}

type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed'

export const TaskList = memo(function TaskList({ tasks, loading, projectId, onUpdate }: TaskListProps) {
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter(task => task.status === filter)

  const handleStatusChange = useCallback(async (taskId: string, newStatus: Task['status']) => {
    setUpdating(taskId)
    await updateTask(taskId, { status: newStatus })
    setUpdating(null)
    onUpdate()
  }, [onUpdate])

  const statusColors = {
    pending: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  }

  const statusLabels = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-blue-400',
    high: 'text-orange-400',
    urgent: 'text-red-400',
  }

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-white/10">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待处理' },
          { key: 'in_progress', label: '进行中' },
          { key: 'completed', label: '已完成' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as TaskFilter)}
            className={`pb-3 px-2 text-sm font-medium transition-colors relative ${
              filter === tab.key
                ? 'text-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {filter === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>{filter === 'all' ? '暂无任务' : `暂无${statusLabels[filter]}任务`}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-black/30 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-200"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`text-xs px-3 py-1 rounded border ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                  <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
              </div>

              {/* Task Meta */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                {task.assignee && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{task.assignee.full_name || task.assignee.email}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>截止: {new Date(task.due_date).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>

              {/* Task Actions */}
              <div className="flex items-center gap-2">
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                        disabled={updating === task.id}
                        className="px-4 py-2 text-sm bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                      >
                        开始任务
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'completed')}
                        disabled={updating === task.id}
                        className="px-4 py-2 text-sm bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                      >
                        完成任务
                      </button>
                    )}
                  </>
                )}
                {task.status === 'completed' && (
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>已完成</span>
                  </div>
                )}
              </div>

              {/* Progress Bar (if in progress and has subtasks) */}
              {task.status === 'in_progress' && task.metadata?.progress !== undefined && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>进度</span>
                    <span>{task.metadata.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${task.metadata.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
