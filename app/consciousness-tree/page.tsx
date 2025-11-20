import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConsciousnessTreeClient } from '@/components/consciousness/ConsciousnessTreeClient'

export default async function ConsciousnessTreePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 获取用户角色
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || null

  return <ConsciousnessTreeClient userId={user.id} userRole={userRole} />
}
