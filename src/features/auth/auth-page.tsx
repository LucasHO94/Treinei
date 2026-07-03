import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Dumbbell, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  signInWithPassword,
  signUpWithPassword,
  sendPasswordReset,
} from '@/lib/supabase/auth'
import { enableGuestMode } from '@/lib/auth/current-user'
import { isSupabaseConfigured } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'recover'

const emailSchema = z.string().trim().email('E-mail inválido')
const passwordSchema = z.string().min(6, 'Mínimo de 6 caracteres')
const nameSchema = z.string().trim().min(2, 'Informe seu nome')

/** Traduz os erros mais comuns do Supabase Auth para PT-BR. */
function friendlyError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Já existe uma conta com esse e-mail. Faça login.'
  if (m.includes('password should be')) return 'A senha precisa de ao menos 6 caracteres.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Tente de novo em instantes.'
  return message
}

export function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    const emailR = emailSchema.safeParse(email)
    if (!emailR.success) return setError(emailR.error.issues[0].message)

    if (mode === 'recover') {
      setLoading(true)
      try {
        const { error } = await sendPasswordReset(emailR.data)
        if (error) throw error
        setNotice('Enviamos um link de recuperação para seu e-mail.')
      } catch (err) {
        setError(friendlyError((err as Error).message))
      } finally {
        setLoading(false)
      }
      return
    }

    const passR = passwordSchema.safeParse(password)
    if (!passR.success) return setError(passR.error.issues[0].message)

    if (mode === 'signup') {
      const nameR = nameSchema.safeParse(name)
      if (!nameR.success) return setError(nameR.error.issues[0].message)
      setLoading(true)
      try {
        const { data, error } = await signUpWithPassword({
          name: nameR.data,
          email: emailR.data,
          password: passR.data,
        })
        if (error) throw error
        // Sessão imediata = confirmação de e-mail desativada; senão, pede confirmação.
        if (data.session) navigate('/', { replace: true })
        else setNotice('Conta criada! Confirme seu e-mail para entrar.')
      } catch (err) {
        setError(friendlyError((err as Error).message))
      } finally {
        setLoading(false)
      }
      return
    }

    // login
    setLoading(true)
    try {
      const { error } = await signInWithPassword({ email: emailR.data, password: passR.data })
      if (error) throw error
      navigate('/', { replace: true })
    } catch (err) {
      setError(friendlyError((err as Error).message))
    } finally {
      setLoading(false)
    }
  }

  function handleGuest() {
    enableGuestMode()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Dumbbell className="size-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Treinei</h1>
          <p className="text-sm text-muted">Seu treino e sua dieta, num só lugar.</p>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <p className="rounded-md bg-destructive/15 p-3 text-center text-xs text-destructive">
          Backend não configurado. Você pode usar o app sem conta (dados só neste aparelho).
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'signup' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Nome</span>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Como quer ser chamado"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">E-mail</span>
          <Input
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {mode !== 'recover' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Senha</span>
            <Input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="rounded-md bg-primary/15 p-3 text-sm text-primary">{notice}</p>}

        <Button type="submit" size="lg" disabled={loading} className="mt-1">
          {loading && <Loader2 className="animate-spin" />}
          {mode === 'login' && 'Entrar'}
          {mode === 'signup' && 'Criar conta'}
          {mode === 'recover' && 'Enviar link de recuperação'}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        {mode === 'login' && (
          <>
            <button type="button" className="text-muted hover:text-foreground" onClick={() => switchMode('recover')}>
              Esqueci minha senha
            </button>
            <p className="text-muted">
              Não tem conta?{' '}
              <button type="button" className="font-medium text-primary" onClick={() => switchMode('signup')}>
                Criar conta
              </button>
            </p>
          </>
        )}
        {mode === 'signup' && (
          <p className="text-muted">
            Já tem conta?{' '}
            <button type="button" className="font-medium text-primary" onClick={() => switchMode('login')}>
              Entrar
            </button>
          </p>
        )}
        {mode === 'recover' && (
          <button type="button" className="font-medium text-primary" onClick={() => switchMode('login')}>
            Voltar ao login
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border" />
        ou
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" size="lg" onClick={handleGuest}>
        Experimentar sem conta
      </Button>
      <p className="-mt-3 text-center text-xs text-muted">
        Sem conta, seus dados ficam só neste aparelho. Você pode criar uma conta depois sem perdê-los.
      </p>
    </div>
  )
}
