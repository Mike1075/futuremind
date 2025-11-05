'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertCircle, CheckCircle, Sparkles, Globe, Lock } from 'lucide-react'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ReviewResult {
  approved: boolean
  reason?: string
  violations?: string[]
  severity?: string
  suggestions?: string
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    projectIntro: '',
    difficultyLevel: '',
    moduleName: '',
    estimatedDuration: 60,
    projectVisibility: 'private',
    projectTags: [] as string[],
    projectIconUrl: '',
    projectCoverImage: ''
  })

  const [currentTag, setCurrentTag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const difficultyLevels = ['基础探索', '进阶挑战', '深度研究', '创新实践']

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.projectTags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        projectTags: [...formData.projectTags, currentTag.trim()]
      })
      setCurrentTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      projectTags: formData.projectTags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setReviewResult(null)

    // 验证必填字段
    if (!formData.title.trim()) {
      setError('请输入项目标题')
      return
    }

    if (!formData.projectIntro.trim()) {
      setError('请输入项目简介')
      return
    }

    if (formData.projectIntro.trim().length < 20) {
      setError('项目简介至少需要20个字符')
      return
    }

    setSubmitting(true)

    try {
      // 如果是公开项目，先显示审核状态
      if (formData.projectVisibility === 'public') {
        setReviewing(true)
      }

      const response = await fetch('/api/pbl/create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project')
      }

      setReviewing(false)

      // 显示审核结果
      if (data.review) {
        setReviewResult(data.review)

        if (data.review.approved) {
          // 审核通过，1.5秒后关闭
          setTimeout(() => {
            onSuccess()
            handleClose()
          }, 1500)
        }
      } else {
        // 私有项目直接成功
        onSuccess()
        handleClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败，请重试')
      setReviewing(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      subtitle: '',
      projectIntro: '',
      difficultyLevel: '',
      moduleName: '',
      estimatedDuration: 60,
      projectVisibility: 'private',
      projectTags: [],
      projectIconUrl: '',
      projectCoverImage: ''
    })
    setCurrentTag('')
    setError(null)
    setReviewResult(null)
    setReviewing(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-gray-900 rounded-xl border border-gray-800 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">创建新项目</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Error Alert */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Review Result */}
                {reviewResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg p-4 border ${
                      reviewResult.approved
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {reviewResult.approved ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${reviewResult.approved ? 'text-green-400' : 'text-red-400'}`}>
                          {reviewResult.approved ? '✅ 审核通过！' : '❌ 审核未通过'}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">{reviewResult.reason}</p>
                        {reviewResult.suggestions && (
                          <p className="text-sm text-gray-400 mt-2">
                            💡 建议：{reviewResult.suggestions}
                          </p>
                        )}
                        {reviewResult.violations && reviewResult.violations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">违规类型：</p>
                            <div className="flex flex-wrap gap-2">
                              {reviewResult.violations.map((violation, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full"
                                >
                                  {violation}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Reviewing Status */}
                {reviewing && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      <div>
                        <p className="text-purple-400 font-medium">AI审核中...</p>
                        <p className="text-sm text-gray-400 mt-1">
                          正在检查内容是否符合社区准则
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Visibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    项目可见性
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, projectVisibility: 'private' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.projectVisibility === 'private'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <Lock className={`w-6 h-6 mb-2 ${
                        formData.projectVisibility === 'private' ? 'text-purple-400' : 'text-gray-400'
                      }`} />
                      <p className={`font-medium ${
                        formData.projectVisibility === 'private' ? 'text-white' : 'text-gray-400'
                      }`}>
                        私有项目
                      </p>
                      <p className="text-xs text-gray-500 mt-1">仅自己可见</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, projectVisibility: 'public' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.projectVisibility === 'public'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <Globe className={`w-6 h-6 mb-2 ${
                        formData.projectVisibility === 'public' ? 'text-blue-400' : 'text-gray-400'
                      }`} />
                      <p className={`font-medium ${
                        formData.projectVisibility === 'public' ? 'text-white' : 'text-gray-400'
                      }`}>
                        公开项目
                      </p>
                      <p className="text-xs text-gray-500 mt-1">所有人可见（需审核）</p>
                    </button>
                  </div>
                  {formData.projectVisibility === 'public' && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      公开项目将经过AI审核，确保内容符合社区准则
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    项目标题 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：太阳系探索计划"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    maxLength={100}
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    副标题
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="例如：探索宇宙的奥秘"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    maxLength={200}
                  />
                </div>

                {/* Project Intro */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    项目简介 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={formData.projectIntro}
                    onChange={(e) => setFormData({ ...formData, projectIntro: e.target.value })}
                    placeholder="详细描述你的项目目标、内容和特色..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.projectIntro.length} / 1000
                  </p>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    难度等级
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {difficultyLevels.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficultyLevel: level })}
                        className={`px-4 py-2 rounded-lg border transition-all text-sm ${
                          formData.difficultyLevel === level
                            ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    项目标签
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="输入标签后按回车"
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      添加
                    </button>
                  </div>
                  {formData.projectTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.projectTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-purple-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    预计时长（分钟）
                  </label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={9999}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.title.trim() || !formData.projectIntro.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-500 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      创建项目
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
