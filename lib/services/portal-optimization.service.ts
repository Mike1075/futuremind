/**
 * Portal页面性能优化服务
 * 将多个串行查询优化为并行查询
 */

import { createClient } from '@/lib/supabase/client'

interface EnrolledCourse {
  course_id: string
  course_title: string
  course_system_key: string
  assigned_at: string
  progress?: number
}

export class PortalOptimizationService {
  /**
   * 批量加载所有课程进度（优化版）
   * 从O(n*m)时间复杂度优化到O(1)
   */
  static async loadEnrolledCoursesOptimized(
    userId: string,
    enrolledData: any[]
  ): Promise<EnrolledCourse[]> {
    const supabase = createClient()

    // 过滤有效课程
    const validEnrollments = enrolledData.filter(
      (item: any) => item.course_systems !== null && item.course_systems.is_active === true
    )

    if (validEnrollments.length === 0) {
      return []
    }

    // 提取所有课程ID和system_key
    const courseIds = validEnrollments.map((item: any) => item.course_systems.id)
    const courseMap = new Map(
      validEnrollments.map((item: any) => [
        item.course_systems.id,
        {
          id: item.course_systems.id,
          title: item.course_systems.title,
          system_key: item.course_systems.system_key,
          assigned_at: item.assigned_at
        }
      ])
    )

    // ✅ 并行查询所有需要的数据
    const [contentsData, selectedProjectsData, progressRecordsData] = await Promise.all([
      // 一次性获取所有课程的内容
      supabase
        .from('course_contents')
        .select('id, system_id')
        .in('system_id', courseIds)
        .eq('is_published', true),

      // 一次性获取所有PBL项目选择
      supabase
        .from('user_selected_projects')
        .select('project_id, completion_percentage')
        .eq('user_id', userId)
        .eq('status', 'active'),

      // 一次性获取所有进度记录
      supabase
        .from('user_progress')
        .select('ref_item_id, progress_value')
        .eq('user_id', userId)
        .eq('progress_type', 'reading')
    ])

    // 构建内容映射（按课程ID分组）
    const contentsMap = new Map<string, string[]>()
    contentsData.data?.forEach((content: any) => {
      if (!contentsMap.has(content.system_id)) {
        contentsMap.set(content.system_id, [])
      }
      contentsMap.get(content.system_id)!.push(content.id)
    })

    // 构建选择项目映射
    const selectedProjectsMap = new Map(
      selectedProjectsData.data?.map((sp: any) => [sp.project_id, sp.completion_percentage]) || []
    )

    // 构建进度映射
    const progressMap = new Map(
      progressRecordsData.data?.map((pr: any) => [pr.ref_item_id, pr.progress_value]) || []
    )

    // ✅ 地球课程：批量调用API
    const earthCourses = validEnrollments.filter(
      (item: any) => item.course_systems.system_key === 'earth'
    )
    let earthProgressMap = new Map<string, number>()

    if (earthCourses.length > 0) {
      try {
        // 并行调用所有地球课程的进度API
        const earthProgressPromises = earthCourses.map((item: any) =>
          fetch(
            `/api/progress/earth-course-progress?courseSystemId=${item.course_systems.id}&userId=${userId}`
          ).then(async (res) => {
            if (res.ok) {
              const data = await res.json()
              return [item.course_systems.id, data.progress || 0]
            }
            return [item.course_systems.id, 0]
          })
        )

        const earthProgressResults = await Promise.all(earthProgressPromises)
        earthProgressMap = new Map(earthProgressResults as [string, number][])
      } catch (error) {
        console.error('[PortalOptimization] 批量获取地球课程进度失败:', error)
      }
    }

    // ✅ 计算每个课程的进度
    const enrolled: EnrolledCourse[] = validEnrollments.map((item: any) => {
      const courseId = item.course_systems.id
      const systemKey = item.course_systems.system_key
      const course = courseMap.get(courseId)!

      // 地球课程
      if (systemKey === 'earth') {
        return {
          course_id: courseId,
          course_title: course.title,
          course_system_key: systemKey,
          assigned_at: course.assigned_at,
          progress: earthProgressMap.get(courseId) || 0
        }
      }

      // PBL课程
      if (systemKey === 'icarus' || systemKey === 'pbl') {
        const contentIds = contentsMap.get(courseId) || []
        if (contentIds.length === 0) {
          return {
            course_id: courseId,
            course_title: course.title,
            course_system_key: systemKey,
            assigned_at: course.assigned_at,
            progress: 0
          }
        }

        // 计算已选择项目的平均完成度
        const selectedProjects = contentIds
          .map((cid) => selectedProjectsMap.get(cid))
          .filter((cp) => cp !== undefined)

        if (selectedProjects.length === 0) {
          return {
            course_id: courseId,
            course_title: course.title,
            course_system_key: systemKey,
            assigned_at: course.assigned_at,
            progress: 0
          }
        }

        const totalCompletion = selectedProjects.reduce((sum, cp) => sum + (cp || 0), 0)
        const avgProgress = Math.round(totalCompletion / selectedProjects.length)

        return {
          course_id: courseId,
          course_title: course.title,
          course_system_key: systemKey,
          assigned_at: course.assigned_at,
          progress: avgProgress
        }
      }

      // 其他课程（倾听）
      const contentIds = contentsMap.get(courseId) || []
      if (contentIds.length === 0) {
        return {
          course_id: courseId,
          course_title: course.title,
          course_system_key: systemKey,
          assigned_at: course.assigned_at,
          progress: 0
        }
      }

      // 计算平均进度
      let totalProgress = 0
      contentIds.forEach((cid) => {
        totalProgress += progressMap.get(cid) || 0
      })

      const progress = Math.round(totalProgress / contentIds.length)

      return {
        course_id: courseId,
        course_title: course.title,
        course_system_key: systemKey,
        assigned_at: course.assigned_at,
        progress
      }
    })

    return enrolled
  }
}
