import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface CoursePageProps {
  params: Promise<{ system_key: string }>
}

async function CourseContent({ systemKey }: { systemKey: string }) {
  const supabase = await createClient()

  // 验证用户登录
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 获取用户角色
  const { data: profile } = await (supabase
    .from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .single()

  // 获取课程体系信息
  const { data: courseSystem, error: systemError } = await (supabase
    .from('course_systems') as any)
    .select('*')
    .eq('system_key', systemKey)
    .single()

  if (systemError || !courseSystem) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">课程不存在</h1>
          <Link
            href="/portal"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            返回学习中心
          </Link>
        </div>
      </div>
    )
  }

  // 获取课程内容列表
  const { data: contents } = await (supabase
    .from('course_contents') as any)
    .select('*')
    .eq('system_id', courseSystem.id)
    .eq('is_published', true)
    .order('sequence_number', { ascending: true })

  // 获取用户进度
  const { data: userProgress } = await (supabase
    .from('user_progress') as any)
    .select('content_id, completed')
    .eq('user_id', user.id)
    .eq('course_system_id', courseSystem.id)

  // 创建进度映射
  const progressMap = new Map(
    (userProgress || []).map((p: any) => [p.content_id, p.completed])
  )

  // 计算完成百分比
  const totalContents = contents?.length || 0
  const completedCount = (userProgress || []).filter((p: any) => p.completed).length
  const progressPercentage = totalContents > 0
    ? Math.round((completedCount / totalContents) * 100)
    : 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href="/portal"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回学习中心
        </Link>

        {/* 课程头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{courseSystem.title}</h1>
          <p className="text-gray-400 mb-6">{courseSystem.description}</p>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">学习进度</span>
              <span className="text-white font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              已完成 {completedCount} / {totalContents} 个单元
            </p>
          </div>
        </div>

        {/* 课程内容列表 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">课程内容</h2>

          {contents && contents.length > 0 ? (
            <div className="grid gap-4">
              {contents.map((content: any) => {
                const isCompleted = progressMap.get(content.id) === true

                return (
                  <Link
                    key={content.id}
                    href={`/courses/${systemKey}/${content.id}`}
                    className="block bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-900/70 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {content.title}
                        </h3>
                        {content.subtitle && (
                          <p className="text-gray-400 text-sm mb-2">
                            {content.subtitle}
                          </p>
                        )}
                        {content.duration && (
                          <p className="text-gray-500 text-sm">
                            {content.duration}
                          </p>
                        )}
                      </div>
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无课程内容
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { system_key } = await params

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    }>
      <CourseContent systemKey={system_key} />
    </Suspense>
  )
}
