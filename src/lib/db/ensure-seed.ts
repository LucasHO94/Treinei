import { db } from './index'
import { LOCAL_MUSCLE_GROUPS, LOCAL_EXERCISES, LOCAL_FOODS } from './local-seed'

/**
 * Garante que o catálogo nativo (grupos musculares, exercícios, alimentos) exista
 * localmente mesmo sem backend configurado — o app é offline-first e não pode
 * depender de um pull do Supabase para funcionar no primeiro uso (RF01/RF11).
 * Idempotente: só popula o que ainda não existir, nunca sobrescreve dados que já
 * tenham sido sincronizados de um projeto Supabase real.
 */
export async function ensureLocalSeed(): Promise<void> {
  const [groupCount, exerciseCount, foodCount] = await Promise.all([
    db.muscle_groups.count(),
    db.exercises.count(),
    db.foods.count(),
  ])

  if (groupCount === 0) await db.muscle_groups.bulkPut(LOCAL_MUSCLE_GROUPS)
  if (exerciseCount === 0) await db.exercises.bulkPut(LOCAL_EXERCISES)
  if (foodCount === 0) await db.foods.bulkPut(LOCAL_FOODS)
}
