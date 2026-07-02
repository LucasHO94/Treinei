import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { startWorkoutSession } from '@/features/workout/lib/actions'
import type { WorkoutSession } from '@/types/domain'

/**
 * Recupera a sessão em andamento (não finalizada) para a divisão, ou cria uma nova.
 * A sessão é persistida no Dexie a cada série marcada, então sobrevive a fechar o
 * app no meio do treino — reabrir a execução retoma a mesma sessão.
 */
export function useActiveSession(workoutId: string | undefined, userId: string) {
  const [session, setSession] = useState<WorkoutSession>()

  useEffect(() => {
    if (!workoutId) return
    let cancelled = false

    void (async () => {
      const existing = await db.workout_sessions
        .where('workout_id')
        .equals(workoutId)
        .and((s) => s.finished_at == null)
        .toArray()

      if (existing.length > 0) {
        existing.sort((a, b) => b.started_at.localeCompare(a.started_at))
        if (!cancelled) setSession(existing[0])
        return
      }

      const created = await startWorkoutSession(userId, workoutId)
      if (!cancelled) setSession(created)
    })()

    return () => {
      cancelled = true
    }
  }, [workoutId, userId])

  return session
}
