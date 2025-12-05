// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'

// 动态导入 ViewProfileModal 避免 SSR 问题
const ViewProfileModal = dynamic(() => import('@/components/ViewProfileModal'), { ssr: false })

interface Attachment {
  type: string
  url: string
  name: string
}

interface PublicSubmission {
  id: string
  content: string
  attachments: Attachment[] | null
  score: number
  feedback: string | null
  submittedAt: string
  studentId: string
  studentName: string
}

interface PublicSubmissionsProps {
  contentId: string
  limit?: number
  refreshKey?: number
}

export function PublicSubmissions({ contentId, limit = 20, refreshKey }: PublicSubmissionsProps) {
  const [submissions, setSubmissions] = useState<PublicSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<PublicSubmission | null>(null)
  // 查看用户资料
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchPublicSubmissions()
  }, [contentId, limit, refreshKey])

  const fetchPublicSubmissions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/submissions/public?contentId=${contentId}&limit=${limit}`)

      if (!response.ok) {
        throw new Error('Failed to fetch public submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (err) {
      console.error('Error fetching public submissions:', err)
      setError('加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-starlight-muted">加载优秀作业中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-starlight-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-starlight-muted text-h3">暂无公开的优秀作业</p>
        <p className="text-starlight-dim text-small mt-2">评分≥90分的作业将在这里展示</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 标题 - 居中显示 */}
      <div className="flex flex-col items-center justify-center gap-3 mb-6">
        {/* 星星图标 - 炫彩边框 */}
        <div className="relative">
          <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 animate-spin-slow opacity-75 blur-[2px]"></div>
          <div className="relative flex items-center justify-center w-10 h-10 bg-black rounded-xl">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-starlight">优秀作业展示</h3>
          <p className="text-xs text-starlight-muted">来自同学们的优秀作品（评分≥90分）</p>
        </div>
      </div>

      {/* 作业列表 - 居中显示，最多4列 */}
      <div className="flex flex-wrap justify-center gap-3">
        {submissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card-glass p-3 hover:border-orange-500/50 transition-all w-[calc(50%-6px)] md:w-[calc(33.333%-8px)] lg:w-[calc(25%-9px)] max-w-[280px]"
          >
            {/* 头部：学生信息和评分 */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {/* 用户头像 - 可点击查看资料 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setViewingUserId(submission.studentId)
                  }}
                  className="relative group cursor-pointer"
                  title="点击查看资料"
                >
                  <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-75 blur-[2px] group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-xs">
                      {submission.studentName.charAt(0)}
                    </span>
                  </div>
                </button>
                <div className="min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setViewingUserId(submission.studentId)
                    }}
                    className="font-medium text-starlight text-xs truncate hover:text-purple-300 transition-colors cursor-pointer"
                    title="点击查看资料"
                  >
                    {submission.studentName}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-orange-500/20 px-1.5 py-0.5 rounded">
                <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-orange-400 font-bold text-xs">{submission.score}</span>
              </div>
            </div>

            {/* 作业内容 - 限制高度 */}
            <div className="mb-2">
              <p className="text-starlight text-xs leading-relaxed line-clamp-3">
                {submission.content}
              </p>
            </div>

            {/* 附件图片（如果有）- 缩小尺寸 */}
            {submission.attachments && submission.attachments.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {submission.attachments.filter(att => att.type === 'image').slice(0, 2).map((attachment, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded overflow-hidden bg-cosmic-void border border-white/10"
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 15vw"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 底部：时间和查看详情按钮 */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <p className="text-[10px] text-starlight-dim truncate">{formatDate(submission.submittedAt)}</p>
              <button
                onClick={() => setSelectedSubmission(submission)}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <span>查看详情</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 用户头像 - 可点击查看资料 */}
                  <button
                    onClick={() => setViewingUserId(selectedSubmission.studentId)}
                    className="relative group cursor-pointer"
                    title="点击查看资料"
                  >
                    <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-75 blur-[2px] group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">
                        {selectedSubmission.studentName.charAt(0)}
                      </span>
                    </div>
                  </button>
                  <div>
                    <button
                      onClick={() => setViewingUserId(selectedSubmission.studentId)}
                      className="font-medium text-starlight hover:text-purple-300 transition-colors cursor-pointer"
                      title="点击查看资料"
                    >
                      {selectedSubmission.studentName}
                    </button>
                    <p className="text-xs text-starlight-muted">{formatDate(selectedSubmission.submittedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* 分数 */}
                  <div className="flex items-center gap-1 bg-orange-500/20 px-3 py-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-orange-400 font-bold">{selectedSubmission.score}</span>
                  </div>
                  {/* 关闭按钮 */}
                  <button
                    onClick={() => setSelectedSubmission(null)}
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5 text-starlight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 作业内容 */}
                <div>
                  <h4 className="text-sm font-semibold text-starlight mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    作业内容
                  </h4>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-starlight whitespace-pre-wrap leading-relaxed">
                      {selectedSubmission.content}
                    </p>
                  </div>
                </div>

                {/* 附件图片 */}
                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-starlight mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      附件图片
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedSubmission.attachments.filter(att => att.type === 'image').map((attachment, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-cosmic-void border border-white/10">
                            <Image
                              src={attachment.url}
                              alt={attachment.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                            />
                          </div>
                          {/* 查看原图链接 */}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                          >
                            <span>查看原图</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI 点评 */}
                <div>
                  <h4 className="text-sm font-semibold text-starlight mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    AI 导师点评
                  </h4>
                  <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-starlight whitespace-pre-wrap leading-relaxed">
                      {selectedSubmission.feedback || '暂无点评'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 弹窗底部 */}
              <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-4">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="btn-stardust w-full py-3 font-medium"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 查看用户资料弹窗 */}
      {viewingUserId && (
        <ViewProfileModal
          isOpen={!!viewingUserId}
          onClose={() => setViewingUserId(null)}
          userId={viewingUserId}
        />
      )}
    </div>
  )
}
