'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { createProject } from '@/lib/aip/api'

interface CreateProjectModalProps {
  organizationId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateProjectModal({ organizationId, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isRecruiting, setIsRecruiting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('请输入项目名称')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      organization_id: organizationId,
      is_public: isPublic,
      is_recruiting: isRecruiting,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setIsPublic(false)
    setIsRecruiting(false)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">创建新项目</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Project Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入项目名称"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              maxLength={100}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              项目描述 <span className="text-zinc-500 font-normal">(可选)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述项目目标和内容..."
              rows={3}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
              maxLength={500}
              disabled={loading}
            />
          </div>

          {/* Options */}
          <div className="mb-6 space-y-3 p-3 bg-zinc-800/50 border border-zinc-800 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                公开项目（所有人可见）
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isRecruiting}
                onChange={(e) => setIsRecruiting(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
              />
              <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                招募成员（允许其他人申请加入）
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  创建项目
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
