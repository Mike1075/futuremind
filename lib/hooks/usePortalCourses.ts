/**
 * Portal课程数据加载Hook - 使用SWR做智能缓存
 * 首次访问查询数据库，后续访问从缓存读取（瞬间显示）
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'

interface EnrolledCourse {
  course_id: string
  course_title: string
  course_system_key: string
  assigned_at: string
  progress?: number
}

const supabase = createClient()

// 课程数据获取器（SWR使用）
const fetchEnrolledCourses = async (userId: string): Promise<EnrolledCourse[]> => {
  try {
    // 获取课程分配记录
    const { data: enrolledData, error } = await supabase
      .from('student_course_assignments')
      .select(`
        assigned_at,
        course_systems (id, title, system_key, is_active)
      `)
      .eq('student_id', userId)
      .eq('status', 'active')

    if (error) throw error

    // 过滤有效课程
    const validEnrollments = (enrolledData || []).filter((item: any) =>
      item.course_systems !== null && item.course_systems.is_active === true
    )

    // 计算每个课程的进度
    const enrolled: EnrolledCourse[] = await Promise.all(
      validEnrollments.map(async (item: any) => {
        const courseSystemKey = item.course_systems.system_key

        // 地球课程：调用进度API
        if (courseSystemKey === 'earth') {
          try {
            const response = await fetch(
              `/api/progress/earth-course-progress?courseSystemId=${item.course_systems.id}&userId=${userId}`,
              { next: { revalidate: 30 } }
            )

            if (response.ok) {
              const { progress } = await response.json()
              return {
                course_id: item.course_systems.id,
                course_title: item.course_systems.title,
                course_system_key: courseSystemKey,
                assigned_at: item.assigned_at,
                progress: progress || 0
              }
            }
          } catch (error) {
            console.error('[usePortalCourses] 获取地球课程进度失败:', error)
          }

          return {
            course_id: item.course_systems.id,
            course_title: item.course_systems.title,
            course_system_key: courseSystemKey,
            assigned_at: item.assigned_at,
            progress: 0
          }
        }

        // PBL课程：快速计算
        if (courseSystemKey === 'icarus' || courseSystemKey === 'pbl') {
          const { data: projects } = await supabase
            .from('course_contents')
            .select('id')
            .eq('system_id', item.course_systems.id)
            .eq('is_published', true)

          const totalProjects = projects?.length || 0

          if (totalProjects === 0) {
            return {
              course_id: item.course_systems.id,
              course_title: item.course_systems.title,
              course_system_key: courseSystemKey,
              assigned_at: item.assigned_at,
              progress: 0
            }
          }

          const projectIds = projects?.map((p: any) => p.id) || []
          const { data: selectedProjects } = await supabase
            .from('user_selected_projects')
            .select('project_id, completion_percentage')
            .eq('user_id', userId)
            .in('project_id', projectIds)
            .eq('status', 'active')

          if (!selectedProjects || selectedProjects.length === 0) {
            return {
              course_id: item.course_systems.id,
              course_title: item.course_systems.title,
              course_system_key: courseSystemKey,
              assigned_at: item.assigned_at,
              progress: 0
            }
          }

          const totalCompletion = selectedProjects.reduce(
            (sum: number, proj: any) => sum + (proj.completion_percentage || 0),
            0
          )
          const avgProgress = Math.round(totalCompletion / selectedProjects.length)

          return {
            course_id: item.course_systems.id,
            course_title: item.course_systems.title,
            course_system_key: courseSystemKey,
            assigned_at: item.assigned_at,
            progress: avgProgress
          }
        }

        // 其他课程（倾听）
        const { data: contents } = await supabase
          .from('course_contents')
          .select('id')
          .eq('system_id', item.course_systems.id)
          .eq('is_published', true)

        const totalContents = contents?.length || 0

        if (totalContents === 0 || !contents) {
          return {
            course_id: item.course_systems.id,
            course_title: item.course_systems.title,
            course_system_key: courseSystemKey,
            assigned_at: item.assigned_at,
            progress: 0
          }
        }

        const contentIds = contents.map((c: any) => c.id)
        const { data: progressRecords } = await supabase
          .from('user_progress')
          .select('ref_item_id, progress_value')
          .eq('user_id', userId)
          .in('ref_item_id', contentIds)
          .eq('progress_type', 'reading')

        let totalProgress = 0
        progressRecords?.forEach((record: any) => {
          totalProgress += record.progress_value || 0
        })

        const progress = Math.round(totalProgress / totalContents)

        return {
          course_id: item.course_systems.id,
          course_title: item.course_systems.title,
          course_system_key: courseSystemKey,
          assigned_at: item.assigned_at,
          progress
        }
      })
    )

    return enrolled
  } catch (error) {
    console.error('[usePortalCourses] 加载失败:', error)
    return []
  }
}

/**
 * Portal课程数据Hook - 带智能缓存
 *
 * 缓存策略（SWR智能缓存）：
 * - 【首次访问】查询数据库计算进度（3-4秒）✅ 正常等待
 * - 【后续访问】立即显示上次的数据（0秒）🚀 瞬间显示
 * - 【后台刷新】5分钟后悄悄更新数据 🔄 用户无感知
 * - 【跨页面共享】所有Portal页面共享同一份缓存 💾
 *
 * 用户体验：
 * 首次打开慢（3-4秒）→ 后续秒开（0秒）→ 数据自动保持最新
 */
export function usePortalCourses(userId: string | null) {
  const { data: courses, error, isLoading, isValidating } = useSWR(
    userId ? `portal-courses-${userId}` : null,
    () => fetchEnrolledCourses(userId!),
    {
      revalidateOnFocus: false,      // 窗口焦点不触发刷新
      revalidateOnReconnect: false,  // 网络重连不触发刷新
      dedupingInterval: 300000,      // 5分钟内相同请求直接用缓存（不发请求）
      refreshInterval: 300000,       // 5分钟后自动后台刷新数据
      errorRetryCount: 2,            // 错误重试2次
      errorRetryInterval: 1000,      // 重试间隔1秒
      shouldRetryOnError: true,      // 错误时重试
      keepPreviousData: true,        // 🔥 刷新时保持显示旧数据，新数据到达后平滑切换
    }
  )

  return {
    courses: courses || [],
    loading: isLoading && !courses,  // 只有在没有缓存数据时才显示loading
    isRefreshing: isValidating,      // 后台刷新状态
    error
  }
}
