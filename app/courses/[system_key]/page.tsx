import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// 强制动态渲染，禁用缓存，确保用户进度实时更新
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    .select('ref_item_id, progress_value')
    .eq('user_id', user.id)
    .eq('progress_type', 'course_content')

  // 创建进度映射
  const progressMap = new Map(
    (userProgress || []).map((p: any) => [p.ref_item_id, p.progress_value === 100])
  )

  // 计算完成百分比
  const totalContents = contents?.length || 0
  const completedCount = (userProgress || []).filter((p: any) => p.progress_value === 100).length
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
              {contents.map((content: any, index: number) => {
                const isCompleted = progressMap.get(content.id) === true

                // 检查是否解锁（检查前置课程）
                let isUnlocked = true
                let prerequisiteTitle = ''

                if (content.prerequisites && Array.isArray(content.prerequisites) && content.prerequisites.length > 0) {
                  // 检查所有前置课程是否完成
                  const prerequisiteId = content.prerequisites[0]
                  const prerequisiteContent = contents.find((c: any) => c.id === prerequisiteId)
                  const isPrerequisiteCompleted = progressMap.get(prerequisiteId) === true

                  isUnlocked = isPrerequisiteCompleted
                  prerequisiteTitle = prerequisiteContent?.title || '前置课程'
                } else if (index > 0 && courseSystem.structure_type === 'daily_sequential') {
                  // 对于日序列课程，如果没有明确的prerequisites，默认需要完成前一天
                  const previousContent = contents[index - 1]
                  isUnlocked = progressMap.get(previousContent.id) === true || index === 0
                  prerequisiteTitle = previousContent?.title || `第${index}天`
                }

                // 第一个课程总是解锁的
                if (index === 0) isUnlocked = true

                const cardClassName = `
                  block rounded-lg p-6 transition-all relative overflow-hidden
                  ${isUnlocked
                    ? 'bg-gray-900/50 border border-gray-800 hover:border-gray-700 hover:bg-gray-900/70 cursor-pointer'
                    : 'bg-gray-900/20 border border-gray-800/50 cursor-not-allowed'
                  }
                  ${isCompleted && isUnlocked ? 'ring-2 ring-green-500/20' : ''}
                `

                const cardContent = (
                  <>
                    {/* 未解锁遮罩 */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-gray-400 text-sm">
                            完成「{prerequisiteTitle}」后解锁
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between relative">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* 序号或状态标识 */}
                          <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                            ${isCompleted
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                              : isUnlocked
                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                                : 'bg-gray-700 text-gray-500'
                            }
                          `}>
                            {isCompleted ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              content.sequence_number
                            )}
                          </div>

                          <span className={`text-sm font-medium ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                            {courseSystem.structure_type === 'daily_sequential'
                              ? `第${content.sequence_number}天`
                              : `单元 ${content.sequence_number}`}
                          </span>

                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-medium">
                              已完成
                            </span>
                          )}

                          {!isUnlocked && (
                            <span className="px-2 py-1 bg-gray-700/50 text-gray-500 text-xs rounded-full font-medium">
                              🔒 锁定
                            </span>
                          )}
                        </div>

                        <h3 className={`text-lg font-semibold mb-2 ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                          {content.title}
                        </h3>

                        {content.subtitle && (
                          <p className={`text-sm mb-2 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                            {content.subtitle}
                          </p>
                        )}

                        {content.duration && (
                          <p className={`text-sm ${isUnlocked ? 'text-gray-500' : 'text-gray-600'}`}>
                            ⏱️ {content.duration}
                          </p>
                        )}
                      </div>

                      {isUnlocked && (
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </>
                )

                return isUnlocked ? (
                  <Link
                    key={content.id}
                    href={`/courses/${systemKey}/${content.id}`}
                    className={cardClassName}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div
                    key={content.id}
                    className={cardClassName}
                  >
                    {cardContent}
                  </div>
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
