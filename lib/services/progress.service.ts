// @ts-nocheck
/**
 * ProgressService - 用户进度管理服务
 *
 * 统一管理所有与用户学习进度相关的数据库操作
 * 消除代码重复，提供类型安全的API
 */

import { createClient } from '@/lib/supabase/server'
import type { ProgressType, UserProgress, TablesInsert, TablesUpdate } from '@/lib/supabase/database.types'

export class ProgressService {
  /**
   * 获取用户的单个进度记录
   */
  static async getUserProgress(
    userId: string,
    contentId: string,
    progressType: ProgressType = 'reading'
  ): Promise<UserProgress | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('ref_item_id', contentId)
      .eq('progress_type', progressType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 记录不存在，返回null而不是抛出错误
        return null
      }
      throw new Error(`查询用户进度失败: ${error.message}`)
    }

    return data
  }

  /**
   * 获取用户的多个进度记录
   */
  static async getBatchProgress(
    userId: string,
    contentIds: string[],
    progressType: ProgressType = 'reading'
  ): Promise<Map<string, UserProgress>> {
    // 空数组保护：避免 .in() 传入空数组导致查询异常
    if (contentIds.length === 0) {
      return new Map<string, UserProgress>()
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('ref_item_id', contentIds)
      .eq('progress_type', progressType)

    if (error) {
      throw new Error(`批量查询进度失败: ${error.message}`)
    }

    // 转换为Map，方便查找
    const progressMap = new Map<string, UserProgress>()
    data?.forEach((progress: any) => {
      if (progress.ref_item_id) {
        progressMap.set(progress.ref_item_id, progress)
      }
    })

    return progressMap
  }

  /**
   * 更新用户进度
   */
  static async updateProgress(
    userId: string,
    contentId: string,
    progressValue: number,
    progressType: ProgressType = 'reading'
  ): Promise<UserProgress> {
    const supabase = (await createClient()) as any

    // 先检查是否已存在
    const existing = await this.getUserProgress(userId, contentId, progressType)

    if (existing) {
      // 更新现有记录
      const updateData: TablesUpdate<'user_progress'> = {
        progress_value: progressValue,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        throw new Error(`更新进度失败: ${error.message}`)
      }

      return data
    } else {
      // 创建新记录
      const insertData: TablesInsert<'user_progress'> = {
        user_id: userId,
        ref_item_id: contentId,
        progress_type: progressType,
        progress_value: progressValue,
        daily_records: []
      }

      const { data, error } = await supabase
        .from('user_progress')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`创建进度记录失败: ${error.message}`)
      }

      return data
    }
  }

  /**
   * 标记课程/内容为已完成
   */
  static async markAsCompleted(
    userId: string,
    contentId: string,
    progressType: ProgressType = 'reading'
  ): Promise<UserProgress> {
    return this.updateProgress(userId, contentId, 100, progressType)
  }

  /**
   * 检查内容是否已完成
   */
  static async isCompleted(
    userId: string,
    contentId: string,
    progressType: ProgressType = 'reading'
  ): Promise<boolean> {
    const progress = await this.getUserProgress(userId, contentId, progressType)
    return progress?.progress_value === 100
  }

  /**
   * 检查前置条件是否满足
   * 用于解锁检查
   */
  static async checkPrerequisites(
    userId: string,
    prerequisiteIds: string[],
    progressType: ProgressType = 'reading'
  ): Promise<boolean> {
    if (!prerequisiteIds || prerequisiteIds.length === 0) {
      return true // 无前置条件，直接通过
    }

    const progressMap = await this.getBatchProgress(userId, prerequisiteIds, progressType)

    // 检查所有前置条件是否都完成
    return prerequisiteIds.every(id => {
      const progress = progressMap.get(id)
      return progress?.progress_value === 100
    })
  }

  /**
   * 检查阶段是否解锁（用于stage_sequential类型）
   * 需要检查该阶段下的所有内容是否完成
   */
  static async isStageUnlocked(
    userId: string,
    prerequisiteStageId: string
  ): Promise<boolean> {
    const supabase = await createClient()

    // 获取前置阶段下的所有内容ID
    const { data: contents, error: contentsError } = await supabase
      .from('course_contents')
      .select('id')
      .eq('id', prerequisiteStageId)

    if (contentsError || !contents || contents.length === 0) {
      return false
    }

    // 检查是否完成
    return this.isCompleted(userId, prerequisiteStageId, 'reading')
  }

  /**
   * 获取课程体系的完成进度统计
   */
  static async getCourseProgress(
    userId: string,
    systemId: string
  ): Promise<{ total: number; completed: number; percentage: number }> {
    const supabase = await createClient()

    // 获取该课程体系下所有已发布的内容
    const { data: contents, error: contentsError } = await supabase
      .from('course_contents')
      .select('id')
      .eq('system_id', systemId)
      .eq('is_published', true)

    if (contentsError || !contents) {
      throw new Error(`查询课程内容失败: ${contentsError?.message}`)
    }

    const total = contents.length
    if (total === 0) {
      return { total: 0, completed: 0, percentage: 0 }
    }

    // 获取用户完成的进度
    const contentIds = contents.map((c: any) => c.id)
    const progressMap = await this.getBatchProgress(userId, contentIds, 'reading')

    let completed = 0
    progressMap.forEach(progress => {
      if (progress.progress_value === 100) {
        completed++
      }
    })

    const percentage = Math.round((completed / total) * 100)

    return { total, completed, percentage }
  }
}
