import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { AdminUserRow } from '@/types/domain'

interface AdminUsersState {
  users: AdminUserRow[]
  loading: boolean
  error: string | null
}

/** Lista todos os usuários via RPC (admin_list_users) — não passa pelo Dexie/outbox local. */
export function useAdminUsers() {
  const [state, setState] = useState<AdminUsersState>({ users: [], loading: true, error: null })

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) {
      setState({ users: [], loading: false, error: error.message })
      return
    }
    setState({ users: (data ?? []) as AdminUserRow[], loading: false, error: null })
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { ...state, refetch }
}
