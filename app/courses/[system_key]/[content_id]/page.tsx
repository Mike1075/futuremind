import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SubmissionButton from './SubmissionButton'

// 强制动态渲染，确保课程完成状态实时更新
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    .select('progress_value')
    .eq('user_id', user.id)
    .eq('ref_item_id', contentId)
    .eq('progress_type', 'reading')
    .single()

  const isCompleted = progress?.progress_value === 100

  // 渲染资源（音频、视频等）
  const renderResources = () => {
    if (!content.resources || content.resources.length === 0) return null

    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-400">📦 课程资源</h2>
        <div className="space-y-4">
          {content.resources.map((resource: any, index: number) => {
            if (resource.type === 'audio') {
              return (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-white">{resource.title}</h3>
                      {resource.duration && (
                        <p className="text-sm text-gray-400">时长: {resource.duration}</p>
                      )}
                    </div>
                  </div>
                  <audio controls className="w-full">
                    <source src={resource.url} type="audio/mpeg" />
                    您的浏览器不支持音频播放
                  </audio>
                </div>
              )
            }

            if (resource.type === 'video') {
              return (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <svg className="w-6 h-6 text-purple-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-white">{resource.title}</h3>
                      {resource.duration && (
                        <p className="text-sm text-gray-400">时长: {resource.duration}</p>
                      )}
                    </div>
                  </div>
                  <video controls className="w-full rounded-lg">
                    <source src={resource.url} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                </div>
              )
            }

            if (resource.type === 'pdf' || resource.type === 'document') {
              return (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:bg-gray-800 transition-colors rounded-lg p-3"
                  >
                    <svg className="w-6 h-6 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{resource.title}</h3>
                      <p className="text-sm text-gray-400">{resource.type === 'pdf' ? 'PDF文档' : '文档'}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )
            }

            // 通用链接资源
            return (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:bg-gray-800 transition-colors rounded-lg p-3"
                >
                  <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{resource.title}</h3>
                    <p className="text-sm text-gray-400">{resource.type || '链接'}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // 根据课程类型渲染不同的内容
  const renderContent = () => {
    const structureType = courseSystem.structure_type

    // Listening课程
    if (structureType === 'daily_sequential' && content.deep_interpretation) {
      return (
        <div className="space-y-8">
          {/* 课程资源 */}
          {renderResources()}

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
          {/* 课程资源 */}
          {renderResources()}

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
          {/* 课程资源 */}
          {renderResources()}

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

        {/* 作业提交按钮 */}
        <div className="mb-8">
          <SubmissionButton
            userId={user.id}
            contentId={contentId}
            contentTitle={content.title}
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
