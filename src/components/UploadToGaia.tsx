'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import GaiaAPI from '@/lib/api/gaia'

type Props = {
  isOpen: boolean
  onClose: () => void
}

export default function UploadToGaia({ isOpen, onClose }: Props) {
  const [projects, setProjects] = useState<Array<{ id: string; name?: string }>>([])
  const [projectId, setProjectId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      const result = await GaiaAPI.listUserProjects()
      if (result.success && result.data) {
        setProjects(result.data)
        if (result.data.length && !projectId) setProjectId(result.data[0].id)
      }
    })()
  }, [isOpen])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !projectId) {
      setMessage('请选择项目并选择文件')
      return
    }
    setSubmitting(true)
    setMessage('')
    const res = await GaiaAPI.uploadProjectDocument({ projectId, file })
    setSubmitting(false)
    if (!res.success) {
      setMessage(`上传失败: ${res.error || ''}`)
      return
    }
    setMessage('上传成功，n8n 已接收')
    setTimeout(onClose, 1000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4">上传文档给盖亚</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">选择项目</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900">
                  {p.name || p.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">选择文件 (pdf / doc / docx / txt)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-gray-200"
            />
          </div>
          {message && (
            <div className="text-sm text-purple-200">{message}</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 text-gray-200">
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {submitting ? '上传中...' : '上传'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}


