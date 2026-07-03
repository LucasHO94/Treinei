import { db } from '@/lib/db'
import { mutate } from '@/lib/db/mutate'
import { requestSync } from '@/lib/sync/engine'
import { removeBodyPhotoFile } from '@/lib/supabase/storage'
import type { UserProfile, BodyMetric, BodyPhoto } from '@/types/domain'

function nowIso() {
  return new Date().toISOString()
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * user_profiles usa user_id como chave primária (sem `id`), então grava direto no
 * Dexie + outbox (mesmo padrão de setNutritionGoals).
 */
export async function setUserProfile(
  userId: string,
  patch: Partial<Pick<UserProfile, 'full_name' | 'avatar_path' | 'height_cm'>>,
): Promise<void> {
  const existing = await db.user_profiles.get(userId)
  const profile: UserProfile = {
    user_id: userId,
    full_name: patch.full_name ?? existing?.full_name ?? null,
    avatar_path: patch.avatar_path ?? existing?.avatar_path ?? null,
    height_cm: patch.height_cm ?? existing?.height_cm ?? null,
    updated_at: nowIso(),
  }

  await db.transaction('rw', db.user_profiles, db.outbox, async () => {
    await db.user_profiles.put(profile)
    await db.outbox.add({
      table: 'user_profiles',
      op: existing ? 'update' : 'insert',
      recordId: userId,
      payload: profile,
      created_at: nowIso(),
      attempts: 0,
    })
  })
  requestSync()
}

// ---- Histórico de peso/medidas ----

export async function addBodyMetric(
  userId: string,
  input: { weight_kg: number | null; height_cm?: number | null; measured_on?: string },
): Promise<BodyMetric> {
  const metric: BodyMetric = {
    id: crypto.randomUUID(),
    user_id: userId,
    measured_on: input.measured_on ?? todayDate(),
    weight_kg: input.weight_kg,
    height_cm: input.height_cm ?? null,
    created_at: nowIso(),
  }
  await mutate('body_metrics', 'insert', metric)
  return metric
}

export async function deleteBodyMetric(metric: BodyMetric): Promise<void> {
  await mutate('body_metrics', 'delete', metric)
}

// ---- Fotos de evolução corporal ----

/** Registra a referência de uma foto já enviada ao Storage (bucket privado). */
export async function addBodyPhoto(
  userId: string,
  storagePath: string,
  takenOn: string = todayDate(),
): Promise<BodyPhoto> {
  const photo: BodyPhoto = {
    id: crypto.randomUUID(),
    user_id: userId,
    storage_path: storagePath,
    taken_on: takenOn,
    created_at: nowIso(),
  }
  await mutate('body_photos', 'insert', photo)
  return photo
}

/** Remove a foto do Storage e a referência local (+ outbox). */
export async function deleteBodyPhoto(photo: BodyPhoto): Promise<void> {
  await removeBodyPhotoFile(photo.storage_path).catch(() => {
    // Se falhar remover do Storage (offline), a referência ainda é apagada; órfão raro.
  })
  await mutate('body_photos', 'delete', photo)
}
