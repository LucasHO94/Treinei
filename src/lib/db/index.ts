import Dexie, { type EntityTable } from 'dexie'
import type {
  MuscleGroup,
  Exercise,
  Routine,
  Workout,
  WorkoutExercise,
  PlannedSet,
  WorkoutSession,
  SessionSet,
  Food,
  Meal,
  MealItem,
  MealLog,
  NutritionGoals,
  NotificationSchedule,
} from '@/types/domain'
import type { OutboxEntry } from './schema'

/**
 * Banco local (IndexedDB via Dexie) — fonte primária de leitura/escrita do app.
 * Toda mutação do usuário grava aqui primeiro; a outbox drena para o Supabase
 * quando há conexão (ver lib/sync). IDs são UUIDs gerados no cliente.
 */
export class TreineiDB extends Dexie {
  muscle_groups!: EntityTable<MuscleGroup, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  workouts!: EntityTable<Workout, 'id'>
  workout_exercises!: EntityTable<WorkoutExercise, 'id'>
  planned_sets!: EntityTable<PlannedSet, 'id'>
  workout_sessions!: EntityTable<WorkoutSession, 'id'>
  session_sets!: EntityTable<SessionSet, 'id'>
  foods!: EntityTable<Food, 'id'>
  meals!: EntityTable<Meal, 'id'>
  meal_items!: EntityTable<MealItem, 'id'>
  meal_logs!: EntityTable<MealLog, 'id'>
  nutrition_goals!: EntityTable<NutritionGoals, 'user_id'>
  notification_schedules!: EntityTable<NotificationSchedule, 'id'>
  outbox!: EntityTable<OutboxEntry, 'id'>

  constructor() {
    super('treinei')
    this.version(1).stores({
      muscle_groups: 'id, slug, sort_order',
      exercises: 'id, muscle_group_id, is_custom, owner_id, name',
      routines: 'id, user_id, is_active',
      workouts: 'id, routine_id, sort_order',
      workout_exercises: 'id, workout_id, sort_order',
      planned_sets: 'id, workout_exercise_id, set_number',
      workout_sessions: 'id, user_id, workout_id, started_at',
      session_sets: 'id, session_id, set_number',
      foods: 'id, name, is_custom, owner_id',
      meals: 'id, user_id, sort_order, scheduled_at',
      meal_items: 'id, meal_id, food_id',
      meal_logs: 'id, user_id, meal_id, log_date',
      nutrition_goals: 'user_id',
      notification_schedules: 'id, user_id, kind, enabled',
      outbox: '++id, table, created_at',
    })
  }
}

export const db = new TreineiDB()
