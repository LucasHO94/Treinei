import { useMemo } from 'react'
import { useSession } from '@/lib/supabase/auth'

const LOCAL_USER_KEY = 'treinei:local-user-id'

function getLocalUserId(): string {
  let id = localStorage.getItem(LOCAL_USER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(LOCAL_USER_KEY, id)
  }
  return id
}

/**
 * Sem tela de login ainda (Fase 4), o app opera com um usuário local persistido
 * no dispositivo para que todo o fluxo offline-first funcione sem backend.
 * Uma sessão Supabase real, quando existir, tem prioridade.
 */
export function useCurrentUserId(): string {
  const session = useSession()
  return useMemo(() => session?.user.id ?? getLocalUserId(), [session])
}
