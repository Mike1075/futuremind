// @ts-nocheck
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Trash2, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

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

interface ProjectFile {
  id: string
  project_id: string
  user_id: string
  title: string
  file_name: string
  file_size: number
  file_type: string
  created_at: string
  review_status?: 'pending' | 'approved' | 'rejected' | string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comment?: string | null
  uploader?: {
    id?: string
    full_name: string | null
  } | null
}

export function FileUploadModal({ projectId, onClose, onSuccess }: FileUploadModalProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [existingDocuments, setExistingDocuments] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [isManager, setIsManager] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Toast 状态
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success')

  // ConfirmDialog 状态
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title)
    setConfirmMessage(message)
    setConfirmCallback(() => onConfirm)
    setConfirmOpen(true)
  }

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

      // 从 project_files 表查询原始上传文件
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 如果有数据，单独获取上传者信息
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(d => d.user_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const docsWithUploader = data.map(doc => ({
          ...doc,
          uploader: profiles?.find(p => p.id === doc.user_id) || null
        }))
        setExistingDocuments(docsWithUploader)
      } else {
        setExistingDocuments([])
      }
    } catch (err) {
      console.error('加载文档失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 知识库只支持文本类文档（用于AI检索），不支持图片
  const acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return '📄'
    if (type.includes('word')) return '📝'
    if (type === 'text/plain') return '📰'
    return '📁'
  }

  const validateFile = (file: File) => {
    // 检查是否是图片类型，给出特定提示
    if (file.type.startsWith('image/')) {
      return '知识库暂不支持图片上传。如需分享图片作品，请使用「成果展示」功能。'
    }
    if (!acceptedTypes.includes(file.type)) {
      return '不支持的文件类型。请上传PDF、Word文档或文本文件。'
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

    const supabase = createClient()

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

      // 调用后端API代理（避免CORS问题）
      const n8nResponse = await fetch('/api/aip/upload-document', {
        method: 'POST',
        // 不设置 Content-Type header，让浏览器自动设置为 multipart/form-data
        body: formData
      })

      clearInterval(progressInterval)

      // 后端API响应处理
      const responseData = await n8nResponse.json()

      if (!n8nResponse.ok) {
        throw new Error(responseData.error || `上传失败: ${n8nResponse.status}`)
      }

      setUploadFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'success', progress: 100 }
          : f
      ))

      // 重新加载文档列表
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

  const handleDeleteDocument = async (doc: any) => {
    const docTitle = doc.title || '未命名文档'

    // 权限检查：必须登录，且是项目经理或文档创建者才能删除
    if (!userId) {
      showToast('请先登录', 'warning')
      return
    }

    const isOwnDocument = doc.user_id && userId && doc.user_id === userId
    const canDelete = isManager || isOwnDocument

    if (!canDelete) {
      showToast('您没有权限删除此文档', 'warning')
      return
    }

    showConfirm('删除确认', `确定要删除文档"${docTitle}"吗？此操作不可撤销。`, async () => {
      try {
        const supabase = createClient()

        // 1. 删除 project_files 记录
        const { error: fileError, count } = await supabase
          .from('project_files')
          .delete()
          .eq('id', doc.id)
          .select()

        if (fileError) throw fileError

        // 检查是否真的删除了数据（RLS 可能静默阻止删除）
        if (count === 0) {
          throw new Error('删除失败：可能没有权限删除此文档')
        }

        // 2. 删除对应的 document_chunks（知识库分块）
        // 使用 RPC 调用来执行复杂的删除逻辑
        // 注意：RPC 返回 void，即使成功也可能有 error 对象，需要检查具体错误
        const { error: chunksError } = await supabase.rpc('delete_document_chunks_by_title', {
          p_title: docTitle,
          p_project_id: projectId
        })

        // 只有当 chunksError 真的是错误时才处理
        if (chunksError && chunksError.code && chunksError.code !== 'PGRST116') {
          console.warn('RPC 删除 document_chunks 警告:', chunksError)
          // 备用方案：直接删除
          const { error: fallbackError } = await supabase
            .from('document_chunks')
            .delete()
            .eq('metadata->>title', docTitle)
            .eq('project_id', projectId)

          if (fallbackError) {
            console.warn('备用删除 document_chunks 警告:', fallbackError)
          }
        }

        // 3. 删除对应的 documents（父文档）- 使用更简单的查询
        const { error: docsError } = await supabase
          .from('documents')
          .delete()
          .eq('title', docTitle)
          .eq('project_id', projectId)

        if (docsError && docsError.code !== 'PGRST116') {
          console.warn('删除 documents 警告:', docsError)
        }

        showToast('文档删除成功', 'success')
        loadDocuments()
        // 通知父页面刷新文档列表
        onSuccess()
      } catch (error) {
        console.error('删除文档失败:', error)
        showToast('删除文档失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
      }
    })
  }

  // 下载功能暂不可用（project_files 只存储元数据，原文件已被处理为知识库分块）
  const handleDownloadDocument = async (doc: ProjectFile) => {
    showToast('下载功能暂不可用。文档已被处理为知识库内容，原文件不再保留。', 'info')
  }

  // 获取审核状态标签
  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">待审核</span>
      case 'approved':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">已通过</span>
      case 'rejected':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">已拒绝</span>
      default:
        return null
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
    // 重置 input 值，允许再次选择相同的文件
    e.target.value = ''
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
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-400" />
              项目文档
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : existingDocuments.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-2" />
                <p>此项目暂无文档</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {existingDocuments.map((doc: ProjectFile) => {
                  const uploaderName = doc.uploader?.full_name || '未知用户'
                  const fileSize = doc.file_size ? (doc.file_size / 1024).toFixed(1) + ' KB' : '未知'
                  const fileIcon = doc.file_type?.includes('pdf') ? '📄' :
                                   doc.file_type?.includes('word') ? '📝' : '📰'
                  const isOwnFile = !!(doc.user_id && userId && doc.user_id === userId)
                  const isPending = doc.review_status === 'pending'
                  const isRejected = doc.review_status === 'rejected'

                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isPending ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        isRejected ? 'bg-red-500/10 border border-red-500/30' :
                        'bg-zinc-800/50 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{fileIcon}</span>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="font-medium text-white truncate max-w-[200px]" title={doc.title}>{doc.title}</p>
                          <span className="flex-shrink-0">{getStatusBadge(doc.review_status)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>{uploaderName}</span>
                          <span>•</span>
                          <span>{fileSize}</span>
                          <span>•</span>
                          <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('zh-CN') : '未知日期'}</span>
                        </div>
                        {/* 显示拒绝原因 */}
                        {isRejected && doc.review_comment && (
                          <p className="text-xs text-red-400 mt-1">拒绝原因：{doc.review_comment}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {/* 删除按钮 - 管理员或自己的文件可删除（必须已登录） */}
                        {userId && (isManager || isOwnFile) && (
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-2 hover:bg-zinc-700 rounded text-red-400 hover:text-red-300"
                            title="删除"
                          >
                            <Trash2 className="h-5 w-5" />
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
              上传文档到项目知识库
            </h3>
            <p className="text-sm text-zinc-500 mb-2">
              支持 PDF、Word文档、文本文件 (最大50MB)
            </p>
            <p className="text-xs text-zinc-600 mb-4">
              上传的文档将用于AI智能问答，暂不支持图片
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
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
          <button
            onClick={() => {
              // 如果有成功上传的文件，关闭时也刷新主页面
              if (hasSuccess) {
                onSuccess()
              }
              onClose()
            }}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          >
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
        </div>
      </div>

      {/* Toast */}
      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type={toastType}
      />

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (confirmCallback) confirmCallback()
          setConfirmOpen(false)
        }}
        title={confirmTitle}
        message={confirmMessage}
      />
    </div>
  )
}
