import { useMemo } from 'react'
import { useSession } from '@/lib/supabase/auth'

const LOCAL_USER_KEY = 'treinei:local-user-id'
const GUEST_MODE_KEY = 'treinei:guest-mode'

/** ID do usuário convidado (offline, sem conta), persistido no dispositivo. */
export function getLocalUserId(): string {
  let id = localStorage.getItem(LOCAL_USER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(LOCAL_USER_KEY, id)
  }
  return id
}

/** Existe um ID de convidado já criado neste dispositivo? (dados locais a migrar). */
export function peekLocalUserId(): string | null {
  return localStorage.getItem(LOCAL_USER_KEY)
}

/** O usuário escolheu explicitamente usar o app sem conta. */
export function isGuestMode(): boolean {
  return localStorage.getItem(GUEST_MODE_KEY) === '1'
}

export function enableGuestMode(): void {
  localStorage.setItem(GUEST_MODE_KEY, '1')
}

export function disableGuestMode(): void {
  localStorage.removeItem(GUEST_MODE_KEY)
}

/**
 * ID efetivo do usuário para leitura/escrita de dados. Uma sessão Supabase real
 * tem prioridade; sem ela, cai no usuário convidado local (fluxo offline-first).
 */
export function useCurrentUserId(): string {
  const session = useSession()
  return useMemo(() => session?.user.id ?? getLocalUserId(), [session])
}
