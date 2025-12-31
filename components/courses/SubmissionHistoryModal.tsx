// @ts-nocheck
'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { globalToast } from '@/components/ui/ToastProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Submission {
  id: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  score: number | null
  feedback: string | null
  created_at: string
  is_public: boolean | null
  attachments?: Array<{
    type: string
    url: string
    name?: string
  }>
}

interface SubmissionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  projectTitle?: string
  submissions: Submission[]
  loading: boolean
  onDelete: (submissionId: string, wasPublic: boolean) => Promise<void>
  onToggleVisibility: (submissionId: string, currentIsPublic: boolean | null) => Promise<void>
}

/**
 * 提交记录列表弹窗
 * 显示用户的提交历史，支持查看详情、删除、切换可见性
 */
export const SubmissionHistoryModal = memo(function SubmissionHistoryModal({
  isOpen,
  onClose,
  projectTitle,
  submissions,
  loading,
  onDelete,
  onToggleVisibility
}: SubmissionHistoryModalProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null)

  const handleDeleteClick = (submissionId: string) => {
    setDeletingSubmissionId(submissionId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingSubmissionId) return

    const submission = submissions.find(s => s.id === deletingSubmissionId)
    const wasPublic = submission?.is_public && submission?.score !== null && submission.score >= 90

    try {
      await onDelete(deletingSubmissionId, wasPublic || false)
      globalToast.success('删除成功')
    } catch (error) {
      globalToast.error('删除失败，请重试')
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingSubmissionId(null)
    }
  }

  const handleToggleVisibility = async (submissionId: string, currentIsPublic: boolean | null) => {
    setTogglingId(submissionId)
    try {
      await onToggleVisibility(submissionId, currentIsPublic)
    } finally {
      setTogglingId(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            onClose()
            setSelectedSubmission(null)
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-orange-500/30 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                {projectTitle ? `${projectTitle} - 提交记录` : '我的提交记录'}
              </h3>
              <button
                onClick={() => {
                  onClose()
                  setSelectedSubmission(null)
                }}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24">
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
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-orange-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* 状态标签 */}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            submission.status === 'approved'
                              ? 'bg-green-500/20 text-green-400'
                              : submission.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {submission.status === 'approved' ? '已批改' : submission.status === 'rejected' ? '已拒绝' : '待批改'}
                          </span>

                          {/* 评分 */}
                          {submission.score !== null && (
                            <span className="text-lg font-bold text-white">
                              {submission.score}/100
                            </span>
                          )}

                          {/* 提交时间 */}
                          <span className="text-sm text-gray-400">
                            {new Date(submission.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        {/* 提交内容预览 */}
                        <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                          {submission.content}
                        </p>

                        {/* 反馈（如果有） */}
                        {submission.feedback && (
                          <div className="mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <p className="text-sm text-gray-300 line-clamp-3">
                              <strong className="text-orange-400">反馈：</strong>
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
                        </div>
                        <button
                          onClick={() => handleToggleVisibility(submission.id, submission.is_public)}
                          disabled={togglingId === submission.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            togglingId === submission.id
                              ? 'opacity-50 cursor-not-allowed'
                              : (submission.is_public ?? false)
                              ? 'bg-emerald-500'
                              : 'bg-white/20'
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
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors text-white"
                      >
                        查看详情
                      </button>
                      <button
                        onClick={() => handleDeleteClick(submission.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-medium transition-colors text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* 提交详情弹窗 */}
      <AnimatePresence>
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSubmission(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-orange-500/30 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">提交详情</h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
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
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                </div>

                {/* 附件图片 */}
                {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">附件（{selectedSubmission.attachments.length}）</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedSubmission.attachments.map((attachment, index) => (
                        attachment.type === 'image' && (
                          <div
                            key={index}
                            className="relative group overflow-hidden rounded-lg border border-gray-700 hover:border-orange-500/50 transition-colors h-48"
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
                                  className="text-orange-400 text-xs hover:text-orange-300 transition-colors"
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
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                    </div>
                  </div>
                )}

                {/* 关闭按钮 */}
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all text-white"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setDeletingSubmissionId(null)
        }}
        onConfirm={confirmDelete}
        title="删除确认"
        message="确定要删除这条提交记录吗？"
      />
    </>
  )
})
