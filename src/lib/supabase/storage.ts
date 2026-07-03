import { supabase } from './client'

/** Buckets do Storage (criados na migration 0004). */
export const AVATARS_BUCKET = 'avatars'
export const BODY_PHOTOS_BUCKET = 'body-photos'

function fileExt(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  const fromType = file.type.split('/').pop()
  return (fromType || 'jpg').toLowerCase()
}

/**
 * Sobe/atualiza o avatar do usuário em avatars/{userId}/avatar.{ext} e devolve o path.
 * Bucket público → leitura por URL pública. Requer sessão autenticada (RLS de Storage).
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/avatar.${fileExt(file)}`
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  return path
}

/** URL pública (estável) de um avatar. `?v=` força refresh do cache ao trocar a foto. */
export function avatarPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Sobe uma foto corporal em body-photos/{userId}/{uuid}.{ext} (bucket PRIVADO) e devolve
 * o path. A exibição usa signed URL de curta duração (dado sensível — LGPD).
 */
export async function uploadBodyPhoto(userId: string, file: File): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${fileExt(file)}`
  const { error } = await supabase.storage
    .from(BODY_PHOTOS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return path
}

/** Signed URL temporária para uma foto corporal (padrão: 1h). */
export async function bodyPhotoSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BODY_PHOTOS_BUCKET).createSignedUrl(path, expiresIn)
  if (error || !data) return null
  return data.signedUrl
}

export async function removeBodyPhotoFile(path: string): Promise<void> {
  await supabase.storage.from(BODY_PHOTOS_BUCKET).remove([path])
}
