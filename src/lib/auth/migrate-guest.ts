import { db } from '@/lib/db'
import type { OutboxEntry } from '@/lib/db/schema'
import { requestSync } from '@/lib/sync/engine'

const MIGRATED_PREFIX = 'treinei:migrated:'

export function alreadyMigrated(authUserId: string): boolean {
  return localStorage.getItem(MIGRATED_PREFIX + authUserId) === '1'
}

function markMigrated(authUserId: string): void {
  localStorage.setItem(MIGRATED_PREFIX + authUserId, '1')
}

/**
 * Migração convidado → conta (V3.2).
 *
 * Ao logar, o `useCurrentUserId` passa a devolver o ID do Supabase; sem esta migração
 * todos os dados criados como convidado (chaveados pelo ID local) sumiriam da UI e
 * seriam rejeitados pelo RLS na sincronização. Aqui re-chaveamos os dados locais para
 * o novo usuário, descartamos a outbox antiga (payloads com o ID de convidado falhariam
 * o `with check (auth.uid() = user_id)`) e re-enfileiramos um push completo em ordem de
 * dependência (FK) para popular a conta no Supabase.
 *
 * Idempotente por conta (marca em localStorage); roda uma vez no primeiro login.
 */
export async function migrateGuestData(guestId: string, authUserId: string): Promise<void> {
  if (alreadyMigrated(authUserId)) return
  if (guestId === authUserId) {
    markMigrated(authUserId)
    return
  }

  await db.transaction(
    'rw',
    [
      db.routines,
      db.workout_sessions,
      db.meals,
      db.meal_logs,
      db.notification_schedules,
      db.exercises,
      db.foods,
      db.recipes,
      db.nutrition_goals,
      db.user_profiles,
      db.body_metrics,
      db.body_photos,
      db.outbox,
    ],
    async () => {
      // Tabelas com dono direto (user_id).
      await db.routines.where('user_id').equals(guestId).modify({ user_id: authUserId })
      await db.workout_sessions.where('user_id').equals(guestId).modify({ user_id: authUserId })
      await db.meals.where('user_id').equals(guestId).modify({ user_id: authUserId })
      await db.meal_logs.where('user_id').equals(guestId).modify({ user_id: authUserId })
      await db.notification_schedules.where('user_id').equals(guestId).modify({ user_id: authUserId })
      await db.body_metrics.where('user_id').equals(guestId).modify({ user_id: authUserId })
      await db.body_photos.where('user_id').equals(guestId).modify({ user_id: authUserId })

      // Catálogo custom (owner_id) — só o do usuário; nativos têm owner_id null.
      await db.exercises.where('owner_id').equals(guestId).modify({ owner_id: authUserId })
      await db.foods.where('owner_id').equals(guestId).modify({ owner_id: authUserId })
      await db.recipes.where('owner_id').equals(guestId).modify({ owner_id: authUserId })

      // Tabelas com user_id como chave primária → move o registro.
      const goal = await db.nutrition_goals.get(guestId)
      if (goal) {
        await db.nutrition_goals.delete(guestId)
        await db.nutrition_goals.put({ ...goal, user_id: authUserId })
      }
      const profile = await db.user_profiles.get(guestId)
      if (profile) {
        await db.user_profiles.delete(guestId)
        await db.user_profiles.put({ ...profile, user_id: authUserId })
      }

      // Descarta outbox antiga (chaveada pelo convidado) — será reconstruída abaixo.
      await db.outbox.clear()
    },
  )

  await enqueueFullPush(authUserId)
  markMigrated(authUserId)
  requestSync()
}

/**
 * Enfileira upserts de TODO o dado do usuário na outbox, em ordem de dependência (FK),
 * para um push completo (login em dispositivo novo ou pós-migração de convidado).
 * Só empurra tabelas em SYNCED_TABLES; catálogo nativo (owner_id null) não é enviado.
 */
export async function enqueueFullPush(userId: string): Promise<void> {
  const entries: OutboxEntry[] = []
  const t0 = Date.now()
  // created_at estritamente crescente garante ordem FIFO no drain (respeita as FKs).
  const push = (table: OutboxEntry['table'], recordId: string, record: unknown): void => {
    entries.push({
      table,
      op: 'insert',
      recordId,
      payload: record,
      created_at: new Date(t0 + entries.length).toISOString(),
      attempts: 0,
    })
  }
  const add = (table: OutboxEntry['table'], record: { id: string }): void => push(table, record.id, record)

  // Catálogo custom primeiro (alvo de FK de workout_exercises/meal_items).
  for (const ex of await db.exercises.where('owner_id').equals(userId).toArray()) add('exercises', ex)
  for (const food of await db.foods.where('owner_id').equals(userId).toArray()) add('foods', food)

  // routines → workouts → workout_exercises → planned_sets
  for (const routine of await db.routines.where('user_id').equals(userId).toArray()) {
    add('routines', routine)
    for (const workout of await db.workouts.where('routine_id').equals(routine.id).toArray()) {
      add('workouts', workout)
      for (const we of await db.workout_exercises.where('workout_id').equals(workout.id).toArray()) {
        add('workout_exercises', we)
        for (const ps of await db.planned_sets.where('workout_exercise_id').equals(we.id).toArray()) {
          add('planned_sets', ps)
        }
      }
    }
  }

  // workout_sessions → session_sets
  for (const session of await db.workout_sessions.where('user_id').equals(userId).toArray()) {
    add('workout_sessions', session)
    for (const set of await db.session_sets.where('session_id').equals(session.id).toArray()) {
      add('session_sets', set)
    }
  }

  // meals → meal_items
  for (const meal of await db.meals.where('user_id').equals(userId).toArray()) {
    add('meals', meal)
    for (const item of await db.meal_items.where('meal_id').equals(meal.id).toArray()) {
      add('meal_items', item)
    }
  }

  for (const log of await db.meal_logs.where('user_id').equals(userId).toArray()) add('meal_logs', log)
  const goal = await db.nutrition_goals.get(userId)
  if (goal) push('nutrition_goals', userId, goal) // chaveada por user_id
  for (const s of await db.notification_schedules.where('user_id').equals(userId).toArray()) {
    add('notification_schedules', s)
  }

  // Perfil (V3.3): perfil, medidas e referências de fotos corporais.
  const profile = await db.user_profiles.get(userId)
  if (profile) push('user_profiles', userId, profile) // chaveada por user_id
  for (const m of await db.body_metrics.where('user_id').equals(userId).toArray()) add('body_metrics', m)
  for (const p of await db.body_photos.where('user_id').equals(userId).toArray()) add('body_photos', p)
  for (const m of await db.body_metrics.where('user_id').equals(userId).toArray()) add('body_metrics', m)
  for (const p of await db.body_photos.where('user_id').equals(userId).toArray()) add('body_photos', p)

  if (entries.length > 0) await db.outbox.bulkAdd(entries)
}
