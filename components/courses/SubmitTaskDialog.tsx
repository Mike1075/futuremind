// @ts-nocheck
'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { globalToast } from '@/components/ui/ToastProvider'

interface SubmitTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  dayLabel: string | null
  projectId: string
  currentDayKey: string | null
  userId: string | null
  selectionId?: string
  onSuccess: (score: number, isPublic: boolean) => void
  supabase: any
}

export function SubmitTaskDialog({
  isOpen,
  onClose,
  dayLabel,
  projectId,
  currentDayKey,
  userId,
  selectionId,
  onSuccess,
  supabase
}: SubmitTaskDialogProps) {
  const [submissionContent, setSubmissionContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<any | null>(null)

  // 处理文件选择（自动压缩图片）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const filesArray = Array.from(e.target.files)
    e.target.value = ''
    const processedFiles: File[] = []

    for (const file of filesArray) {
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: file.type as any
          }
          const compressedFile = await imageCompression(file, options)
          const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type })
          processedFiles.push(renamedFile)
        } catch {
          processedFiles.push(file)
        }
      } else {
        processedFiles.push(file)
      }
    }

    setUploadedFiles(prev => [...prev, ...processedFiles])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitTask = async () => {
    if (!currentDayKey || !submissionContent.trim()) {
      globalToast.warning('请填写提交内容')
      return
    }

    if (!userId) {
      globalToast.warning('请先登录')
      return
    }

    try {
      setSubmitting(true)
      setUploading(true)

      // 上传文件
      const attachments: any[] = []
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await fetch('/api/submissions/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadResponse.ok) {
            const { fileUrl, fileName } = await uploadResponse.json()
            attachments.push({
              type: file.type.startsWith('image/') ? 'image' : 'file',
              url: fileUrl,
              name: fileName
            })
          }
        }
      }

      // 调用边缘函数进行评估
      const { data, error: functionError } = await supabase.functions.invoke('evaluate-pbl-task', {
        body: {
          user_id: userId,
          content_id: projectId,
          day_key: currentDayKey,
          submission_content: submissionContent,
          submission_type: 'project_deliverable',
          attachments,
          is_public: isPublic
        }
      })

      if (functionError) {
        throw functionError
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setSubmissionResult(data)
      onSuccess(data.evaluation?.score || 0, isPublic)

    } catch {
      globalToast.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSubmissionResult(null)
    setSubmissionContent('')
    setUploadedFiles([])
    setIsPublic(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full p-6 my-8 shadow-2xl">
        <h3 className="text-xl font-bold mb-4">{dayLabel ? `${dayLabel} - 提交任务` : '提交任务'}</h3>

        {!submissionResult && (
          <>
            <textarea
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="请描述你今天完成的任务和收获..."
              className="w-full h-40 bg-gray-800 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {/* 文件上传区域 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                上传附件（可选）
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-400">点击选择文件或拖拽到此处</p>
                    <p className="text-xs text-gray-500 mt-1">支持图片、文档等文件</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* 已选择的文件列表 */}
            {uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-400">已选择的文件：</p>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-3 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                      disabled={uploading}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 上传进度提示 */}
            {uploading && (
              <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="animate-spin h-5 w-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-blue-400 font-medium">正在上传文件并等待AI批改...</p>
                </div>
                <p className="text-xs text-blue-300/80 ml-8">
                  ⏳ 请耐心等待，不要关闭对话框，大约需要 30 秒左右
                </p>
              </div>
            )}

            {/* 公开/私密选项 */}
            <div className="mb-4 bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-starlight mb-1">作业可见性</h4>
                  <p className="text-xs text-starlight-muted">
                    {isPublic
                      ? '你的作业将对其他同学公开展示（需评分≥85分）'
                      : '你的作业仅自己和老师可见'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${
                    isPublic ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded ${
                  isPublic ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-starlight-muted'
                }`}>
                  {isPublic ? '公开' : '私密'}
                </span>
              </div>
            </div>

            {/* 隐私警告 */}
            {isPublic && (
              <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-blue-400 mb-1">隐私提示</h5>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• 仅评分达到85分及以上的作业会被公开展示</li>
                      <li>• 展示内容包括：你的姓名、作业内容和提交时间</li>
                      <li>• 老师可以隐藏任何不适当的公开作业</li>
                      <li>• 你可以随时将作业改为私密状态</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmitTask}
                disabled={submitting || !submissionContent.trim() || uploading}
                className="btn-stardust flex-1 px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? '上传中...' : submitting ? '提交中...' : '确认提交'}
              </button>
              <button
                onClick={handleClose}
                disabled={submitting || uploading}
                className="btn-stardust px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>
          </>
        )}

        {/* AI评估结果 */}
        {submissionResult?.evaluation && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">提交成功！</h4>
                <p className="text-sm text-gray-400">AI助教已完成批改</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-blue-400">评分</h5>
                <span className="text-2xl font-bold text-white">
                  {submissionResult.evaluation.score || '-'}/100
                </span>
              </div>

              {submissionResult.evaluation.feedback && (
                <div className="mt-4">
                  <h5 className="font-semibold text-purple-400 mb-2">反馈意见</h5>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {submissionResult.evaluation.feedback}
                  </p>
                </div>
              )}

              {submissionResult.evaluation.suggestions && (
                <div className="mt-4">
                  <h5 className="font-semibold text-green-400 mb-2">改进建议</h5>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {submissionResult.evaluation.suggestions}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleClose}
              className="btn-stardust w-full px-4 py-2 font-medium"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
