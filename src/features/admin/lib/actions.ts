import { supabase } from '@/lib/supabase/client'

async function callRpc(fn: string, args: Record<string, unknown>) {
  const { error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
}

export function setUserBanned(targetUserId: string, banned: boolean) {
  return callRpc('admin_set_user_banned', { target_user_id: targetUserId, banned })
}

export function clearUserHistory(targetUserId: string) {
  return callRpc('admin_clear_user_history', { target_user_id: targetUserId })
}

export function deleteUser(targetUserId: string) {
  return callRpc('admin_delete_user', { target_user_id: targetUserId })
}
