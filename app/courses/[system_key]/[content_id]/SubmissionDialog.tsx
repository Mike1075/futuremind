'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubmissionDialogProps {
  userId: string
  contentId: string
  contentTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function SubmissionDialog({
  userId,
  contentId,
  contentTitle,
  onClose,
  onSuccess
}: SubmissionDialogProps) {
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionType, setSubmissionType] = useState<'reflection' | 'assignment'>('reflection')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      setError('请输入作业内容')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 调用边缘函数进行评估
      const { data, error: functionError } = await supabase.functions.invoke('evaluate-submission', {
        body: {
          user_id: userId,
          content_id: contentId,
          submission_content: submissionContent,
          submission_type: submissionType
        }
      })

      if (functionError) {
        throw functionError
      }

      if (data.error) {
        throw new Error(data.error)
      }

      // 显示评估结果
      setResult(data)

      // 延迟关闭，让用户看到结果
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 5000)

    } catch (err) {
      console.error('提交作业失败:', err)
      setError(err instanceof Error ? err.message : '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* 头部 */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">提交作业</h2>
            <p className="text-gray-400 text-sm mt-1">{contentTitle}</p>
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
        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* 作业类型选择 */}
              <div>
                <label className="block text-white font-medium mb-3">作业类型</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setSubmissionType('reflection')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all
                      ${submissionType === 'reflection'
                        ? 'bg-blue-600 text-white border-2 border-blue-400'
                        : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    💭 学习反思
                  </button>
                  <button
                    onClick={() => setSubmissionType('assignment')}
                    className={`
                      flex-1 py-3 px-4 rounded-lg font-medium transition-all
                      ${submissionType === 'assignment'
                        ? 'bg-purple-600 text-white border-2 border-purple-400'
                        : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    📝 作业提交
                  </button>
                </div>
              </div>

              {/* 作业内容输入 */}
              <div>
                <label className="block text-white font-medium mb-3">
                  {submissionType === 'reflection' ? '你的学习感悟' : '作业内容'}
                </label>
                <textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder={
                    submissionType === 'reflection'
                      ? '分享你在本次学习中的感悟、体会和收获...'
                      : '请提交你的作业内容...'
                  }
                  className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {submissionContent.length} 字
                  </span>
                  <span className="text-sm text-gray-500">
                    建议至少 100 字
                  </span>
                </div>
              </div>

              {/* 提示信息 */}
              <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">提交后将发生什么？</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-400">
                      <li>AI导师将立即评估你的提交</li>
                      <li>你将收到个性化的反馈和分数</li>
                      <li>你的意识树将根据学习质量实时生长🌱</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || submissionContent.length < 10}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      AI评估中...
                    </span>
                  ) : (
                    '提交作业'
                  )}
                </button>
              </div>
            </>
          ) : (
            /* 评估结果展示 */
            <div className="space-y-6">
              {/* 分数展示 */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <div className="text-5xl font-bold text-white">
                    {result.evaluation?.score || 0}
                  </div>
                </div>
                <p className="text-xl font-semibold text-white">评估完成</p>
              </div>

              {/* AI反馈 */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  AI导师的反馈
                </h3>
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {result.evaluation?.feedback || ''}
                </p>
              </div>

              {/* 意识树生长提示 */}
              {result.growth_impact && Object.keys(result.growth_impact).length > 0 && (
                <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">🌱</span>
                    你的意识树正在生长
                  </h3>
                  <div className="space-y-2 text-sm text-green-300">
                    {result.growth_impact.roots_growth && (
                      <p>✨ 根系深度增加：{JSON.stringify(result.growth_impact.roots_growth)}</p>
                    )}
                    {result.growth_impact.trunk_growth && (
                      <p>💪 树干强化：稳定性+{result.growth_impact.trunk_growth.stability || 0}，厚度+{result.growth_impact.trunk_growth.thickness || 0}</p>
                    )}
                    {result.growth_impact.new_leaf_generated && (
                      <p>🍃 新叶生成：+{result.growth_impact.new_leaf_generated.count || 0} 片</p>
                    )}
                    {result.growth_impact.fruit_generated && (
                      <p>🍎 果实收获：{result.growth_impact.fruit_generated.title || '新成果'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 关闭按钮 */}
              <button
                onClick={() => {
                  onSuccess()
                  onClose()
                }}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
              >
                太棒了！继续学习
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
