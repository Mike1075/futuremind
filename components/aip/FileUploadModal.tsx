'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Trash2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  title: string
}

interface ProjectDocument {
  id: string
  project_id: string | null
  user_id: string | null
  organization_id: string | null
  title: string | null
  content: string
  metadata: any
  created_at: string | null
}

export function FileUploadModal({ projectId, onClose, onSuccess }: FileUploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [existingDocuments, setExistingDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [isManager, setIsManager] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
    loadDocuments()
  }, [projectId])

  const loadUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    const { data: membership } = await supabase
      .from('project_members')
      .select('role_in_project')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    setIsManager(membership?.role_in_project === 'manager' || membership?.role_in_project === 'owner')
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error} = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setExistingDocuments(data || [])
    } catch (err) {
      console.error('加载文档失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('word')) return '📝'
    if (type === 'text/plain') return '📰'
    return '📁'
  }

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      return '不支持的文件类型。请上传PDF、图片、Word文档或文本文件。'
    }
    if (file.size > 50 * 1024 * 1024) {
      return '文件大小不能超过50MB'
    }
    return null
  }

  const handleFiles = useCallback((files: FileList) => {
    const newFiles: UploadFile[] = []

    Array.from(files).forEach(file => {
      const error = validateFile(file)
      newFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error ?? undefined,
        title: file.name
      })
    })

    setUploadFiles(prev => [...prev, ...newFiles])
  }, [])

  const uploadFile = async (uploadFile: UploadFile) => {
    if (!userId) {
      console.error('用户未登录')
      return
    }

    try {
      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      // 模拟进度
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f =>
          f.id === uploadFile.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        ))
      }, 300)

      // 直接上传二进制文件到N8N webhook（匹配参考实现）
      // N8N webhook期望 multipart/form-data 格式的二进制文件
      const formData = new FormData()
      formData.append('file', uploadFile.file)  // 二进制文件
      formData.append('project_id', projectId)
      formData.append('user_id', userId)
      formData.append('title', uploadFile.title)

      console.log('[FileUpload] 上传二进制文件到N8N webhook:', {
        filename: uploadFile.file.name,
        size: uploadFile.file.size,
        type: uploadFile.file.type,
        project_id: projectId,
        user_id: userId,
        title: uploadFile.title
      })

      const n8nResponse = await fetch('https://n8n.aifunbox.com/webhook/upload-document', {
        method: 'POST',
        // 不设置 Content-Type header，让浏览器自动设置为 multipart/form-data
        body: formData
      })

      clearInterval(progressInterval)

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text()
        console.error('[FileUpload] N8N处理失败:', n8nResponse.status, errorText)
        throw new Error(`N8N处理失败: ${n8nResponse.status} ${errorText}`)
      }

      const responseData = await n8nResponse.json()
      console.log('[FileUpload] N8N处理成功:', responseData)

      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'success', progress: 100 }
          : f
      ))

      // 重新加载文档列表（N8N会自动保存到documents表）
      loadDocuments()
    } catch (error) {
      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? {
              ...f,
              status: 'error',
              progress: 0,
              error: error instanceof Error ? error.message : '上传失败'
            }
          : f
      ))
    }
  }

  const startUpload = () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending')
    pendingFiles.forEach(uploadFile)
  }

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateFileTitle = (id: string, newTitle: string) => {
    setUploadFiles(prev => prev.map(f =>
      f.id === id ? { ...f, title: newTitle } : f
    ))
  }

  const handleDeleteDocument = async (doc: ProjectDocument) => {
    // 防止删除项目智慧库
    if (doc.title === '项目智慧库') {
      alert('项目智慧库不能被删除')
      return
    }

    // 权限检查：项目经理或文档创建者可以删除
    const canDelete = isManager || doc.user_id === userId

    if (!canDelete) {
      alert('您没有权限删除此文档')
      return
    }

    if (!confirm(`确定要删除文档"${doc.title}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      const supabase = createClient()

      // 从数据库删除记录
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id)

      if (dbError) throw dbError

      alert('文档删除成功')
      loadDocuments()
    } catch (error) {
      console.error('删除文档失败:', error)
      alert('删除文档失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 下载文本文档（documents表仅存储文本内容）
  const handleDownloadDocument = async (doc: ProjectDocument) => {
    try {
      // 创建一个文本文件并下载
      const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.title}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载文档失败:', error)
      alert('下载文档失败')
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const allCompleted = uploadFiles.length > 0 && uploadFiles.every(f => f.status === 'success' || f.status === 'error')
  const hasSuccess = uploadFiles.some(f => f.status === 'success')

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">上传文档</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Documents */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              项目文档
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                <span className="ml-2 text-zinc-400">加载中...</span>
              </div>
            ) : existingDocuments.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                <p>此项目暂无文档</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {existingDocuments.map((doc) => {
                  const isKnowledgeBase = doc.title === '项目智慧库'
                  const contentLength = doc.content?.length || 0
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-lg">{isKnowledgeBase ? '📚' : '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>{contentLength} 字符</span>
                          <span>•</span>
                          <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('zh-CN') : '未知日期'}</span>
                          {isKnowledgeBase && (
                            <>
                              <span>•</span>
                              <span className="text-blue-400">系统默认</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isKnowledgeBase && (isManager || doc.user_id === userId) && (
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-1 hover:bg-zinc-700 rounded text-red-400 hover:text-red-300"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-zinc-800 mb-6"></div>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
              isDragging
                ? 'border-blue-400 bg-blue-500/10'
                : 'border-zinc-700 hover:border-blue-500'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <Upload className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              拖拽文件到此处或点击选择
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              支持 PDF、图片、Word文档、文本文件 (最大50MB)
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
              onChange={onFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
            >
              <File className="h-4 w-4" />
              选择文件
            </label>
          </div>

          {/* File List */}
          {uploadFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-white">
                文件列表 ({uploadFiles.length})
              </h3>

              {uploadFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-4 border border-zinc-800 rounded-lg bg-zinc-800/30"
                >
                  <span className="text-2xl">{getFileIcon(uploadFile.file.type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <p className="text-xs text-zinc-500 mb-1">文件名: {uploadFile.file.name}</p>
                      <input
                        type="text"
                        value={uploadFile.title}
                        onChange={(e) => updateFileTitle(uploadFile.id, e.target.value)}
                        placeholder="输入文档标题..."
                        disabled={uploadFile.status === 'uploading' || uploadFile.status === 'success'}
                        className="w-full px-2 py-1 text-sm bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                    <p className="text-sm text-zinc-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {/* Progress Bar */}
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                          <span>上传中...</span>
                          <span>{uploadFile.progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${uploadFile.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {uploadFile.status === 'error' && (
                      <p className="text-sm text-red-400 mt-1">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>

                  {/* Status Icons */}
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}

                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-zinc-800">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors">
            {allCompleted ? '完成' : '取消'}
          </button>

          {!allCompleted && (
            <button
              onClick={startUpload}
              disabled={uploadFiles.filter(f => f.status === 'pending').length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              开始上传 ({uploadFiles.filter(f => f.status === 'pending').length})
            </button>
          )}

          {allCompleted && hasSuccess && (
            <button
              onClick={() => {
                onSuccess()
                onClose()
              }}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              刷新文档列表
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
