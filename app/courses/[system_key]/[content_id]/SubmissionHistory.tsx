'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  id: string
  content: string
  feedback: string | null
  score: number | null
  consciousness_growth_points: number | null
  submitted_at: string | null
  reviewed_at: string | null
  is_public: boolean | null
}

interface SubmissionHistoryProps {
  userId: string
  contentId: string
  onClose: () => void
}

export default function SubmissionHistory({
  userId,
  contentId,
  onClose
}: SubmissionHistoryProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_submissions')
        .select('id, content, feedback, score, consciousness_growth_points, submitted_at, reviewed_at, is_public')
        .eq('user_id', userId)
        .eq('course_content_id', contentId)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      setSubmissions(data || [])
    } catch (err) {
      console.error('加载提交历史失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async (submissionId: string, currentIsPublic: boolean | null) => {
    setTogglingId(submissionId)
    try {
      // 将 null 视为 false (私密)
      const isCurrentlyPublic = currentIsPublic ?? false

      const response = await fetch('/api/submissions/toggle-visibility', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          isPublic: !isCurrentlyPublic
        })
      })

      if (!response.ok) {
        throw new Error('切换失败')
      }

      // 更新本地状态
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId
          ? { ...s, is_public: !isCurrentlyPublic }
          : s
      ))
    } catch (err) {
      console.error('切换作业可见性失败:', err)
      alert('操作失败，请重试')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (submissionId: string, growthPoints: number | null) => {
    setDeletingId(submissionId)
    try {
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
    } catch (err) {
      console.error('删除提交失败:', err)
      alert('删除失败，请重试')
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
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* 头部 */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">我的提交记录</h2>
            <p className="text-gray-400 text-sm mt-1">共 {submissions.length} 次提交</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
                  className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
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

                        {/* 时间和成长点 */}
                        <div>
                          <p className="text-white font-medium">{formatDate(submission.submitted_at)}</p>
                          <p className="text-sm text-gray-400">
                            意识成长点数: +{submission.consciousness_growth_points || 0}
                          </p>
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

                      {/* AI导师反馈 */}
                      <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                          AI导师的反馈
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

                          {/* 公开/私密切换开关 */}
                          {submission.score && submission.score >= 80 && (
                            <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-gray-300">作业可见性</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(submission.id, submission.is_public)}
                                disabled={togglingId === submission.id}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                                  (submission.is_public ?? false) ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    (submission.is_public ?? false) ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                              <span className={`text-xs font-medium ${
                                (submission.is_public ?? false) ? 'text-blue-400' : 'text-gray-400'
                              }`}>
                                {togglingId === submission.id ? '切换中...' : ((submission.is_public ?? false) ? '公开' : '私密')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 删除按钮 */}
                        {confirmDeleteId === submission.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(submission.id, submission.consciousness_growth_points)}
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

                      {/* 删除警告提示 */}
                      {confirmDeleteId === submission.id && submission.consciousness_growth_points != null && submission.consciousness_growth_points > 0 && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-yellow-400 font-semibold mb-1">谨慎删除</p>
                              <p className="text-yellow-200 text-sm">
                                删除此提交将扣除 <strong>{submission.consciousness_growth_points}</strong> 点意识成长点数，此操作不可撤销！
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部关闭按钮 */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
