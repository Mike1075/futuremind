// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { globalToast } from '@/components/ui/ToastProvider'

interface PBLSubmissionsHistoryProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectTitle: string
  dayKey: string | null
  dayLabel: string | null
  selectionId?: string
  onVisibilityChanged: () => void
}

export function PBLSubmissionsHistory({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  dayKey,
  dayLabel,
  selectionId,
  onVisibilityChanged
}: PBLSubmissionsHistoryProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // 加载提交记录
  useEffect(() => {
    if (isOpen && dayKey) {
      fetchSubmissions()
    }
  }, [isOpen, dayKey])

  const fetchSubmissions = async () => {
    if (!dayKey) return
    setLoading(true)
    try {
      const response = await fetch(`/api/submissions?contentId=${projectId}&dayKey=${encodeURIComponent(dayKey)}`)
      if (response.ok) {
        const { submissions: data } = await response.json()
        setSubmissions(data || [])
      }
    } catch {
      // 静默处理错误
    } finally {
      setLoading(false)
    }
  }

  // 删除提交记录
  const handleDelete = async (submissionId: string) => {
    const deletedSubmission = submissions.find(s => s.id === submissionId)
    const wasPublic = deletedSubmission?.is_public && deletedSubmission?.score >= 85

    try {
      const response = await fetch(`/api/submissions?id=${submissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const newSubmissions = submissions.filter(s => s.id !== submissionId)
        setSubmissions(newSubmissions)

        if (wasPublic) {
          onVisibilityChanged()
        }

        // 如果删除后没有更多记录，清除该天的进度
        if (newSubmissions.length === 0 && dayKey && selectionId) {
          try {
            await fetch('/api/pbl/clear-day-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ selectionId, dayKey })
            })
            router.refresh()
          } catch {
            // 静默处理
          }
        }

        globalToast.success('删除成功')
      } else {
        const error = await response.json()
        globalToast.error(`删除失败: ${error.error || '请重试'}`)
      }
    } catch {
      globalToast.error('删除失败，请重试')
    }
  }

  // 切换可见性
  const handleToggleVisibility = async (submissionId: string, currentIsPublic: boolean | null) => {
    setTogglingId(submissionId)
    try {
      const isCurrentlyPublic = currentIsPublic ?? false

      const response = await fetch('/api/submissions/toggle-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          isPublic: !isCurrentlyPublic
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '切换失败')
      }

      const result = await response.json()
      const actualIsPublic = result.isPublic

      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, is_public: actualIsPublic } : s
      ))

      onVisibilityChanged()
    } catch (err) {
      globalToast.error(`操作失败：${err instanceof Error ? err.message : '请重试'}`)
    } finally {
      setTogglingId(null)
    }
  }

  const handleClose = () => {
    setSelectedSubmission(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* 提交记录列表弹窗 */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              {dayLabel ? `${projectTitle} - ${dayLabel} - 提交记录` : '我的提交记录'}
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}

          {/* 空状态 */}
          {!loading && submissions.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>还没有提交记录</p>
            </div>
          )}

          {/* 提交记录列表 */}
          {!loading && submissions.length > 0 && (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          submission.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : submission.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {submission.status === 'approved' ? '已批改' : submission.status === 'rejected' ? '已拒绝' : '待批改'}
                        </span>

                        {submission.score !== null && (
                          <span className="text-lg font-bold text-white">
                            {submission.score}/100
                          </span>
                        )}

                        <span className="text-sm text-gray-400">
                          {new Date(submission.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                        {submission.content}
                      </p>

                      {submission.feedback && (
                        <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-gray-300 line-clamp-3">
                            <strong className="text-blue-400">反馈：</strong>
                            {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 公开/私密切换 */}
                  {submission.status === 'approved' && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-starlight-muted">作业可见性:</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          (submission.is_public ?? false) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-starlight-muted'
                        }`}>
                          {(submission.is_public ?? false) ? '公开' : '私密'}
                        </span>
                        {(!submission.score || submission.score < 85) && (submission.is_public ?? false) && (
                          <span className="text-xs text-amber-400/80">
                            (分数未达85，暂不展示)
                          </span>
                        )}
                      </div>
                      <button
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
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="btn-stardust flex-1 px-4 py-2 text-sm font-medium"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(submission.id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-medium transition-colors text-red-400"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 提交详情弹窗 */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">提交详情</h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 评分和状态 */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-800">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">评分</p>
                  <p className="text-3xl font-bold text-white">
                    {selectedSubmission.score !== null ? `${selectedSubmission.score}/100` : '未评分'}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">状态</p>
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    selectedSubmission.status === 'approved'
                      ? 'bg-green-500/20 text-green-400'
                      : selectedSubmission.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {selectedSubmission.status === 'approved' ? '已批改' : selectedSubmission.status === 'rejected' ? '已拒绝' : '待批改'}
                  </span>
                </div>
              </div>

              {/* 提交时间 */}
              <div>
                <p className="text-sm text-gray-400 mb-1">提交时间</p>
                <p className="text-white">{new Date(selectedSubmission.created_at).toLocaleString('zh-CN')}</p>
              </div>

              {/* 提交内容 */}
              <div>
                <p className="text-sm text-gray-400 mb-2">提交内容</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.content}</p>
                </div>
              </div>

              {/* 附件图片 */}
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">附件（{selectedSubmission.attachments.length}）</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedSubmission.attachments.map((attachment: any, index: number) => (
                      attachment.type === 'image' && (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-lg border border-gray-700 hover:border-blue-500/50 transition-colors h-48"
                        >
                          <Image
                            src={attachment.url}
                            alt={attachment.name || `图片 ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white text-sm truncate">{attachment.name || `图片 ${index + 1}`}</p>
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                              >
                                查看原图 →
                              </a>
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 反馈 */}
              {selectedSubmission.feedback && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">AI反馈</p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn-stardust w-full px-6 py-3 font-semibold"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            handleDelete(deleteConfirmId)
            setDeleteConfirmId(null)
          }
        }}
        title="确认删除"
        message="确定要删除这条提交记录吗？删除后无法恢复。"
        confirmText="确认删除"
        cancelText="取消"
        type="warning"
      />
    </>
  )
}
