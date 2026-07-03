import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/supabase/auth'
import { logout } from '@/lib/auth/logout'

export function AccountCard() {
  const navigate = useNavigate()
  const session = useSession()
  const [busy, setBusy] = useState(false)

  const isAuthed = Boolean(session)

  async function handleLogout() {
    setBusy(true)
    try {
      await logout()
      navigate('/entrar', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conta</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isAuthed ? (
          <>
            <div>
              <p className="text-sm font-medium">{session?.user.email}</p>
              <p className="text-xs text-muted">Seus dados são sincronizados e ficam salvos na sua conta.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} disabled={busy} className="self-start">
              <LogOut className="size-4" /> {busy ? 'Saindo...' : 'Sair'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Você está usando o app sem conta. Seus dados ficam só neste aparelho. Crie uma conta para
              sincronizar e não perder nada ao trocar de celular.
            </p>
            <Button variant="accent" size="sm" onClick={() => navigate('/entrar')} className="self-start">
              <UserPlus className="size-4" /> Criar conta / Entrar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
