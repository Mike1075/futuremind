'use client'

import { useState, useEffect } from 'react'
import { createTask } from '@/lib/aip/api'
import { useProjectMembers } from '@/lib/aip/hooks'
import type { TaskPriority } from '@/lib/aip/types'

interface CreateTaskModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateTaskModal({ projectId, onClose, onSuccess }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { members, loading: membersLoading } = useProjectMembers(projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('请输入任务标题')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      project_id: projectId,
      priority,
      assignee_id: assigneeId || undefined,
      due_date: dueDate || undefined,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card-glass border border-white/10 rounded-xl max-w-2xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            创建新任务
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              任务标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入任务标题"
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              任务描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述任务内容和要求"
              rows={4}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
              maxLength={1000}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              优先级
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: 'low', label: '低', color: 'gray' },
                { value: 'medium', label: '中', color: 'blue' },
                { value: 'high', label: '高', color: 'orange' },
                { value: 'urgent', label: '紧急', color: 'red' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as TaskPriority)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    priority === p.value
                      ? `bg-${p.color}-500/20 text-${p.color}-300 border-${p.color}-500/50 ring-2 ring-${p.color}-500/20`
                      : 'bg-black/30 text-gray-400 border-white/20 hover:border-white/40'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              指派给
            </label>
            {membersLoading ? (
              <div className="text-sm text-gray-400">加载成员列表...</div>
            ) : (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              >
                <option value="">未指派</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user?.full_name || member.user?.email || '未知用户'}
                    {member.role_in_project === 'owner' && ' (所有者)'}
                    {member.role_in_project === 'manager' && ' (管理员)'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              截止日期
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 btn-stardust text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '创建中...' : '创建任务'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 btn-stardust text-white font-medium rounded-lg"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
