'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

interface EditDescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, description: string) => void
  projectName: string
  currentDescription: string
  loading?: boolean
}

export function EditDescriptionModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
  currentDescription,
  loading = false
}: EditDescriptionModalProps) {
  const toast = useToast()
  const [name, setName] = useState(projectName)
  const [description, setDescription] = useState(currentDescription)

  useEffect(() => {
    setName(projectName)
    setDescription(currentDescription)
  }, [projectName, currentDescription])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('项目名称不能为空')
      return
    }
    onConfirm(name.trim(), description.trim())
  }

  const handleClose = () => {
    setName(projectName) // 重置为原值
    setDescription(currentDescription) // 重置为原值
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">编辑项目信息</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Project Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              项目名称
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="请输入项目名称..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Description Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              项目描述
            </label>
            <textarea
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              placeholder="请输入项目描述..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
