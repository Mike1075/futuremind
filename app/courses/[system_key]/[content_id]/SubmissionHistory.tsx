// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'

interface Submission {
  id: string
  content: string
  feedback: string | null
  score: number | null
  submitted_at: string | null
  reviewed_at: string | null
  is_public: boolean | null
}

interface SubmissionHistoryProps {
  userId: string
  contentId: string
  onClose: () => void
  onVisibilityChanged?: () => void
}

export default function SubmissionHistory({
  userId,
  contentId,
  onClose,
  onVisibilityChanged
}: SubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('success')

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  const supabase = createClient()

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_submissions')
        .select('id, content, feedback, score, submitted_at, reviewed_at, is_public')
        .eq('user_id', userId)
        .eq('course_content_id', contentId)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      setSubmissions(data || [])
    } catch {
      // 静默处理错误
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (submissionId: string, currentIsPublic: boolean | null) => {
    setTogglingId(submissionId)
    try {
      // 将 null 视为 false (私密)
      const isCurrentlyPublic = currentIsPublic ?? false
      const targetState = !isCurrentlyPublic

      const requestBody = {
        submissionId,
        isPublic: targetState
      }

      const response = await fetch('/api/submissions/toggle-visibility', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '切换失败')
      }

      // 从服务器响应中获取实际保存的状态
      const result = await response.json()
      const actualIsPublic = result.isPublic

      // 使用服务器返回的实际值更新本地状态
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId
          ? { ...s, is_public: actualIsPublic }
          : s
      ))

      // 触发公开作业列表刷新
      if (onVisibilityChanged) {
        onVisibilityChanged()
      }
    } catch (err) {
      showToast(`操作失败：${err instanceof Error ? err.message : '请重试'}`, 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (submissionId: string) => {
    setDeletingId(submissionId)
    try {
      // 先获取被删除作业的信息，判断是否需要刷新公开列表
      const deletedSubmission = submissions.find(s => s.id === submissionId)
      const wasPublicSubmission = deletedSubmission &&
        deletedSubmission.is_public &&
        (deletedSubmission.score ?? 0) >= 85

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-submission`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: userId,
            submission_id: submissionId
          })
        }
      )

      if (!response.ok) {
        throw new Error('删除失败')
      }

      // 删除成功，从列表中移除
      setSubmissions(prev => prev.filter(s => s.id !== submissionId))
      setConfirmDeleteId(null)
      setExpandedId(null)

      // 如果删除的是公开的优秀作业，刷新公开作业列表
      if (wasPublicSubmission && onVisibilityChanged) {
        onVisibilityChanged()
      }
    } catch (err) {
      console.error('删除提交失败:', err)
      showToast('删除失败，请重试', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="card-glass rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* 头部 */}
        <div className="sticky top-0 bg-cosmic-void border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-h2 font-bold text-starlight">我的提交记录</h2>
            <p className="text-starlight-muted text-small mt-1">共 {submissions.length} 次提交</p>
          </div>
          <button
            onClick={onClose}
            className="text-starlight-muted hover:text-starlight transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">加载中...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">还没有提交记录</p>
              <p className="text-gray-500 text-sm mt-2">完成第一次作业提交后，记录会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="card-glass rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-colors"
                >
                  {/* 摘要行 */}
                  <div
                    onClick={() => toggleExpand(submission.id)}
                    className="p-5 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        {/* 分数徽章 */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                          <span className="text-white font-bold text-lg">{submission.score || 0}</span>
                        </div>

                        {/* 提交时间 */}
                        <div>
                          <p className="text-white font-medium">{formatDate(submission.submitted_at)}</p>
                        </div>
                      </div>

                      {/* 内容预览 */}
                      <p className="text-gray-400 text-sm line-clamp-2 ml-16">
                        {submission.content}
                      </p>
                    </div>

                    {/* 展开图标 */}
                    <svg
                      className={`w-6 h-6 text-gray-400 transition-transform ${
                        expandedId === submission.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* 展开的详细内容 */}
                  {expandedId === submission.id && (
                    <div className="border-t border-gray-700 p-5 space-y-4 bg-gray-800/30">
                      {/* 我的提交 */}
                      <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          我的提交
                        </h3>
                        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {submission.content}
                          </p>
                        </div>
                      </div>

                      {/* AI老师反馈 */}
                      <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                          AI老师的反馈
                        </h3>
                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/30 rounded-lg p-4">
                          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {submission.feedback || '暂无反馈'}
                          </p>
                        </div>
                      </div>

                      {/* 评估时间和操作按钮 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {submission.reviewed_at && (
                            <p className="text-sm text-gray-500">
                              评估时间: {formatDate(submission.reviewed_at)}
                            </p>
                          )}

                          {/* 公开/私密切换开关 - 始终显示 */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-starlight-muted">作业可见性:</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              (submission.is_public ?? false) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-starlight-muted'
                            }`}>
                              {(submission.is_public ?? false) ? '公开' : '私密'}
                            </span>
                          </div>
                          {/* 始终显示开关，不禁用 */}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(submission.id, submission.is_public)}
                            disabled={togglingId === submission.id}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 ${
                              (submission.is_public ?? false) ? 'bg-emerald-500' : 'bg-white/20'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                (submission.is_public ?? false) ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          {/* 分数不足时显示提示 */}
                          {(!submission.score || submission.score < 85) && (submission.is_public ?? false) && (
                            <span className="text-xs text-amber-400/80">
                              (分数未达85，暂不展示)
                            </span>
                          )}
                        </div>
                        </div>

                        {/* 删除按钮 */}
                        {confirmDeleteId === submission.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(submission.id)}
                              disabled={deletingId === submission.id}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {deletingId === submission.id ? '删除中...' : '确认删除'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deletingId === submission.id}
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmDeleteId(submission.id)
                            }}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-600/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            删除记录
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部关闭按钮 */}
        <div className="sticky bottom-0 bg-cosmic-void border-t border-white/10 p-6">
          <button
            onClick={onClose}
            className="btn-stardust w-full py-3 px-6 font-medium"
          >
            关闭
          </button>
        </div>
      </div>

      <Toast
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
