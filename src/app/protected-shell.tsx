import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { AppLayout } from './layout'
import { useSession } from '@/lib/supabase/auth'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { isGuestMode, disableGuestMode, peekLocalUserId } from '@/lib/auth/current-user'
import { migrateGuestData } from '@/lib/auth/migrate-guest'
import { pullAll } from '@/lib/sync/engine'

function Splash() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-primary">
      <Dumbbell className="size-10 animate-pulse" />
    </div>
  )
}

/**
 * Gate de rotas (V3.2): sem sessão e sem modo convidado → redireciona para /entrar.
 * Ao autenticar pela primeira vez, migra os dados de convidado para a conta e puxa o
 * estado do servidor (login em dispositivo novo). Sem backend configurado, o app abre
 * direto (fallback offline-first, comportamento pré-V3.2).
 */
export function ProtectedShell() {
  const session = useSession()
  const handledUserId = useRef<string | null>(null)
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (!userId) {
      handledUserId.current = null
      return
    }
    if (handledUserId.current === userId) return
    handledUserId.current = userId
    disableGuestMode()

    void (async () => {
      const guestId = peekLocalUserId()
      if (guestId) await migrateGuestData(guestId, userId)
      await pullAll(userId)
    })()
  }, [userId])

  if (!isSupabaseConfigured) return <AppLayout />
  if (session === null) return <Splash />
  if (session === undefined) return isGuestMode() ? <AppLayout /> : <Navigate to="/entrar" replace />
  return <AppLayout />
}
