import { db } from '@/lib/db'
import { mutate } from '@/lib/db/mutate'
import type {
  Routine,
  Workout,
  WorkoutExercise,
  PlannedSet,
  Exercise,
  WorkoutSession,
  SessionSet,
} from '@/types/domain'
import type { GeneratedWorkout } from '@/features/workout/generator/engine'

const DEFAULT_REST_SECONDS = 60
const DEFAULT_SET_COUNT = 3

function nowIso() {
  return new Date().toISOString()
}

// ---- Rotinas ----

export async function createRoutine(userId: string, name: string): Promise<Routine> {
  const routine: Routine = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    is_active: true,
    created_at: nowIso(),
  }
  await mutate('routines', 'insert', routine)
  return routine
}

export async function renameRoutine(routine: Routine, name: string): Promise<void> {
  await mutate('routines', 'update', { ...routine, name })
}

export async function deleteRoutine(routineId: string): Promise<void> {
  const routine = await db.routines.get(routineId)
  if (!routine) return
  const workouts = await db.workouts.where('routine_id').equals(routineId).toArray()
  for (const workout of workouts) {
    await deleteWorkout(workout.id)
  }
  await mutate('routines', 'delete', routine)
}

// ---- Divisões (workouts) ----

export async function createWorkout(routineId: string, label: string): Promise<Workout> {
  const siblings = await db.workouts.where('routine_id').equals(routineId).toArray()
  const workout: Workout = {
    id: crypto.randomUUID(),
    routine_id: routineId,
    name: `Treino ${label}`,
    label,
    sort_order: siblings.length,
    weekday: null,
    created_at: nowIso(),
  }
  await mutate('workouts', 'insert', workout)
  return workout
}

export async function renameWorkout(workout: Workout, label: string): Promise<void> {
  await mutate('workouts', 'update', { ...workout, label, name: `Treino ${label}` })
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return
  const exercises = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
  for (const we of exercises) {
    await removeExerciseFromWorkout(we.id)
  }
  await mutate('workouts', 'delete', workout)
}

export async function reorderWorkouts(routineId: string, orderedIds: string[]): Promise<void> {
  const workouts = await db.workouts.where('routine_id').equals(routineId).toArray()
  const byId = new Map(workouts.map((w) => [w.id, w]))
  for (let i = 0; i < orderedIds.length; i++) {
    const workout = byId.get(orderedIds[i])
    if (workout && workout.sort_order !== i) {
      await mutate('workouts', 'update', { ...workout, sort_order: i })
    }
  }
}

// ---- Exercícios dentro de uma divisão ----

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<WorkoutExercise> {
  const siblings = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
  const workoutExercise: WorkoutExercise = {
    id: crypto.randomUUID(),
    workout_id: workoutId,
    exercise_id: exerciseId,
    sort_order: siblings.length,
    rest_seconds: DEFAULT_REST_SECONDS,
    notes: null,
  }
  await mutate('workout_exercises', 'insert', workoutExercise)

  for (let i = 0; i < DEFAULT_SET_COUNT; i++) {
    const set: PlannedSet = {
      id: crypto.randomUUID(),
      workout_exercise_id: workoutExercise.id,
      set_number: i + 1,
      target_reps: null,
      target_weight_kg: null,
      intensity: 'heavy',
    }
    await mutate('planned_sets', 'insert', set)
  }

  return workoutExercise
}

export async function removeExerciseFromWorkout(workoutExerciseId: string): Promise<void> {
  const workoutExercise = await db.workout_exercises.get(workoutExerciseId)
  if (!workoutExercise) return
  const sets = await db.planned_sets.where('workout_exercise_id').equals(workoutExerciseId).toArray()
  for (const set of sets) {
    await mutate('planned_sets', 'delete', set)
  }
  await mutate('workout_exercises', 'delete', workoutExercise)
}

export async function reorderWorkoutExercises(workoutId: string, orderedIds: string[]): Promise<void> {
  const items = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
  const byId = new Map(items.map((item) => [item.id, item]))
  for (let i = 0; i < orderedIds.length; i++) {
    const item = byId.get(orderedIds[i])
    if (item && item.sort_order !== i) {
      await mutate('workout_exercises', 'update', { ...item, sort_order: i })
    }
  }
}

