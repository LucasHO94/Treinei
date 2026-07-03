import { useState } from 'react'
import { ChevronDown, ShieldBan, ShieldCheck, History, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { setUserBanned, clearUserHistory, deleteUser } from './lib/actions'
import type { AdminUserRow } from '@/types/domain'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isBanned(user: AdminUserRow): boolean {
  return Boolean(user.banned_until) && new Date(user.banned_until!).getTime() > Date.now()
}

export function AdminUserRowCard({
  user,
  isSelf,
  onChanged,
}: {
  user: AdminUserRow
  isSelf: boolean
  onChanged: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'ban' | 'unban' | 'clear' | 'delete' | null>(null)
  const banned = isBanned(user)

  async function run(action: 'ban' | 'unban' | 'clear' | 'delete') {
    if (action === 'ban') await setUserBanned(user.user_id, true)
    if (action === 'unban') await setUserBanned(user.user_id, false)
    if (action === 'clear') await clearUserHistory(user.user_id)
    if (action === 'delete') await deleteUser(user.user_id)
    onChanged()
  }

  return (
    <Card>
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between gap-2 p-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium">{user.full_name || 'Sem nome'}</p>
            {isSelf && <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted">você</span>}
            {user.role === 'admin' && (
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">gestor</span>
            )}
            {banned && (
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                desabilitado
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
            <p>Criado em: {formatDateTime(user.created_at)}</p>
            <p>Último login: {formatDateTime(user.last_sign_in_at)}</p>
            <p>Última atividade: {formatDateTime(user.last_activity)}</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-muted">
            <span>{user.routines_count} rotina(s)</span>
            <span>{user.workout_sessions_count} treino(s) concluído(s)</span>
            <span>{user.meals_count} refeição(ões)</span>
            <span>{user.meal_logs_count} check-in(s)</span>
          </div>

          {!isSelf && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction(banned ? 'unban' : 'ban')}
              >
                {banned ? <ShieldCheck className="size-4" /> : <ShieldBan className="size-4" />}
                {banned ? 'Habilitar' : 'Desabilitar'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmAction('clear')}>
                <History className="size-4" /> Limpar histórico
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirmAction('delete')}>
                <Trash2 className="size-4" /> Excluir conta
              </Button>
            </div>
          )}
        </CardContent>
      )}

      <ConfirmDialog
        open={confirmAction === 'ban'}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Desabilitar conta"
        description={`"${user.email}" não vai mais conseguir entrar no app até você habilitar de novo. Os dados dele(a) continuam salvos.`}
        confirmLabel="Desabilitar"
        onConfirm={() => run('ban')}
      />
      <ConfirmDialog
        open={confirmAction === 'unban'}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Habilitar conta"
        description={`"${user.email}" vai poder entrar no app normalmente de novo.`}
        confirmLabel="Habilitar"
        confirmVariant="accent"
        onConfirm={() => run('unban')}
      />
      <ConfirmDialog
        open={confirmAction === 'clear'}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Limpar histórico"
        description={`Apaga o histórico de treinos concluídos, check-ins de refeição e registros de peso de "${user.email}". As rotinas, refeições e o perfil continuam intactos. Essa ação não pode ser desfeita.`}
        confirmLabel="Limpar histórico"
        onConfirm={() => run('clear')}
      />
      <ConfirmDialog
        open={confirmAction === 'delete'}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Excluir conta"
        description={`Apaga permanentemente a conta "${user.email}" e todos os dados dela (rotinas, treinos, dieta, perfil, fotos). Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir conta"
        onConfirm={() => run('delete')}
      />
    </Card>
  )
}
