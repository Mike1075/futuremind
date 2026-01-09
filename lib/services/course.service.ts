// @ts-nocheck
/**
 * CourseService - 课程数据管理服务
 *
 * 统一管理所有与课程相关的数据库操作
 * 提供类型安全的API，消除代码重复
 */

import { createClient } from '@/lib/supabase/server'
import type { CourseSystem, CourseContent } from '@/lib/supabase/database.types'

export class CourseService {
  /**
   * 根据system_key获取课程体系
   */
  static async getCourseSystemByKey(systemKey: string): Promise<CourseSystem | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('course_systems')
      .select('*')
      .eq('system_key', systemKey)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // 不存在
      }
      throw new Error(`查询课程体系失败: ${error.message}`)
    }

    return data
  }

  /**
   * 根据ID获取课程体系
   */
  static async getCourseSystemById(systemId: string): Promise<CourseSystem | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('course_systems')
      .select('*')
      .eq('id', systemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`查询课程体系失败: ${error.message}`)
    }

    return data
  }

  /**
   * 获取课程体系及其所有内容
   */
  static async getCourseWithContents(
    systemKey: string,
    includeUnpublished: boolean = false
  ): Promise<{ system: CourseSystem; contents: CourseContent[] } | null> {
    const system = await this.getCourseSystemByKey(systemKey)
    if (!system) {
      return null
    }

    const contents = await this.getContentsBySystemId(system.id, includeUnpublished)

    return { system, contents }
  }

  /**
   * 获取课程体系下的所有内容
   */
  static async getContentsBySystemId(
    systemId: string,
    includeUnpublished: boolean = false
  ): Promise<CourseContent[]> {
    const supabase = await createClient()

    let query = supabase
      .from('course_contents')
      .select('*')
      .eq('system_id', systemId)
      .order('sequence_number', { ascending: true })

    if (!includeUnpublished) {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`查询课程内容失败: ${error.message}`)
    }

    return data || []
  }

  /**
   * 根据ID获取课程内容详情
   */
  static async getContentById(contentId: string): Promise<CourseContent | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('course_contents')
      .select('*')
      .eq('id', contentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`查询课程内容失败: ${error.message}`)
    }

    return data
  }

  /**
   * 获取课程内容及其所属的课程体系
   */
  static async getContentWithSystem(
    contentId: string
  ): Promise<{ content: CourseContent; system: CourseSystem } | null> {
    const content = await this.getContentById(contentId)
    if (!content || !content.system_id) {
      return null
    }

    const system = await this.getCourseSystemById(content.system_id)
    if (!system) {
      return null
    }

    return { content, system }
  }

  /**
   * 获取相邻的课程内容（上一个/下一个）
   */
  static async getAdjacentContents(
    systemId: string,
    sequenceNumber: number,
    includeUnpublished: boolean = false
  ): Promise<{ prev: CourseContent | null; next: CourseContent | null }> {
    const supabase = await createClient()

    // 获取上一个
    let prevQuery = supabase
      .from('course_contents')
      .select('*')
      .eq('system_id', systemId)
      .lt('sequence_number', sequenceNumber)
      .order('sequence_number', { ascending: false })
      .limit(1)

    if (!includeUnpublished) {
      prevQuery = prevQuery.eq('is_published', true)
    }

    const { data: prevData } = await prevQuery

    // 获取下一个
    let nextQuery = supabase
      .from('course_contents')
      .select('*')
      .eq('system_id', systemId)
      .gt('sequence_number', sequenceNumber)
      .order('sequence_number', { ascending: true })
      .limit(1)

    if (!includeUnpublished) {
      nextQuery = nextQuery.eq('is_published', true)
    }

    const { data: nextData } = await nextQuery

    return {
      prev: prevData?.[0] || null,
      next: nextData?.[0] || null
    }
  }

  /**
   * 获取所有激活的课程体系列表
   */
  static async getAllActiveSystems(): Promise<CourseSystem[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('course_systems')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      throw new Error(`查询课程列表失败: ${error.message}`)
    }

    return data || []
  }

  /**
   * 检查课程内容的解锁状态
   * 根据structure_type使用不同的解锁逻辑
   */
  static async checkContentUnlockStatus(
    content: CourseContent,
    system: CourseSystem,
    checkFunction: (prerequisites: string[]) => Promise<boolean>
  ): Promise<{ isUnlocked: boolean; reason?: string }> {
    // 第一个内容总是解锁
    if (content.sequence_number === 1) {
      return { isUnlocked: true }
    }

    // 检查prerequisites字段
    const prerequisites = Array.isArray(content.prerequisites)
      ? content.prerequisites
      : []

    if (prerequisites.length > 0) {
      const isUnlocked = await checkFunction(prerequisites as string[])
      if (!isUnlocked) {
        return {
          isUnlocked: false,
          reason: '需要完成前置课程'
        }
      }
    }

    // 对于daily_sequential，如果没有明确的prerequisites，默认需要完成前一天
    if (system.structure_type === 'daily_sequential' && prerequisites.length === 0) {
      // 需要调用方提供前一个内容的ID来检查
      return {
        isUnlocked: true, // 默认解锁，由调用方处理
        reason: '需要完成前一天课程'
      }
    }

    return { isUnlocked: true }
  }

  /**
   * 检查倾听课程的解锁状态（链式检查）
   * 必须完成所有前置课程（分数>=60）才能解锁当前课程
   *
   * @param userId 用户ID
   * @param contentId 当前课程内容ID
   * @returns 是否解锁，以及未解锁时需要完成的课程
   */
  static async checkListeningCourseUnlock(
    userId: string,
    contentId: string
  ): Promise<{ isUnlocked: boolean; lockedReason?: string; requiredDay?: number }> {
    const supabase = await createClient()

    // 1. 获取当前课程内容及其所属体系
    const contentData = await this.getContentWithSystem(contentId)
    if (!contentData) {
      return { isUnlocked: false, lockedReason: '课程不存在' }
    }

    const { content, system } = contentData

    // 只对倾听课程（daily_sequential）进行检查
    if (system.structure_type !== 'daily_sequential') {
      return { isUnlocked: true }
    }

    // 第一天永远解锁
    if (content.sequence_number === 1) {
      return { isUnlocked: true }
    }

    // 2. 获取该课程体系中所有 sequence_number < 当前 的课程
    const { data: previousContents, error: contentsError } = await supabase
      .from('course_contents')
      .select('id, sequence_number')
      .eq('system_id', system.id)
      .eq('is_published', true)
      .lt('sequence_number', content.sequence_number)
      .order('sequence_number', { ascending: true })

    if (contentsError || !previousContents) {
      return { isUnlocked: false, lockedReason: '查询课程失败' }
    }

    // 3. 获取用户在这些课程中的最高分
    const previousContentIds = previousContents.map(c => c.id)

    if (previousContentIds.length === 0) {
      return { isUnlocked: true }
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from('user_submissions')
      .select('course_content_id, score')
      .eq('user_id', userId)
      .in('course_content_id', previousContentIds)
      .eq('status', 'approved')

    if (submissionsError) {
      return { isUnlocked: false, lockedReason: '查询提交记录失败' }
    }

    // 4. 创建分数映射（取最高分）
    const scoreMap = new Map<string, number>()
    submissions?.forEach(sub => {
      if (!sub.course_content_id) return
      const existingScore = scoreMap.get(sub.course_content_id) || 0
      if (sub.score && sub.score > existingScore) {
        scoreMap.set(sub.course_content_id, sub.score)
      }
    })

    // 5. 链式检查：从第1天开始，每一天都必须>=60分
    for (const prevContent of previousContents) {
      const score = scoreMap.get(prevContent.id) || 0
      if (score < 60) {
        return {
          isUnlocked: false,
          lockedReason: `需要先完成第${prevContent.sequence_number}天的课程（获得60分以上）`,
          requiredDay: prevContent.sequence_number
        }
      }
    }

    return { isUnlocked: true }
  }
}
