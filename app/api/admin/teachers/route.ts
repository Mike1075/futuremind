import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireRole, errorResponse, validateParams } from '@/lib/api-utils'

// GET /api/admin/teachers - 获取教师列表
async function handleGetTeachers(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.info('Get teachers list request')

    // 权限验证 - 只有校长可以管理教师
    const auth = await requireRole(request, ['principal'])
    if (!auth.authorized) {
      return auth.response
    }

    const { supabase } = auth

    // 获取所有教师列表
    logger.dbQuery('profiles', 'SELECT')
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (teachersError) {
      throw teachersError
    }

    const duration = Date.now() - startTime
    logger.info('Teachers list retrieved', {
      count: teachers?.length || 0,
      duration: `${duration}ms`
    })

    return NextResponse.json({ teachers })
  } catch (error) {
    logger.error('Failed to fetch teachers', error, {
      duration: `${Date.now() - startTime}ms`
    })
    return errorResponse('Failed to fetch teachers', error, 500)
  }
}

export const GET = withRateLimit(handleGetTeachers, rateLimitConfigs.api)

// POST /api/admin/teachers - 添加教师（通过邮箱）
async function handleAddTeacher(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.info('Add teacher request')

    // 权限验证 - 只有校长可以添加教师
    const auth = await requireRole(request, ['principal'])
    if (!auth.authorized) {
      return auth.response
    }

    const { supabase } = auth

    // 解析和验证请求参数
    const body = await request.json()
    const validation = validateParams(body, {
      email: {
        required: true,
        type: 'string',
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Email regex
      }
    })

    if (!validation.valid) {
      return validation.response
    }

    const { email } = body

    logger.debug('Looking up user by email', { email: '***' })

    // 查找该邮箱对应的用户
    logger.dbQuery('profiles', 'SELECT')
    const { data: targetUser, error: findError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', email)
      .single()

    if (findError || !targetUser) {
      logger.warn('User not found', { email: '***' })
      return NextResponse.json(
        { error: 'User with this email not found. Please make sure the user has registered.' },
        { status: 404 }
      )
    }

    const targetUserData = targetUser as unknown as {
      id: string
      email: string
      full_name: string | null
      role?: string
    }

    // 检查是否已经是教师
    if (targetUserData.role === 'teacher') {
      logger.warn('User already a teacher', { userId: targetUserData.id })
      return NextResponse.json(
        { error: 'This user is already a teacher' },
        { status: 400 }
      )
    }

    // 将用户角色设为 teacher - 使用管理员客户端绕过 RLS
    logger.dbQuery('profiles', 'UPDATE')
    const adminSupabase = createAdminClient() as any
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ role: 'teacher' })
      .eq('id', targetUserData.id)

    if (updateError) {
      throw updateError
    }

    const duration = Date.now() - startTime
    logger.info('Teacher added successfully', {
      teacherId: targetUserData.id,
      duration: `${duration}ms`
    })

    // 创建 teacher_assignments 记录（由触发器自动创建，这里返回成功即可）
    return NextResponse.json({
      message: 'Teacher added successfully',
      teacher: {
        id: targetUserData.id,
        email: targetUserData.email,
        full_name: targetUserData.full_name
      }
    })
  } catch (error) {
    logger.error('Failed to add teacher', error, {
      duration: `${Date.now() - startTime}ms`
    })
    return errorResponse('Failed to add teacher', error, 500)
  }
}

export const POST = withRateLimit(handleAddTeacher, rateLimitConfigs.api)
