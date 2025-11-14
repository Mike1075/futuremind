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

    // ⚡ 性能优化：快速返回课程列表，暂不计算进度
    // 原因：进度计算太慢（地球课程需要50次数据库查询，耗时3-5秒）
    // 解决：先显示课程列表，进度暂时显示0%，不影响用户点击进入课程
    // 备注：进度计算逻辑已注释在下方，如需恢复请取消注释
    const enrolled: EnrolledCourse[] = validEnrollments.map((item: any) => ({
      course_id: item.course_systems.id,
      course_title: item.course_systems.title,
      course_system_key: item.course_systems.system_key,
      assigned_at: item.assigned_at,
      progress: 0  // 暂时显示0%，用户可正常点击课程
    }))

    return enrolled
  } catch (error) {
    console.error('[usePortalCourses] 加载失败:', error)
    return []
  }
}

/**
 * Portal课程数据Hook - 带智能缓存
 *
 * 特性：
 * - 首次访问查询数据库（4-5秒）
 * - 后续访问从缓存读取（0秒，瞬间显示）
 * - 60秒后自动后台刷新
 * - 跨页面共享缓存
 */
export function usePortalCourses(userId: string | null) {
  const { data: courses, error, isLoading, isValidating } = useSWR(
    userId ? `portal-courses-${userId}` : null,
    () => fetchEnrolledCourses(userId!),
    {
      revalidateOnFocus: false,      // 窗口获得焦点时不重新验证
      revalidateOnReconnect: false,  // 网络重连时不重新验证
      dedupingInterval: 60000,       // 60秒内不重复请求
      refreshInterval: 60000,        // 60秒后台自动刷新
      errorRetryCount: 2,            // 错误重试2次
      errorRetryInterval: 1000,      // 重试间隔1秒
      shouldRetryOnError: true,      // 错误时重试
      keepPreviousData: true,        // 🔥 保持旧数据显示，直到新数据加载完成
      // ⚠️ 移除fallbackData，让SWR使用缓存数据
    }
  )

  return {
    courses: courses || [],
    loading: isLoading && !courses,  // 只有在没有缓存数据时才显示loading
    isRefreshing: isValidating,      // 后台刷新状态
    error
  }
}
