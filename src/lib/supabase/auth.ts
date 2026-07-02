import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

export function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
}

export function signOut() {
  return supabase.auth.signOut()
}

/** Sessão reativa do Supabase Auth — null enquanto carrega, undefined se deslogado. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? undefined))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? undefined)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  return session
}
