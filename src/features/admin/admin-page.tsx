import { useMemo, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useSession } from '@/lib/supabase/auth'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useUserProfile } from '@/features/profile/lib/queries'
import { useAdminUsers } from './lib/queries'
import { AdminUserRowCard } from './user-row'

/**
 * Autorização real acontece no Postgres (is_admin() dentro de cada função RPC) — esta
 * checagem client-side só evita renderizar a tela para quem não é gestor.
 */
export function AdminPage() {
  const session = useSession()
  const userId = useCurrentUserId()
  const profile = useUserProfile(userId)
  const { users, loading, error, refetch } = useAdminUsers()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q),
    )
  }, [users, search])

  if (!session) return <Navigate to="/entrar" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/perfil" replace />

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/perfil')} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">Painel de gestor</h1>
      </header>

      <Input
        placeholder="Buscar por nome ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">Erro ao carregar usuários: {error}</p>}

      {!loading && !error && (
        <>
          <p className="text-xs text-muted">
            {filtered.length} de {users.length} usuário(s)
          </p>
          <div className="flex flex-col gap-2">
            {filtered.map((u) => (
              <AdminUserRowCard key={u.user_id} user={u} isSelf={u.user_id === session.user.id} onChanged={refetch} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
