'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  id: string
  content: string
  feedback: string
  score: number
  consciousness_growth_points: number
  submitted_at: string
  reviewed_at: string
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

  const supabase = createClient()

  useEffect(() => {
    loadSubmissions()
  }, [])

  const loadSubmissions = async () => {
    try {
      const { data, error } = await (supabase
        .from('user_submissions') as any)
        .select('id, content, feedback, score, consciousness_growth_points, submitted_at, reviewed_at')
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

  const formatDate = (dateString: string) => {
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
                          <span className="text-white font-bold text-lg">{submission.score}</span>
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

                      {/* 评估时间 */}
                      {submission.reviewed_at && (
                        <p className="text-sm text-gray-500 text-right">
                          评估时间: {formatDate(submission.reviewed_at)}
                        </p>
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