export async function updateWorkoutExercise(
  workoutExercise: WorkoutExercise,
  patch: Partial<Pick<WorkoutExercise, 'rest_seconds' | 'notes'>>,
): Promise<void> {
  await mutate('workout_exercises', 'update', { ...workoutExercise, ...patch })
}

// ---- Séries planejadas ----

export async function addPlannedSet(workoutExerciseId: string): Promise<PlannedSet> {
  const existing = await db.planned_sets.where('workout_exercise_id').equals(workoutExerciseId).toArray()
  const set: PlannedSet = {
    id: crypto.randomUUID(),
    workout_exercise_id: workoutExerciseId,
    set_number: existing.length + 1,
    target_reps: null,
    target_weight_kg: null,
    intensity: 'heavy',
  }
  await mutate('planned_sets', 'insert', set)
  return set
}

export async function updatePlannedSet(set: PlannedSet, patch: Partial<PlannedSet>): Promise<void> {
  await mutate('planned_sets', 'update', { ...set, ...patch })
}

export async function removePlannedSet(set: PlannedSet): Promise<void> {
  await mutate('planned_sets', 'delete', set)

  const rest = await db.planned_sets.where('workout_exercise_id').equals(set.workout_exercise_id).toArray()
  const ordered = rest.filter((s) => s.id !== set.id).sort((a, b) => a.set_number - b.set_number)
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].set_number !== i + 1) {
      await mutate('planned_sets', 'update', { ...ordered[i], set_number: i + 1 })
    }
  }
}

// ---- Catálogo (exercício custom) ----

export async function createCustomExercise(
  muscleGroupId: number,
  name: string,
  ownerId: string,
): Promise<Exercise> {
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    muscle_group_id: muscleGroupId,
    name,
    media_url: null,
    is_custom: true,
    owner_id: ownerId,
    created_at: nowIso(),
  }
  await mutate('exercises', 'insert', exercise)
  return exercise
}

// ---- Execução / sessões ----

export async function startWorkoutSession(userId: string, workoutId: string): Promise<WorkoutSession> {
  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    user_id: userId,
    workout_id: workoutId,
    started_at: nowIso(),
    finished_at: null,
    notes: null,
  }
  await mutate('workout_sessions', 'insert', session)
  return session
}

/** Grava (ou atualiza) uma série executada — chamado a cada input para sobreviver a fechar o app no meio do treino. */
export async function saveSessionSet(set: SessionSet): Promise<void> {
  await mutate('session_sets', 'insert', set)
}

export async function finishWorkoutSession(session: WorkoutSession, notes?: string): Promise<void> {
  await mutate('workout_sessions', 'update', {
    ...session,
    finished_at: nowIso(),
    notes: notes ?? session.notes,
  })
}

// ---- Gerador de treino por objetivo (V3) ----

/** Igual a addExerciseToWorkout, mas com sets/reps/descanso/intensidade definidos pelo motor de geração. */
async function addGeneratedExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  config: Pick<GeneratedWorkout['exercises'][number], 'sets' | 'targetReps' | 'restSeconds' | 'intensity'>,
): Promise<WorkoutExercise> {
  const siblings = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
  const workoutExercise: WorkoutExercise = {
    id: crypto.randomUUID(),
    workout_id: workoutId,
    exercise_id: exerciseId,
    sort_order: siblings.length,
    rest_seconds: config.restSeconds,
    notes: null,
  }
  await mutate('workout_exercises', 'insert', workoutExercise)

  for (let i = 0; i < config.sets; i++) {
    const set: PlannedSet = {
      id: crypto.randomUUID(),
      workout_exercise_id: workoutExercise.id,
      set_number: i + 1,
      target_reps: config.targetReps,
      target_weight_kg: null,
      intensity: config.intensity,
    }
    await mutate('planned_sets', 'insert', set)
  }

  return workoutExercise
}

/** Cria uma rotina completa (divisões + exercícios + séries planejadas) a partir do plano gerado. */
export async function createGeneratedRoutine(
  userId: string,
  routineName: string,
  divisions: GeneratedWorkout[],
): Promise<Routine> {
  const routine = await createRoutine(userId, routineName)
  for (const division of divisions) {
    const workout = await createWorkout(routine.id, division.name)
    for (const item of division.exercises) {
      await addGeneratedExerciseToWorkout(workout.id, item.exercise.id, item)
    }
  }
  return routine
}
