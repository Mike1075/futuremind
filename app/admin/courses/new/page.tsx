'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'

interface ParsedCourse {
  system_key: string
  title: string
  description: string
  structure_type: string
  teaching_goals?: string
  guidance_keywords?: string[]
  contents: any[]
}

export default function NewCoursePage() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'parsing' | 'preview' | 'saving' | 'success'>('upload')

  // 表单数据
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseType, setCourseType] = useState<'listening' | 'earth' | 'pbl'>('listening')
  const [documentContent, setDocumentContent] = useState('')
  const [fileName, setFileName] = useState('')

  // 解析结果
  const [parsedCourse, setParsedCourse] = useState<ParsedCourse | null>(null)
  const [error, setError] = useState('')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target?.result as string
      setDocumentContent(content)
    }

    if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      reader.readAsText(file)
    } else {
      alert('目前仅支持 .md 和 .txt 文件格式')
      e.target.value = ''
    }
  }

  const handleParse = async () => {
    if (!title.trim() || !description.trim() || !documentContent.trim()) {
      alert('请填写完整信息并上传文档')
      return
    }

    setError('')
    setStep('parsing')

    try {
      const response = await fetch('/api/admin/courses/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          courseType,
          documentContent
        })
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setStep('upload')
        return
      }

      setParsedCourse(data.course)
      setStep('preview')
    } catch (err: any) {
      setError(err.message || '解析失败，请重试')
      setStep('upload')
    }
  }

  const handleSave = async () => {
    if (!parsedCourse) return

    setStep('saving')
    setError('')

    try {
      const response = await fetch('/api/admin/courses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedCourse)
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setStep('preview')
        return
      }

      setStep('success')
      // 3秒后跳转到课程管理页面
      setTimeout(() => {
        router.push('/admin/courses')
      }, 3000)
    } catch (err: any) {
      setError(err.message || '保存失败，请重试')
      setStep('preview')
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/courses')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-400" />
                AI 创建课程体系
              </h1>
              <p className="text-sm text-gray-400 mt-1">上传课程设计文档，AI 自动解析并生成课程结构</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* 步骤1: 上传文档 */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">📝 课程基本信息</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    课程标题 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例如：自在聆听·观音之旅"
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    课程描述 *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简要描述课程的主要内容和目标..."
                    rows={3}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    课程类型 *
                  </label>
                  <select
                    value={courseType}
                    onChange={(e) => setCourseType(e.target.value as 'listening' | 'earth' | 'pbl')}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="listening">Listening 课程（14天系列课程）</option>
                    <option value="earth">Earth 课程（模块化课程）</option>
                    <option value="pbl">PBL 项目式学习</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    不同类型的课程会使用不同的解析模板
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">📄 上传课程文档</h2>

              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-400/50 transition-all">
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white mb-2">点击上传文档</p>
                  <p className="text-sm text-gray-400">支持 .md 和 .txt 格式</p>
                </label>

                {fileName && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                    <FileText className="w-5 h-5" />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>

              {documentContent && (
                <div className="mt-4 p-4 bg-black/50 rounded-lg border border-white/10">
                  <p className="text-sm text-gray-400 mb-2">文档预览（前300字符）：</p>
                  <p className="text-white text-sm whitespace-pre-wrap">
                    {documentContent.substring(0, 300)}...
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!title || !description || !documentContent}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              开始 AI 解析
            </button>
          </div>
        )}

        {/* 步骤2: 解析中 */}
        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
            <p className="text-white text-lg mb-2">AI 正在解析课程文档...</p>
            <p className="text-gray-400 text-sm">这可能需要10-30秒，请耐心等待</p>
          </div>
        )}

        {/* 步骤3: 预览解析结果 */}
        {step === 'preview' && parsedCourse && (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-300">✨ 解析成功！共生成 {parsedCourse.contents.length} 个内容单元</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">课程信息预览</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-400">课程标题</dt>
                  <dd className="text-white">{parsedCourse.title}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">课程描述</dt>
                  <dd className="text-white">{parsedCourse.description}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">课程类型</dt>
                  <dd className="text-white">{parsedCourse.structure_type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-400">内容单元数</dt>
                  <dd className="text-white">{parsedCourse.contents.length} 个</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">内容单元预览（前3个）</h2>
              <div className="space-y-3">
                {parsedCourse.contents.slice(0, 3).map((content: any, index: number) => (
                  <div key={index} className="p-4 bg-black/50 rounded-lg border border-white/10">
                    <h3 className="text-white font-medium mb-1">{content.title}</h3>
                    <p className="text-sm text-gray-400">
                      {content.original_text?.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
              >
                返回修改
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                确认并保存
              </button>
            </div>
          </div>
        )}

        {/* 步骤4: 保存中 */}
        {step === 'saving' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mb-4" />
            <p className="text-white text-lg mb-2">正在保存课程数据...</p>
            <p className="text-gray-400 text-sm">请稍候</p>
          </div>
        )}

        {/* 步骤5: 成功 */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <p className="text-white text-2xl font-bold mb-2">🎉 课程创建成功！</p>
            <p className="text-gray-400 text-sm">即将跳转到课程管理页面...</p>
          </div>
        )}
      </main>
    </div>
  )
}
