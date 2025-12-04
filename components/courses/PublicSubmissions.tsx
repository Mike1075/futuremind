// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

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
  submittedAt: string
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

      {/* 作业列表 - 4列显示，缩小尺寸 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {submissions.map((submission, index) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="card-glass p-3 hover:border-orange-500/50 transition-all"
          >
            {/* 头部：学生信息和评分 */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {/* 用户头像 - 炫彩边框 + 蓝色首字母 */}
                <div className="relative">
                  <div className="absolute -inset-[1.5px] rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-spin-slow"></div>
                  <div className="relative w-7 h-7 bg-transparent rounded-full flex items-center justify-center border border-transparent">
                    <span className="text-blue-400 font-bold text-xs">
                      {submission.studentName.charAt(0)}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-starlight text-xs truncate">{submission.studentName}</p>
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

            {/* 提交时间 */}
            <p className="text-[10px] text-starlight-dim mt-2 truncate">{formatDate(submission.submittedAt)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
