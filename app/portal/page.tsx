// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortalClient } from '@/components/portal/PortalClient'

// ✅ 启用30秒缓存，提升重复访问速度
export const revalidate = 30

async function PortalContent() {
  const supabase = await createClient()

  // ✅ 服务端认证 - 比客户端快
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ✅ 服务端并行查询数据 - 比客户端快
  const [profileResult, progressResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_progress')
      .select('consciousness_growth')
      .eq('user_id', user.id)
      .maybeSingle()
  ])

  const userRole = profileResult.data?.role || null
  const userName = profileResult.data?.full_name || user.user_metadata?.full_name || null
  const consciousnessGrowth = progressResult.data?.consciousness_growth || 0

  return (
    <PortalClient
      userId={user.id}
      userEmail={user.email!}
      userName={userName}
      userRole={userRole}
      consciousnessGrowth={consciousnessGrowth}
    />
  )
}

export default async function PortalPage() {
  return <PortalContent />
}
