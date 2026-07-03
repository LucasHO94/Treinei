import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

export function useMuscleGroups() {
  return useLiveQuery(() => db.muscle_groups.orderBy('sort_order').toArray(), [], [])
}

export function useExercisesByGroup(muscleGroupId: number | undefined) {
  return useLiveQuery(
    async () => {
      if (muscleGroupId == null) return []
      const list = await db.exercises.where('muscle_group_id').equals(muscleGroupId).toArray()
      return list.sort((a, b) => a.name.localeCompare(b.name))
    },
    [muscleGroupId],
    [],
  )
}

export function useExerciseSearch(term: string) {
  return useLiveQuery(
    async () => {
      const q = term.trim().toLowerCase()
      if (!q) return []
      const all = await db.exercises.toArray()
      return all.filter((e) => e.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name))
    },
    [term],
    [],
  )
}

export function useExerciseMap() {
  const list = useLiveQuery(() => db.exercises.toArray(), [], [])
  return useMemo(() => new Map((list ?? []).map((e) => [e.id, e])), [list])
}

/** Contagem de exercícios por grupo muscular — badge das linhas do catálogo. */
export function useExerciseCounts() {
  return useLiveQuery(
    async () => {
      const counts = new Map<number, number>()
      await db.exercises.each((e) => counts.set(e.muscle_group_id, (counts.get(e.muscle_group_id) ?? 0) + 1))
      return counts
    },
    [],
    new Map<number, number>(),
  )
}

export function useRoutines(userId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      const list = await db.routines.where('user_id').equals(userId).toArray()
      return list.sort((a, b) => a.created_at.localeCompare(b.created_at))
    },
    [userId],
    [],
  )
}

export function useRoutine(routineId: string | undefined) {
  return useLiveQuery(async () => (routineId ? db.routines.get(routineId) : undefined), [routineId])
}

export function useWorkouts(routineId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!routineId) return []
      const list = await db.workouts.where('routine_id').equals(routineId).toArray()
      return list.sort((a, b) => a.sort_order - b.sort_order)
    },
    [routineId],
    [],
  )
}

export function useWorkout(workoutId: string | undefined) {
  return useLiveQuery(async () => (workoutId ? db.workouts.get(workoutId) : undefined), [workoutId])
}

export function useWorkoutExercise(workoutExerciseId: string | undefined) {
  return useLiveQuery(
    async () => (workoutExerciseId ? db.workout_exercises.get(workoutExerciseId) : undefined),
    [workoutExerciseId],
  )
}

export function useWorkoutExercises(workoutId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!workoutId) return []
      const list = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
      return list.sort((a, b) => a.sort_order - b.sort_order)
    },
    [workoutId],
    [],
  )
}

export function usePlannedSets(workoutExerciseId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!workoutExerciseId) return []
      const list = await db.planned_sets.where('workout_exercise_id').equals(workoutExerciseId).toArray()
      return list.sort((a, b) => a.set_number - b.set_number)
    },
    [workoutExerciseId],
    [],
  )
}

/** Última sessão concluída (com séries) para uma divisão — usada para sugerir carga/reps na execução (RF08). */
export function useLastSessionForWorkout(workoutId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!workoutId) return undefined
      const sessions = await db.workout_sessions
        .where('workout_id')
        .equals(workoutId)
        .and((s) => s.finished_at != null)
        .toArray()
      if (!sessions.length) return undefined
      sessions.sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''))
      const last = sessions[0]
      const sets = await db.session_sets.where('session_id').equals(last.id).toArray()
      return { session: last, sets }
    },
    [workoutId],
    undefined,
  )
}

export function useSessionHistory(userId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      const sessions = await db.workout_sessions
        .where('user_id')
        .equals(userId)
        .and((s) => s.finished_at != null)
        .toArray()
      return sessions.sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''))
    },
    [userId],
    [],
  )
}

export function useSessionSets(sessionId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!sessionId) return []
      const list = await db.session_sets.where('session_id').equals(sessionId).toArray()
      return list.sort((a, b) => a.set_number - b.set_number)
    },
    [sessionId],
    [],
  )
}
