import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

/** Cadastro por e-mail + senha. O nome vai em user_metadata (lido no perfil). */
export function signUpWithPassword(params: { name: string; email: string; password: string }) {
  return supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: { full_name: params.name },
      emailRedirectTo: window.location.origin,
    },
  })
}

/** Login por e-mail + senha. */
export function signInWithPassword(params: { email: string; password: string }) {
  return supabase.auth.signInWithPassword({ email: params.email, password: params.password })
}

/** Envia e-mail de recuperação de senha; o link volta para /recuperar-senha. */
export function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/recuperar-senha`,
  })
}

/** Define a nova senha (usado na tela de recuperação, já com sessão de recovery ativa). */
export function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword })
}

/** Login sem senha por link mágico (alternativa mantida). */
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
