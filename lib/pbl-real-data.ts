// PBL真实数据服务 - 从Supabase读取
import { createClient } from '@/lib/supabase/client'
import type { PBLProject } from './pbl-data'

export class RealPBLDataService {
  /**
   * 从course_contents表读取PBL项目
   */
  static async getProjects(): Promise<PBLProject[]> {
    const supabase = createClient()

    try {
      // 1. 获取所有PBL类型的课程体系
      const { data: pblSystems, error: systemsError } = await supabase
        .from('course_systems')
        .select('id, system_key, title, description')
        .or('system_key.eq.pbl,system_key.eq.icarus,structure_type.eq.stage_sequential')
        .eq('is_active', true)

      if (systemsError) {
        console.error('获取PBL课程体系失败:', systemsError)
        return []
      }

      if (!pblSystems || pblSystems.length === 0) {
        return []
      }

      // 2. 获取这些体系下的所有内容（项目）
      const systemIds = pblSystems.map((s: any) => s.id)
      const { data: contents, error: contentsError } = await supabase
        .from('course_contents')
        .select('*')
        .in('system_id', systemIds)
        .eq('is_published', true)
        .order('sequence_number', { ascending: true })

      if (contentsError) {
        console.error('获取PBL项目内容失败:', contentsError)
        return []
      }

      if (!contents || contents.length === 0) {
        return []
      }

      // 3. 获取项目注册情况
      const { data: enrollments } = await (supabase
        .from('pbl_project_enrollments')
        .select('content_id')

      const enrollmentCounts = new Map<string, number>()
      if (enrollments) {
        enrollments.forEach((e: any) => {
          enrollmentCounts.set(e.content_id, (enrollmentCounts.get(e.content_id) || 0) + 1)
        })
      }

      // 4. 转换为PBLProject格式
      const projects: PBLProject[] = contents.map((content: any) => {
        const system = pblSystems.find((s: any) => s.id === content.system_id)
        const currentParticipants = enrollmentCounts.get(content.id) || 0

        // 从subtitle解析难度级别（如果有）
        let difficulty: PBLProject['difficulty_level'] = 'intermediate'
        if (content.subtitle) {
          const sub = content.subtitle.toLowerCase()
          if (sub.includes('option_a') || sub.includes('beginner') || sub.includes('初级')) {
            difficulty = 'beginner'
          } else if (sub.includes('option_c') || sub.includes('advanced') || sub.includes('高级')) {
            difficulty = 'advanced'
          } else if (sub.includes('option_d') || sub.includes('expert') || sub.includes('专家')) {
            difficulty = 'expert'
          }
        }

        // 从标题推断分类
        let category: PBLProject['category'] = 'science'
        const title = content.title.toLowerCase()
        if (title.includes('意识') || title.includes('冥想') || title.includes('觉察')) {
          category = 'consciousness'
        } else if (title.includes('创作') || title.includes('艺术') || title.includes('表达')) {
          category = 'creative'
        } else if (title.includes('引导') || title.includes('对话') || title.includes('探索')) {
          category = 'guidance'
        }

        // 提取学习目标和要求
        let learningObjectives: string[] = []
        let requirements: string[] = []

        if (content.goals) {
          learningObjectives = content.goals.split('\n').filter((line: string) => line.trim())
        }

        // 提取标签
        let tags: string[] = []
        if (system?.title) {
          tags.push(system.title)
        }
        if (difficulty === 'beginner') tags.push('入门')
        if (difficulty === 'intermediate') tags.push('进阶')
        if (difficulty === 'advanced') tags.push('高级')
        if (difficulty === 'expert') tags.push('专家')

        // 状态判断
        let status: PBLProject['status'] = 'recruiting'
        if (currentParticipants >= 20) {
          status = 'active'
        }

        return {
          id: content.id,
          title: content.title,
          description: content.subtitle || content.original_text?.substring(0, 200) || system?.description || '',
          category,
          difficulty_level: difficulty,
          status,
          max_participants: 25,
          current_participants: currentParticipants,
          duration_weeks: content.estimated_duration || Math.ceil((content.week_plan?.length || 4) / 1),
          learning_objectives: learningObjectives,
          requirements,
          tags,
          creator_id: 'system',
          created_at: content.created_at,
          updated_at: content.updated_at,
        }
      })

      return projects

    } catch (error) {
      console.error('❌ 加载PBL项目失败:', error)
      return []
    }
  }

  /**
   * 获取单个项目详情
   */
  static async getProject(projectId: string): Promise<PBLProject | null> {
    const supabase = createClient()

    try {
      const { data: content, error } = await (supabase
        .from('course_contents')
        .select(`
          *,
          course_systems (
            title,
            description
          )
        `)
        .eq('id', projectId)
        .single()

      if (error || !content) {
        console.error('获取项目详情失败:', error)
        return null
      }

      // 转换格式（同上）
      // ... 省略转换逻辑，与getProjects类似

      return null // TODO: 实现单项目转换
    } catch (error) {
      console.error('获取项目详情失败:', error)
      return null
    }
  }
}

// 导出为默认的pblDataService
export const pblDataService = RealPBLDataService
