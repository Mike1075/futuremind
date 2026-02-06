// @ts-nocheck
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CourseService } from '@/lib/services/course.service'
import { ProgressService } from '@/lib/services/progress.service'
import { PBLCourseView } from '@/components/courses/PBLCourseView'
import { EarthCourseView } from '@/components/courses/EarthCourseView'
import { ListeningCourseView } from '@/components/courses/ListeningCourseView'
import { DawnAwakeningView } from '@/components/courses/DawnAwakeningView'
import { MarchCourseView } from '@/components/courses/MarchCourseView'
import type { CourseContent } from '@/lib/supabase/database.types'

// ✅ 性能优化：启用30秒缓存，大幅提升页面加载速度
// 用户进度30秒内保持一致，对学习体验无影响
export const revalidate = 30

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

  // 获取课程体系和内容
  const courseData = await CourseService.getCourseWithContents(systemKey, false)

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-cosmic-deep/50 to-mystic-purple/20" />
        <div className="text-center relative z-10">
          <h1 className="text-h2 text-starlight mb-4">课程不存在</h1>
          <Link
            href="/portal"
            className="text-mystic-purple hover:text-mystic-purple-light underline transition-colors text-body"
          >
            返回学习中心
          </Link>
        </div>
      </div>
    )
  }

  const { system: courseSystem, contents } = courseData

  // PBL课程使用专属视图
  if (systemKey === 'icarus') {
    return <PBLCourseView courseSystem={courseSystem} />
  }

  // 获取内容ID列表
  const contentIds = contents.map(c => c.id)

  // 批量获取用户进度
  const progressMap = await ProgressService.getBatchProgress(
    user.id,
    contentIds,
    'reading'
  )

  // 创建完成状态映射
  const completionMap = new Map<string, boolean>()
  progressMap.forEach((progress, contentId) => {
    completionMap.set(contentId, progress.progress_value === 100)
  })

  // 地球课程使用专属视图
  if (systemKey === 'earth') {
    return (
      <EarthCourseView
        courseSystem={courseSystem}
        contents={contents}
        completionMap={completionMap}
      />
    )
  }

  // 聆听课程、破晓觉醒课程、依赖与自由课程都需要分数映射（链式解锁）
  if (systemKey === 'listening' || systemKey === 'dawn_awakening' || systemKey === 'dependency_freedom') {
    // 获取用户的作业分数
    const { data: submissions } = await supabase
      .from('user_submissions')
      .select('course_content_id, score')
      .eq('user_id', user.id)
      .in('course_content_id', contentIds)
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false })

    // 创建分数映射（取最高分）
    const scoreMap = new Map<string, number>()
    submissions?.forEach(sub => {
      if (!sub.course_content_id) return  // 跳过空值
      const existingScore = scoreMap.get(sub.course_content_id) || 0
      if (sub.score && sub.score > existingScore) {
        scoreMap.set(sub.course_content_id, sub.score)
      }
    })

    // 聆听课程使用曲线路径视图
    if (systemKey === 'listening') {
      return (
        <ListeningCourseView
          courseSystem={courseSystem}
          contents={contents}
          completionMap={completionMap}
          scoreMap={scoreMap}
        />
      )
    }

    // 破晓觉醒课程使用日历视图
    // 管理员账号可以跳过日期限制
    const adminEmails = ['3368327@qq.com', 'onestnet@gmail.com']
    const bypassDateCheck = adminEmails.includes(user.email || '')

    if (systemKey === 'dawn_awakening') {
      return (
        <DawnAwakeningView
          courseSystem={courseSystem}
          contents={contents}
          completionMap={completionMap}
          scoreMap={scoreMap}
          bypassDateCheck={bypassDateCheck}
        />
      )
    }

    // 依赖与自由课程使用九宫格视图
    if (systemKey === 'dependency_freedom') {
      return (
        <MarchCourseView
          courseSystem={courseSystem}
          contents={contents}
          completionMap={completionMap}
          scoreMap={scoreMap}
          bypassScoreCheck={bypassDateCheck}
        />
      )
    }
  }

  // 继续使用已经获取的progressMap和completionMap处理每日课程

  // 计算完成百分比
  const totalContents = contents.length
  let completedCount = 0
  completionMap.forEach(isCompleted => {
    if (isCompleted) completedCount++
  })
  const progressPercentage = totalContents > 0
    ? Math.round((completedCount / totalContents) * 100)
    : 0

  return (
    <div className="min-h-screen text-starlight relative overflow-hidden">
      {/* 半透明渐变覆盖层 - 让星空背景透出 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-cosmic-deep/50 to-mystic-purple/20" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link
          href="/portal"
          className="inline-flex items-center text-starlight-muted hover:text-starlight mb-6 transition-colors text-small"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回学习中心
        </Link>

        {/* 课程头部 */}
        <div className="mb-8">
          <h1 className="text-h1 mb-4">{courseSystem.title}</h1>
          <p className="text-body text-starlight-muted mb-6">{courseSystem.description}</p>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="flex justify-between text-small mb-2">
              <span className="text-starlight-dim">学习进度</span>
              <span className="text-starlight font-medium">{progressPercentage}%</span>
            </div>
            <div className="progress-ethereal">
              <div
                className="progress-ethereal-bar"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-small text-starlight-muted mt-2">
              已完成 {completedCount} / {totalContents} 个单元
            </p>
          </div>
        </div>

        {/* 课程内容列表 */}
        <div className="space-y-4">
          <h2 className="text-h3 mb-4">课程内容</h2>

          {contents.length > 0 ? (
            <div className="grid gap-4">
              {contents.map((content: CourseContent, index: number) => {
                const isCompleted = completionMap.get(content.id) === true

                // 检查是否解锁（检查前置课程）
                let isUnlocked = true
                let prerequisiteTitle = ''

                if (content.prerequisites && Array.isArray(content.prerequisites) && content.prerequisites.length > 0) {
                  // 检查所有前置课程是否完成
                  const prerequisiteId = content.prerequisites[0] as string
                  const prerequisiteContent = contents.find(c => c.id === prerequisiteId)
                  const isPrerequisiteCompleted = completionMap.get(prerequisiteId) === true

                  isUnlocked = isPrerequisiteCompleted
                  prerequisiteTitle = prerequisiteContent?.title || '前置课程'
                } else if (index > 0 && courseSystem.structure_type === 'daily_sequential') {
                  // 对于日序列课程，如果没有明确的prerequisites，默认需要完成前一天
                  const previousContent = contents[index - 1]
                  isUnlocked = completionMap.get(previousContent.id) === true || index === 0
                  prerequisiteTitle = previousContent?.title || `第${index}天`
                }

                // 第一个课程总是解锁的
                if (index === 0) isUnlocked = true

                const cardClassName = `
                  block card-glass p-6 transition-all relative overflow-hidden
                  ${isUnlocked
                    ? 'hover:border-mystic-purple/30 hover:shadow-lg hover:shadow-mystic-purple/10 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                  }
                  ${isCompleted && isUnlocked ? 'ring-2 ring-wisdom-green/30' : ''}
                `

                const cardContent = (
                  <>
                    {/* 未解锁遮罩 */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-cosmic-void/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-starlight-muted mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-starlight-muted text-small">
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
                            flex items-center justify-center w-8 h-8 rounded-full text-small font-bold
                            ${isCompleted
                              ? 'bg-gradient-to-br from-wisdom-green to-wisdom-emerald text-starlight'
                              : isUnlocked
                                ? 'bg-gradient-to-br from-ethereal-blue to-mystic-purple text-starlight'
                                : 'bg-white/10 text-starlight-muted'
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

                          <span className={`text-small font-medium ${isUnlocked ? 'text-starlight-muted' : 'text-starlight-dim'}`}>
                            {courseSystem.structure_type === 'daily_sequential'
                              ? `第${content.sequence_number}天`
                              : `单元 ${content.sequence_number}`}
                          </span>

                          {isCompleted && (
                            <span className="px-2 py-1 bg-wisdom-green/10 text-wisdom-green text-xs rounded-full font-medium">
                              已完成
                            </span>
                          )}

                          {!isUnlocked && (
                            <span className="px-2 py-1 bg-white/5 text-starlight-dim text-xs rounded-full font-medium">
                              🔒 锁定
                            </span>
                          )}
                        </div>

                        <h3 className={`text-h3 mb-2 ${isUnlocked ? 'text-starlight' : 'text-starlight-dim'}`}>
                          {content.title}
                        </h3>

                        {content.subtitle && (
                          <p className={`text-small mb-2 ${isUnlocked ? 'text-starlight-muted' : 'text-starlight-dim'}`}>
                            {content.subtitle}
                          </p>
                        )}

                        {content.duration && (
                          <p className={`text-small ${isUnlocked ? 'text-starlight-dim' : 'text-starlight-dim'}`}>
                            ⏱️ {content.duration}
                          </p>
                        )}
                      </div>

                      {isUnlocked && (
                        <svg className="w-6 h-6 text-starlight-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="text-center py-12 card-glass">
              <p className="text-body text-starlight-dim">暂无课程内容</p>
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
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-cosmic-deep/50 to-mystic-purple/20" />
        <div className="loader-ethereal relative z-10"></div>
      </div>
    }>
      <CourseContent systemKey={system_key} />
    </Suspense>
  )
}
