import { useState } from 'react'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push/subscribe'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { usePushPermission } from './lib/use-push-status'

interface PushPermissionCardProps {
  userId: string
}

/** Onboarding de permissão (RF17): explica o valor antes do prompt nativo do navegador. */
export function PushPermissionCard({ userId }: PushPermissionCardProps) {
  const permission = usePushPermission()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnable() {
    setBusy(true)
    setError(null)
    try {
      await subscribeToPush(userId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ativar as notificações.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setBusy(true)
    setError(null)
    try {
      await unsubscribeFromPush()
    } finally {
      setBusy(false)
    }
  }

  if (permission === 'unsupported') {
    return <p className="text-sm text-muted">Este navegador não suporta notificações push.</p>
  }

  if (permission === 'denied') {
    return (
      <p className="text-sm text-destructive">
        Permissão de notificação negada no navegador. Reative nas configurações do site para receber lembretes.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted">
        Receba um aviso na hora de cada refeição e nos dias de treino — mesmo com o app fechado.
      </p>
      {!isSupabaseConfigured && (
        <p className="text-xs text-muted">
          Requer um projeto Supabase configurado (ver README) — o envio depende do backend.
        </p>
      )}
      {permission === 'granted' ? (
        <Button size="sm" variant="outline" onClick={handleDisable} disabled={busy} className="self-start">
          {busy ? 'Desativando...' : 'Desativar notificações'}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="accent"
          onClick={handleEnable}
          disabled={busy || !isSupabaseConfigured}
          className="self-start"
        >
          {busy ? 'Ativando...' : 'Ativar notificações'}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
