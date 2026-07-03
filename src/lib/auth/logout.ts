import { db } from '@/lib/db'
import { signOut } from '@/lib/supabase/auth'

/**
 * Logout (V3.2): encerra a sessão e limpa os dados do usuário no Dexie para isolar
 * contas no mesmo aparelho. O catálogo nativo (owner_id null) permanece; o dado do
 * usuário está no servidor e é restaurado pelo pullAll no próximo login.
 */
export async function logout(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.routines,
      db.workouts,
      db.workout_exercises,
      db.planned_sets,
      db.workout_sessions,
      db.session_sets,
      db.meals,
      db.meal_items,
      db.meal_logs,
      db.nutrition_goals,
      db.notification_schedules,
      db.exercises,
      db.foods,
      db.recipes,
      db.user_profiles,
      db.body_metrics,
      db.body_photos,
      db.outbox,
    ],
    async () => {
      await Promise.all([
        db.routines.clear(),
        db.workouts.clear(),
        db.workout_exercises.clear(),
        db.planned_sets.clear(),
        db.workout_sessions.clear(),
        db.session_sets.clear(),
        db.meals.clear(),
        db.meal_items.clear(),
        db.meal_logs.clear(),
        db.nutrition_goals.clear(),
        db.notification_schedules.clear(),
        db.user_profiles.clear(),
        db.body_metrics.clear(),
        db.body_photos.clear(),
        db.outbox.clear(),
      ])
      // Catálogo custom do usuário (nativos têm owner_id null e permanecem).
      await db.exercises.filter((e) => e.owner_id != null).delete()
      await db.foods.filter((f) => f.owner_id != null).delete()
      await db.recipes.filter((r) => r.owner_id != null).delete()
    },
  )

  await signOut()
}
