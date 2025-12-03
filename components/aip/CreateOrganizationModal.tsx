// @ts-nocheck
'use client'

import { useState } from 'react'
import { createOrganization } from '@/lib/aip/api'
import { Eye, EyeOff } from 'lucide-react'

interface CreateOrganizationModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateOrganizationModal({ onClose, onSuccess }: CreateOrganizationModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入组织名称')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createOrganization({
      name: name.trim(),
      description: description.trim(),
      is_public: isPublic
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          创建新组织
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              组织名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
              placeholder="例如：课程研发组"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              组织描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 resize-none"
              placeholder="描述这个组织的用途..."
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Eye className="h-5 w-5 text-green-400" />
              ) : (
                <EyeOff className="h-5 w-5 text-amber-400" />
              )}
              <div>
                <p className="text-white font-medium">公开可见</p>
                <p className="text-sm text-gray-400">
                  {isPublic ? '所有用户都能看到此组织' : '仅成员可见'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isPublic ? 'bg-green-600' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 btn-stardust text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '创建中...' : '创建组织'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
