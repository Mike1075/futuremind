'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    project_intro: '',
    project_visibility: 'private' as 'private' | 'public'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证必填字段
    if (!formData.title.trim()) {
      setError('请输入项目标题')
      return
    }

    if (!formData.project_intro.trim()) {
      setError('请输入项目介绍')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // 创建成功，跳转到项目详情页
        router.push(`/courses/icarus/${data.project.id}`)
      } else {
        // 显示错误信息
        setError(data.error || '创建项目失败')
      }
    } catch (err) {
      console.error('Failed to create project:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href="/courses/icarus"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回伊卡洛斯
        </Link>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            创建我的项目
          </h1>
          <p className="text-gray-400">
            设计你自己的探索项目，与社区分享你的创意
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* 创建表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 项目标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              项目标题 <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="给你的项目起一个吸引人的名字"
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 字符
            </p>
          </div>

          {/* 项目副标题 */}
          <div>
            <label htmlFor="subtitle" className="block text-sm font-medium mb-2">
              项目副标题（可选）
            </label>
            <input
              id="subtitle"
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="用一句话概括你的项目"
              maxLength={200}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.subtitle.length}/200 字符
            </p>
          </div>

          {/* 项目介绍 */}
          <div>
            <label htmlFor="intro" className="block text-sm font-medium mb-2">
              项目介绍 <span className="text-red-400">*</span>
            </label>
            <textarea
              id="intro"
              value={formData.project_intro}
              onChange={(e) => setFormData({ ...formData, project_intro: e.target.value })}
              placeholder="详细描述你的项目目标、方法和预期成果"
              rows={8}
              maxLength={2000}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.project_intro.length}/2000 字符
            </p>
          </div>

          {/* 可见性设置 */}
          <div>
            <label className="block text-sm font-medium mb-3">
              项目可见性 <span className="text-red-400">*</span>
            </label>
            <div className="space-y-3">
              {/* 私有选项 */}
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.project_visibility === 'private'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.project_visibility === 'private'}
                  onChange={(e) => setFormData({ ...formData, project_visibility: 'private' })}
                  className="mt-1 mr-3"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="font-medium">私有项目</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    只有你自己可以看到和编辑这个项目
                  </p>
                </div>
              </label>

              {/* 公开选项 */}
              <label
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.project_visibility === 'public'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.project_visibility === 'public'}
                  onChange={(e) => setFormData({ ...formData, project_visibility: 'public' })}
                  className="mt-1 mr-3"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">公开项目</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    所有用户都可以在探索者联盟中看到这个项目
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* AI审核提示 */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">AI内容审核</p>
                <p className="text-blue-400/80">
                  你的项目将经过AI审核，以确保内容符合社区规范。我们会检查并过滤不当内容，包括色情、暴力、政治攻击等。审核通过后，你的项目将立即可用。
                </p>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 btn-stardust rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 btn-stardust rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  创建中...
                </span>
              ) : (
                '创建项目'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
