import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserProfile, useLatestBodyMetric } from './lib/queries'
import { setUserProfile } from './lib/actions'
import { uploadAvatar, avatarPublicUrl } from '@/lib/supabase/storage'

interface ProfileHeaderProps {
  userId: string
  /** Nome vindo do cadastro (user_metadata) — usado enquanto não há perfil salvo. */
  fallbackName?: string | null
  /** Só usuários autenticados podem enviar imagens (RLS do Storage). */
  canUpload: boolean
}

export function ProfileHeader({ userId, fallbackName, canUpload }: ProfileHeaderProps) {
  const profile = useUserProfile(userId)
  const latest = useLatestBodyMetric(userId)
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile !== undefined && !loaded) {
      setName(profile?.full_name ?? fallbackName ?? '')
      setHeight(profile?.height_cm != null ? String(profile.height_cm) : '')
      setLoaded(true)
    }
  }, [profile, fallbackName, loaded])

  const avatarUrl = profile?.avatar_path
    ? `${avatarPublicUrl(profile.avatar_path)}?v=${encodeURIComponent(profile.updated_at)}`
    : null

  async function handleSave() {
    setSaving(true)
    try {
      await setUserProfile(userId, {
        full_name: name.trim() || null,
        height_cm: height === '' ? null : Number(height),
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const path = await uploadAvatar(userId, file)
      await setUserProfile(userId, { avatar_path: path })
    } catch (err) {
      setError('Não foi possível enviar a foto. ' + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-surface text-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Foto de perfil" className="size-full object-cover" />
          ) : (
            <User className="size-10" />
          )}
        </div>
        {canUpload && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Trocar foto de perfil"
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md active:scale-95 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          hidden
          onChange={handleAvatarPick}
        />
      </div>

      {error && <p className="text-center text-xs text-destructive">{error}</p>}

      <div className="grid w-full grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Nome</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Altura (cm)</span>
          <Input
            type="number"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Peso atual</span>
          <div className="flex h-11 items-center rounded-md border border-border bg-surface/50 px-3 text-sm">
            {latest?.weight_kg != null ? `${latest.weight_kg} kg` : '—'}
          </div>
        </div>
      </div>

      <Button size="sm" variant="accent" onClick={handleSave} disabled={saving} className="self-start">
        {saving ? 'Salvando...' : 'Salvar perfil'}
      </Button>
    </div>
  )
}
