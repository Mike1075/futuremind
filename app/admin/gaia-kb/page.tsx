'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, Trash2, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface Document {
  id: string
  title: string
  metadata: {
    type: string
    custom_project_id: string
    filename: string
    file_size: number
    file_type: string
    uploaded_at: string
  }
  created_at: string
}

export default function GaiaKnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
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
      .single()

    if (!profile || !profile.role || !['teacher', 'principal'].includes(profile.role)) {
      router.push('/')
    }
  }

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/gaia-kb')
      const data = await response.json()

      if (data.documents) {
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('加载文档列表失败:', error)
      showMessage('error', '加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
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
      showMessage('error', '请选择文件并输入标题')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', title.trim())

      const response = await fetch('/api/admin/gaia-kb', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', `上传成功！项目ID: ${data.project_id}`)
        setSelectedFile(null)
        setTitle('')
        // 重置文件输入
        const fileInput = document.getElementById('file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        // 重新加载列表
        await loadDocuments()
      } else {
        showMessage('error', data.error || '上传失败')
      }
    } catch (error: any) {
      console.error('上传失败:', error)
      showMessage('error', error.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除文档"${title}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/gaia-kb?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showMessage('success', '删除成功')
        await loadDocuments()
      } else {
        const data = await response.json()
        showMessage('error', data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      showMessage('error', '删除失败')
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页头 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">盖亚知识库管理</h1>
          <p className="mt-2 text-sm text-gray-600">
            上传文档到盖亚AI向量数据库，用于增强盖亚的知识能力
          </p>
        </div>

        {/* 消息提示 */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* 上传表单 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-purple-600" />
            上传新文档
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件 *
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md"
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                支持的格式: PDF, DOC, DOCX, TXT, MD
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文档标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如: 盖亚系统使用指南"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedFile && (
                  <span>
                    已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={uploading || !selectedFile || !title.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              已上传文档 ({documents.length})
            </h2>
          </div>

          {documents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>还没有上传任何文档</p>
              <p className="text-sm mt-2">上传文档后，盖亚AI将能够基于这些知识回答问题</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      项目ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      标题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文件名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      大小
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上传时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          {doc.metadata?.custom_project_id || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.metadata?.filename || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.metadata?.file_size ? formatFileSize(doc.metadata.file_size) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
