import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

export function useMealSchedule(userId: string | undefined, mealId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId || !mealId) return undefined
      return db.notification_schedules
        .where('user_id')
        .equals(userId)
        .and((s) => s.kind === 'meal' && s.ref_id === mealId)
        .first()
    },
    [userId, mealId],
  )
}

export function useWorkoutReminder(userId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId) return undefined
      return db.notification_schedules
        .where('user_id')
        .equals(userId)
        .and((s) => s.kind === 'workout_reminder')
        .first()
    },
    [userId],
  )
}
