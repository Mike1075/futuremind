// @ts-nocheck
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CourseService } from '@/lib/services/course.service'
import { ProgressService } from '@/lib/services/progress.service'
import { PBLProjectDetail } from '@/components/courses/PBLProjectDetail'
import { EarthContentWrapperV2 } from './EarthContentWrapperV2'
import { CourseContentClient } from './CourseContentClient'
import { ContentDetailWrapper } from './ContentDetailWrapper'
import { CollapsibleSection } from '@/components/courses/CollapsibleSection'
import { formatCourseText } from '@/lib/utils/text-formatter'
import { AudioPlayer } from '@/components/courses/AudioPlayer'
import { NavigationButtons } from './NavigationButtons'

// Resource 类型定义（对应 course_contents.resources 的结构）
interface Resource {
  type: string
  title: string
  url: string
  duration?: string
}

// ✅ 性能优化：启用30秒缓存，大幅提升页面加载速度
// 课程内容30秒内保持一致，对学习体验无影响
export const revalidate = 30

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

  // 获取课程内容及其所属体系
  const data = await CourseService.getContentWithSystem(contentId)

  if (!data) {
    redirect('/portal')
  }

  const { content, system: courseSystem } = data

  // 验证system_key匹配
  if (courseSystem.system_key !== systemKey) {
    redirect(`/courses/${courseSystem.system_key}/${contentId}`)
  }

  // 🔒 安全检查：验证倾听课程的解锁状态（防止用户通过URL直接访问未解锁课程）
  // 管理员账号可以跳过解锁检查
  const adminEmails = ['3368327@qq.com', 'onestnet@gmail.com']
  const isAdmin = adminEmails.includes(user.email || '')

  if (courseSystem.structure_type === 'daily_sequential' && !isAdmin) {
    const unlockStatus = await CourseService.checkListeningCourseUnlock(user.id, contentId)
    if (!unlockStatus.isUnlocked) {
      // 未解锁，重定向回课程列表页
      redirect(`/courses/${systemKey}`)
    }
  }

  // 获取相邻内容
  const { prev: prevContent, next: nextContent } = await CourseService.getAdjacentContents(
    courseSystem.id,
    content.sequence_number,
    false
  )

  // 获取用户进度
  const isCompleted = await ProgressService.isCompleted(
    user.id,
    contentId,
    'reading'
  )

  // 检查是否曾经有过>=60分的提交（用于控制"下一个"按钮）
  // 只要曾经通过，就永久解锁，不会因为后续低分提交而锁回去
  const { data: passedSubmission } = await supabase
    .from('user_submissions')
    .select('score')
    .eq('user_id', user.id)
    .eq('course_content_id', contentId)
    .gte('score', 60)
    .limit(1)
    .single()

  const hasPassedAssignment = !!passedSubmission

  // 获取用户当前最高分数（用于显示在锁定提示弹窗中）
  const { data: highestSubmission } = await supabase
    .from('user_submissions')
    .select('score')
    .eq('user_id', user.id)
    .eq('course_content_id', contentId)
    .order('score', { ascending: false })
    .limit(1)
    .single()

  const currentHighestScore = highestSubmission?.score || 0

  // PBL项目使用专属详情页
  if (content.content_type === 'icarus') {
    // 检查用户是否已选择此项目
    const { data: selection } = (await (supabase
      .from('user_selected_projects') as any)
      .select('id, status, progress')
      .eq('user_id', user.id)
      .eq('project_id', contentId)
      .in('status', ['active', 'paused', 'completed'])
      .single()) as any

    // 直接使用原始的activities数据结构，不需要转换
    return (
      <PBLProjectDetail
        project={content as any}
        systemKey={systemKey}
        userProgress={selection?.progress || {}}
        isSelected={!!selection}
        selectionId={selection?.id}
      />
    )
  }

  // 地球课程使用专属详情页（带盖亚对话）
  if (systemKey === 'earth') {
    // 获取阶段信息
    const contentWithStage = content as any
    const { data: stage } = await supabase
      .from('course_stages')
      .select('id, stage_number, stage_name')
      .eq('id', contentWithStage.stage_id)
      .single()

    const stageData = stage as { id: string; stage_number: number; stage_name: string } | null

    // 获取当前阶段的所有内容
    const { data: stageContents } = await supabase
      .from('course_contents')
      .select('id')
      .eq('stage_id', contentWithStage.stage_id)
      .eq('is_published', true)
      .order('sequence_number')

    const contentsData = stageContents as { id: string }[] | null

    // 获取上一个阶段信息
    const { data: prevStage } = await supabase
      .from('course_stages')
      .select('id, stage_number, stage_name')
      .eq('system_id', courseSystem.id)
      .eq('stage_number', (stageData?.stage_number || 0) - 1)
      .single()

    const prevStageData = prevStage as { id: string; stage_number: number; stage_name: string } | null

    // 获取上一阶段的第一个内容
    let prevStageFirstContent = null
    if (prevStageData) {
      const { data: prevStageContent } = await supabase
        .from('course_contents')
        .select('id')
        .eq('stage_id', prevStageData.id)
        .eq('is_published', true)
        .order('sequence_number')
        .limit(1)
        .single()

      prevStageFirstContent = prevStageContent as { id: string } | null
    }

    // 获取下一个阶段信息
    const { data: nextStage } = await supabase
      .from('course_stages')
      .select('id, stage_number, stage_name')
      .eq('system_id', courseSystem.id)
      .eq('stage_number', (stageData?.stage_number || 0) + 1)
      .single()

    const nextStageData = nextStage as { id: string; stage_number: number; stage_name: string } | null

    // 获取下一阶段的第一个内容
    let nextStageFirstContent = null
    if (nextStageData) {
      const { data: nextStageContent } = await supabase
        .from('course_contents')
        .select('id')
        .eq('stage_id', nextStageData.id)
        .eq('is_published', true)
        .order('sequence_number')
        .limit(1)
        .single()

      nextStageFirstContent = nextStageContent as { id: string } | null
    }

    return (
      <EarthContentWrapperV2
        content={content}
        systemKey={systemKey}
        isCompleted={isCompleted}
        prevContent={prevContent}
        nextContent={nextContent}
        currentStage={stageData}
        stageContentIds={contentsData?.map(c => c.id) || []}
        prevStage={prevStageData}
        prevStageFirstContentId={prevStageFirstContent?.id || null}
        nextStage={nextStageData}
        nextStageFirstContentId={nextStageFirstContent?.id || null}
      />
    )
  }

  // 渲染资源（音频、视频等）- 简化样式，只保留标题
  const renderResources = () => {
    if (!content.resources) return null

    const resources = content.resources as unknown as Resource[]
    if (resources.length === 0) return null

    return (
      <section className="mb-8 space-y-4">
        {resources.map((resource: Resource, index: number) => {
          if (resource.type === 'audio') {
            return (
              <AudioPlayer key={index} src={resource.url} title={resource.title} />
            )
          }

          if (resource.type === 'video') {
            return (
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center mr-3 border border-blue-500/30">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-white">{resource.title}</h3>
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
              <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:bg-white/5 transition-colors rounded-lg p-2"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center mr-3 border border-orange-500/30">
                    <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{resource.title}</h3>
                  </div>
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </section>
    )
  }

  // 获取媒体资源（用于破晓觉醒课程的音频）
  const { data: mediaResources } = await supabase
    .from('media_resources')
    .select('*')
    .eq('course_content_id', contentId)
    .order('created_at', { ascending: true })

  // 渲染媒体资源（从 media_resources 表获取的音频等）
  const renderMediaResources = () => {
    if (!mediaResources || mediaResources.length === 0) return null

    return (
      <section className="mb-6 space-y-4">
        {mediaResources.map((media: any) => {
          if (media.resource_type === 'audio' || media.file_type?.startsWith('audio/')) {
            return (
              <AudioPlayer
                key={media.id}
                src={media.file_url}
                title={media.file_name || '冥想音频'}
              />
            )
          }
          return null
        })}
      </section>
    )
  }

  // 根据课程类型渲染不同的内容
  const renderContent = () => {
    const structureType = courseSystem.structure_type

    // 破晓觉醒课程 - 3个部分：Mike晨间寄语、冥想练习、生活实践
    if (systemKey === 'dawn_awakening') {
      return (
        <div className="space-y-4">
          {/* 媒体资源（从 media_resources 表获取） */}
          {renderMediaResources()}

          {/* 课程资源（从 content.resources JSON 获取） */}
          {renderResources()}

          {content.original_text && (
            <CollapsibleSection
              title="🌅 Mike晨间寄语"
              bgColor="bg-amber-500/10"
              borderColor="border-amber-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.original_text)}
            </CollapsibleSection>
          )}

          {content.meditation_guide && (
            <CollapsibleSection
              title="🧘 冥想练习"
              bgColor="bg-orange-500/10"
              borderColor="border-orange-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.meditation_guide)}
            </CollapsibleSection>
          )}

          {content.life_practice && (
            <CollapsibleSection
              title="🌱 生活实践"
              bgColor="bg-yellow-500/10"
              borderColor="border-yellow-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.life_practice)}
            </CollapsibleSection>
          )}
        </div>
      )
    }

    // Listening课程
    if (structureType === 'daily_sequential' && content.deep_interpretation) {
      return (
        <div className="space-y-4">
          {/* 课程资源 */}
          {renderResources()}

          {content.original_text && (
            <CollapsibleSection
              title="📖 原文摘录"
              bgColor="bg-blue-500/10"
              borderColor="border-blue-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.original_text)}
            </CollapsibleSection>
          )}

          {content.deep_interpretation && (
            <CollapsibleSection
              title="🔍 深度解读"
              bgColor="bg-purple-500/10"
              borderColor="border-purple-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.deep_interpretation, { addBorderToAll: true })}
            </CollapsibleSection>
          )}

          {content.meditation_guide && (
            <CollapsibleSection
              title="🧘 冥想练习"
              bgColor="bg-green-500/10"
              borderColor="border-green-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.meditation_guide)}
            </CollapsibleSection>
          )}

          {content.life_practice && (
            <CollapsibleSection
              title="🌱 生活实践"
              bgColor="bg-yellow-500/10"
              borderColor="border-yellow-500/30"
              defaultOpen={false}
            >
              {formatCourseText(content.life_practice)}
            </CollapsibleSection>
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

          {Array.isArray(content.knowledge_points) && content.knowledge_points.length > 0 && (
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

          {Array.isArray(content.socratic_questions) && content.socratic_questions.length > 0 && (
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
    <ContentDetailWrapper systemKey={systemKey}>
      {/* 内容头部 */}
      <div className="mb-8">
          {/* 已完成状态徽章 - 炫彩样式 */}
          {isCompleted && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30 mb-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-medium bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">已完成</span>
            </div>
          )}
          <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
          {content.subtitle && (
            <p className="text-gray-400 mb-4">{content.subtitle}</p>
          )}
        </div>

        {/* 课程内容 */}
        <div className="mb-12">
          {renderContent()}
        </div>

        {/* 作业提交和优秀作业展示 */}
        <CourseContentClient
          userId={user.id}
          contentId={contentId}
          contentTitle={content.title}
        />

        {/* 导航按钮 - 使用客户端组件以支持提交作业后立即解锁 */}
        <NavigationButtons
          systemKey={systemKey}
          prevContentId={prevContent?.id || null}
          nextContentId={nextContent?.id || null}
          initialUnlocked={hasPassedAssignment}
          currentHighestScore={currentHighestScore}
        />
    </ContentDetailWrapper>
  )
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { system_key, content_id } = await params

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <ContentDetail systemKey={system_key} contentId={content_id} />
    </Suspense>
  )
}
