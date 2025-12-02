// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, FileText, ArrowLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface Document {
  id: string
  title: string
  metadata: {
    type: string
    project_id: string
    filename: string
    file_size: number
    file_type: string
    uploaded_at: string
    status?: string // 处理状态：processing, completed, error
    vector_count?: number
  }
  created_at: string
}

export default function GaiaKnowledgeBasePage() {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadDocuments()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      router.push('/')
    }
  }

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/gaia-kb')

      // CQ-08: 检查response.ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.documents) {
        setDocuments(data.documents)
      }
    } catch {
      // 静默处理错误
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // 重置 input 值，允许再次选择相同的文件
    e.target.value = ''

    if (file) {
      setSelectedFile(file)
      // 自动填充标题（去掉文件扩展名）
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setTitle(nameWithoutExt)
      }
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile || !title.trim()) {
      toast.warning('请选择文件并输入标题')
      return
    }

    // 确认上传
    const confirmed = await confirm({
      title: '确认操作',
      message: `确认上传文档「${title.trim()}」到盖亚知识库吗？\n\n文件：${selectedFile.name}\n大小：${formatFileSize(selectedFile.size)}\n\n上传后将自动进行向量化处理。`,
      type: 'warning'
    })
    if (!confirmed) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title.trim())
      // 不再传递 courseId，后端使用固定的盖亚专属 project_id

      const response = await fetch('/api/admin/gaia-kb', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`上传成功！${data.message || '文档正在后台处理向量化，请稍后刷新查看。'}`)
        setSelectedFile(null)
        setTitle('')
        // 重置文件输入
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        // 重新加载列表
        await loadDocuments()
      } else {
        toast.error(`上传失败：${data.error || '未知错误'}。请检查文件格式和网络连接后重试。`)
      }
    } catch (error: any) {
      console.error('上传失败:', error)
      toast.error(`上传失败：${error.message || '网络错误'}。请检查网络连接后重试。`)
    } finally {
      setUploading(false)
    }
  }

  // 智能判断文档状态
  const getDocumentStatus = (doc: Document): 'completed' | 'processing' | 'error' => {
    const vectorCount = doc.metadata?.vector_count || 0
    const createdAt = new Date(doc.created_at).getTime()
    const now = Date.now()
    const elapsedMinutes = (now - createdAt) / 1000 / 60

    // 如果有向量块，说明已完成
    if (vectorCount > 0) {
      return 'completed'
    }

    // 如果超过10分钟还没生成向量块，说明出错了
    if (elapsedMinutes > 10) {
      return 'error'
    }

    // 否则还在处理中
    return 'processing'
  }

  // 获取状态配置
  const getStatusConfig = (status: 'completed' | 'processing' | 'error') => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          label: '已完成',
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          border: 'border-green-500/20'
        }
      case 'processing':
        return {
          icon: Clock,
          label: '转写中',
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20'
        }
      case 'error':
        return {
          icon: AlertCircle,
          label: '出错了',
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20'
        }
    }
  }

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: '确认操作',
      message: `确定要删除文档「${title}」吗？\n\n此操作不可撤销，删除后盖亚将无法再使用这份知识。`,
      type: 'warning'
    })
    if (!confirmed) return

    try {
      const url = `/api/admin/gaia-kb?id=${id}`
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`删除成功！文档「${title}」已从盖亚知识库中移除。${data.deletedVectorChunks ? '已同时删除所有相关向量块。' : ''}`)
        await loadDocuments()
      } else {
        toast.error(`删除失败：${data.error || '未知错误'}`)
      }
    } catch {
      toast.error('删除失败：网络错误，请稍后重试。')
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedDocs.size === 0) {
      toast.warning('请先选择要删除的文档')
      return
    }

    const selectedDocsArray = Array.from(selectedDocs)
    const confirmed = await confirm({
      title: '确认操作',
      message: `确定要删除选中的 ${selectedDocs.size} 个文档吗？\n\n此操作不可撤销，删除后盖亚将无法再使用这些知识。`,
      type: 'warning'
    })
    if (!confirmed) return

    setDeleting(true)
    let successCount = 0
    let failCount = 0

    for (const docId of selectedDocsArray) {
      try {
        const response = await fetch(`/api/admin/gaia-kb?id=${docId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
      }
    }

    setDeleting(false)
    setSelectedDocs(new Set())

    if (failCount === 0) {
      toast.success(`批量删除成功！已删除 ${successCount} 个文档`)
    } else {
      toast.warning(`批量删除完成。成功: ${successCount} 个，失败: ${failCount} 个`)
    }

    await loadDocuments()
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(documents.map(d => d.id)))
    }
  }

  // 切换单个文档选择
  const toggleDocSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocs(newSelected)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    if (bytes < 0) return 'Invalid size'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)

    if (i < 0) return '0 B'
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/admin/courses')}
          className="mb-6 flex items-center text-purple-300 hover:text-purple-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回课程管理
        </button>

        {/* 页头 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">盖亚知识库管理</h1>
          <p className="mt-2 text-sm text-gray-400">
            上传文档到盖亚AI向量数据库，用于增强盖亚的知识能力
          </p>
        </div>

        {/* 上传表单 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-purple-400" />
            上传新文档
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                文件 *
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md"
                className="block w-full text-sm text-gray-300 border border-white/20 rounded-lg cursor-pointer bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30"
              />
              <p className="mt-1 text-xs text-gray-500">
                支持的格式: PDF, DOC, DOCX, TXT, MD
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                文档标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如: 盖亚系统使用指南"
                className="block w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {selectedFile && (
                  <span>
                    已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={uploading || !selectedFile || !title.trim()}
                className="btn-stardust px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    上传到盖亚
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 文档列表 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-400" />
              已上传文档 ({documents.length})
            </h2>
            {selectedDocs.size > 0 && (
              <button
                onClick={handleBatchDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    批量删除 ({selectedDocs.size})
                  </>
                )}
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p>还没有上传任何文档</p>
              <p className="text-sm mt-2 text-gray-500">上传文档后，盖亚AI将能够基于这些知识回答问题</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDocs.size === documents.length && documents.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      标题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      向量数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      上传时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {documents.map((doc) => {
                    const status = getDocumentStatus(doc)
                    const statusConfig = getStatusConfig(status)
                    const StatusIcon = statusConfig.icon

                    return (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={() => toggleDocSelection(doc.id)}
                          className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white line-clamp-2 max-w-xs">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {doc.metadata?.filename || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusConfig.bg} border ${statusConfig.border} w-fit`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
                          <span className={`text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {doc.metadata?.vector_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="text-red-400 hover:text-red-300 inline-flex items-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </button>
                      </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
