// Tipos de domínio — espelham o schema SQL (supabase/migrations/0001_init.sql).

export type Intensity = 'light' | 'heavy' | 'failure'

export interface MuscleGroup {
  id: number
  slug: string
  name: string
  sort_order: number
  image_url: string | null
}

export interface Exercise {
  id: string
  muscle_group_id: number
  name: string
  media_url: string | null
  is_custom: boolean
  owner_id: string | null
  created_at: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Workout {
  id: string
  routine_id: string
  name: string
  label: string | null
  sort_order: number
  weekday: number | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  sort_order: number
  rest_seconds: number
  notes: string | null
}

export interface PlannedSet {
  id: string
  workout_exercise_id: string
  set_number: number
  target_reps: number | null
  target_weight_kg: number | null
  intensity: Intensity
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_id: string | null
  started_at: string
  finished_at: string | null
  notes: string | null
}

export interface SessionSet {
  id: string
  session_id: string
  workout_exercise_id: string | null
  exercise_name: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  intensity: Intensity | null
  completed_at: string
}

export interface Food {
  id: string
  name: string
  portion_desc: string
  portion_grams: number | null
  protein_g: number
  carbs_g: number
  fat_g: number
  kcal: number
  is_custom: boolean
  owner_id: string | null
}

export interface Meal {
  id: string
  user_id: string
  name: string
  scheduled_at: string // 'HH:MM:SS'
  sort_order: number
  notify: boolean
}

export interface MealItem {
  id: string
  meal_id: string
  food_id: string
  quantity: number
}

export interface MealLog {
  id: string
  user_id: string
  meal_id: string | null
  log_date: string // 'YYYY-MM-DD'
  eaten_at: string
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  kcal: number | null
}

export interface NutritionGoals {
  user_id: string
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  kcal: number | null
}

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  user_agent: string | null
  created_at: string
}

export interface NotificationSchedule {
  id: string
  user_id: string
  kind: 'meal' | 'workout_reminder'
  ref_id: string | null
  send_time: string
  timezone: string
  weekdays: number[]
  enabled: boolean
  last_sent_on: string | null
}
