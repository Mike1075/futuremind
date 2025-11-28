// @ts-nocheck
// API Route: /api/admin/students
// Description: 学员列表API - 支持搜索、筛选、排序
// 权限：校长和老师

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { requireRole, errorResponse } from '@/lib/api-utils'

// Whitelist of allowed sort columns (SEC-02 fix)
const ALLOWED_SORT_COLUMNS = [
  'composite_score',
  'percentile_rank',
  'consciousness_level',
  'created_at',
  'level_updated_at',
  'full_name',
  'email'
] as const

async function handleGetStudents(request: NextRequest) {
  const startTime = Date.now()

  try {
    logger.info('Admin students list request')

    // 1. Permission validation - require principal or teacher role
    const auth = await requireRole(request, ['principal', 'teacher'])
    if (!auth.authorized) {
      return auth.response
    }

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    // 2. Parse and validate query parameters
    // SEC-07: 限制搜索参数长度（防止DoS攻击）
    const searchRaw = searchParams.get('search') || ''
    const search = searchRaw.slice(0, 100)
    const levelFilter = searchParams.get('level') || ''
    const sortByParam = searchParams.get('sortBy') || 'composite_score'
    const sortOrderParam = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100) // Max 100

    // SEC-02: Validate sortBy against whitelist
    const sortBy = ALLOWED_SORT_COLUMNS.includes(sortByParam as any)
      ? sortByParam
      : 'composite_score'

    if (sortByParam !== sortBy) {
      logger.warn('Invalid sort column attempted', { attempted: sortByParam })
    }

    // Validate sortOrder
    const sortOrder = ['asc', 'desc'].includes(sortOrderParam) ? sortOrderParam : 'desc'

    logger.debug('Query parameters', {
      search: search ? '***' : '',
      levelFilter,
      sortBy,
      sortOrder,
      page,
      pageSize
    })

    // 3. Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        consciousness_level,
        composite_score,
        percentile_rank,
        level_updated_at,
        created_at
      `, { count: 'exact' })
      .eq('role', 'student')

    // 4. Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // 5. Apply level filter
    if (levelFilter) {
      const level = parseInt(levelFilter)
      if (!isNaN(level) && level >= 0 && level <= 12) {
        query = query.eq('consciousness_level', level)
      }
    }

    // 6. Apply sorting (now safe with whitelist)
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // 7. Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    // 8. Execute query
    logger.dbQuery('profiles', 'SELECT')
    const { data: students, error, count } = await query

    if (error) throw error

    const duration = Date.now() - startTime
    logger.info('Students list retrieved', {
      count: students?.length || 0,
      total: count || 0,
      duration: `${duration}ms`
    })

    // 9. Return results
    return NextResponse.json({
      students,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    })

  } catch (error: any) {
    logger.error('Failed to fetch students', error, {
      duration: `${Date.now() - startTime}ms`
    })
    return errorResponse('Failed to fetch students', error, 500)
  }
}

// Export with rate limiting
export const GET = withRateLimit(
  handleGetStudents,
  rateLimitConfigs.api
)
