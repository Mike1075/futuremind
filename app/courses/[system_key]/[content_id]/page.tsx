import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarkCompleteButton from './MarkCompleteButton'

interface ContentPageProps {
  params: Promise<{
    system_key: string
    content_id: string
  }>
}

async function ContentDetail({ systemKey, contentId }: { systemKey: string, contentId: string }) {
  const supabase = await createClient()

  // 验证用户登录
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 获取课程体系信息
  const { data: courseSystem } = await (supabase
    .from('course_systems') as any)
    .select('*')
    .eq('system_key', systemKey)
    .single()

  if (!courseSystem) {
    redirect('/portal')
  }

  // 获取当前内容
  const { data: content } = await (supabase
    .from('course_contents') as any)
    .select('*')
    .eq('id', contentId)
    .eq('system_id', courseSystem.id)
    .single()

  if (!content) {
    redirect(`/courses/${systemKey}`)
  }

  // 获取上一个和下一个内容
  const { data: prevContent } = await (supabase
    .from('course_contents') as any)
    .select('id')
    .eq('system_id', courseSystem.id)
    .eq('is_published', true)
    .lt('sequence_number', content.sequence_number)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .single()

  const { data: nextContent } = await (supabase
    .from('course_contents') as any)
    .select('id')
    .eq('system_id', courseSystem.id)
    .eq('is_published', true)
    .gt('sequence_number', content.sequence_number)
    .order('sequence_number', { ascending: true })
    .limit(1)
    .single()

  // 获取用户进度
  const { data: progress } = await (supabase
    .from('user_progress') as any)
    .select('completed')
    .eq('user_id', user.id)
    .eq('content_id', contentId)
    .single()

  const isCompleted = progress?.completed || false

  // 根据课程类型渲染不同的内容
  const renderContent = () => {
    const structureType = courseSystem.structure_type

    // Listening课程
    if (structureType === 'daily_sequential' && content.deep_interpretation) {
      return (
        <div className="space-y-8">
          {content.original_text && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-400">原文摘录</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.original_text}
                </p>
              </div>
            </section>
          )}

          {content.deep_interpretation && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-purple-400">深度解读</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.deep_interpretation}
                </p>
              </div>
            </section>
          )}

          {content.meditation_guide && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-green-400">冥想练习与引导</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.meditation_guide}
                </p>
              </div>
            </section>
          )}

          {content.life_practice && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">生活中的小练习</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.life_practice}
                </p>
              </div>
            </section>
          )}
        </div>
      )
    }

    // 通用Daily课程
    if (structureType === 'daily_sequential' && content.main_content) {
      return (
        <div className="space-y-8">
          {content.goals && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-400">今日目标</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.goals}
                </p>
              </div>
            </section>
          )}

          {content.main_content && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-purple-400">练习内容</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.main_content}
                </div>
              </div>
            </section>
          )}

          {content.tips && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-yellow-400">温馨提示</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.tips}
                </p>
              </div>
            </section>
          )}
        </div>
      )
    }

    // Earth课程（模块化）
    if (structureType === 'module_matrix') {
      return (
        <div className="space-y-8">
          {content.original_text && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-400">模块核心内容</h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {content.original_text}
                </p>
              </div>
            </section>
          )}

          {content.knowledge_points && content.knowledge_points.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-green-400">知识点</h2>
              <div className="space-y-4">
                {content.knowledge_points.map((kp: any, index: number) => (
                  <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold text-white mb-2">{kp.title}</h3>
                    <p className="text-gray-300">{kp.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {content.socratic_questions && content.socratic_questions.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-purple-400">苏格拉底式问题</h2>
              <div className="space-y-4">
                {content.socratic_questions.map((sq: any, index: number) => (
                  <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                    <h3 className="font-semibold text-white mb-2">{sq.question}</h3>
                    <p className="text-gray-400 text-sm">{sq.guidance}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )
    }

    // 默认显示
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
          {content.original_text || '暂无内容'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href={`/courses/${systemKey}`}
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回课程
        </Link>

        {/* 内容头部 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500">
              {courseSystem.structure_type === 'daily_sequential'
                ? `第${content.sequence_number}天`
                : `单元 ${content.sequence_number}`}
            </span>
            {isCompleted && (
              <span className="flex items-center text-green-500 text-sm">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                已完成
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
          {content.subtitle && (
            <p className="text-gray-400 mb-4">{content.subtitle}</p>
          )}
          {content.duration && (
            <p className="text-gray-500 text-sm">{content.duration}</p>
          )}
        </div>

        {/* 课程内容 */}
        <div className="mb-12">
          {renderContent()}
        </div>

        {/* 标记完成按钮 */}
        <div className="mb-8">
          <MarkCompleteButton
            userId={user.id}
            courseSystemId={courseSystem.id}
            contentId={contentId}
            initialCompleted={isCompleted}
          />
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-800">
          {prevContent ? (
            <Link
              href={`/courses/${systemKey}/${prevContent.id}`}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一个
            </Link>
          ) : (
            <div></div>
          )}

          {nextContent ? (
            <Link
              href={`/courses/${systemKey}/${nextContent.id}`}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              下一个
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { system_key, content_id } = await params

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    }>
      <ContentDetail systemKey={system_key} contentId={content_id} />
    </Suspense>
  )
}
