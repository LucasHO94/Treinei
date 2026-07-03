import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/lib/supabase/auth'
import { useSession } from '@/lib/supabase/auth'

const passwordSchema = z.string().min(6, 'Mínimo de 6 caracteres')

/**
 * Landing do link de recuperação de senha (V3.2). O Supabase abre esta rota já com uma
 * sessão de recovery ativa (evento PASSWORD_RECOVERY); aqui o usuário define a nova senha.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const session = useSession()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) return setError(parsed.error.issues[0].message)

    setLoading(true)
    try {
      const { error } = await updatePassword(parsed.data)
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck className="size-8" />
        </div>
        <h1 className="text-xl font-bold">Definir nova senha</h1>
      </div>

      {session === undefined ? (
        <p className="rounded-md bg-destructive/15 p-3 text-center text-sm text-destructive">
          Link inválido ou expirado. Volte ao login e peça um novo link de recuperação.
        </p>
      ) : done ? (
        <p className="rounded-md bg-primary/15 p-3 text-center text-sm text-primary">
          Senha atualizada! Redirecionando...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Nova senha</span>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading || session === null}>
            {loading && <Loader2 className="animate-spin" />}
            Salvar nova senha
          </Button>
        </form>
      )}

      <button
        type="button"
        className="text-center text-sm font-medium text-primary"
        onClick={() => navigate('/entrar', { replace: true })}
      >
        Voltar ao login
      </button>
    </div>
  )
}
