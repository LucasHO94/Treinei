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
  // Metadados do catálogo V2 (free-exercise-db) — opcionais: exercícios custom
  // e registros criados antes da V2 não os possuem.
  name_en?: string | null
  /** Paths relativos das 2 fotos (início/fim do movimento) — resolver com exerciseImageUrl(). */
  images?: string[] | null
  equipment?: string | null
  level?: 'iniciante' | 'intermediário' | 'avançado' | null
  mechanics?: 'composto' | 'isolado' | null
  force?: 'empurrar' | 'puxar' | 'estático' | null
  category?: string | null
  instructions?: string[]
  secondary_muscle_ids?: number[]
  goals?: string[]
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
  // Metadados do catálogo V2 (TACO) — opcionais para customs/registros pré-V2.
  category?: string | null
  source?: 'taco' | 'tbca' | 'seed-v1' | 'custom' | 'cronograma' | 'expansion' | null
  household_measure?: string | null
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

// V2 Fase E: receitas sugeridas (schema pronto; conteúdo/CRUD entram na V2.1).
export type RecipeMealKind = 'cafe' | 'almoco' | 'jantar' | 'lanche' | 'pre_treino' | 'pos_treino'

export interface Recipe {
  id: string
  name: string
  meal_kind: RecipeMealKind
  description: string | null
  image_url: string | null
  servings: number
  prep_minutes: number | null
  source: string | null
  is_custom: boolean
  owner_id: string | null
  created_at: string
  // Metadados da curadoria V3 — opcionais: receitas custom não precisam ter.
  tags?: string[]
  instructions?: string[]
}

export interface RecipeItem {
  id: string
  recipe_id: string
  food_id: string
  quantity: number
}

// V3.3: perfil profissional (foto, altura, peso, fotos corporais).
export interface UserProfile {
  user_id: string
  full_name: string | null
  avatar_path: string | null
  height_cm: number | null
  updated_at: string
  role?: 'user' | 'admin'
}

// V3.8: painel de gestor — linha consolidada retornada por admin_list_users().
export interface AdminUserRow {
  user_id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  full_name: string | null
  avatar_path: string | null
  role: 'user' | 'admin'
  routines_count: number
  workout_sessions_count: number
  meals_count: number
  meal_logs_count: number
  last_activity: string | null
}

export interface BodyMetric {
  id: string
  user_id: string
  measured_on: string // 'YYYY-MM-DD'
  weight_kg: number | null
  height_cm: number | null
  created_at: string
}

export interface BodyPhoto {
  id: string
  user_id: string
  storage_path: string
  taken_on: string // 'YYYY-MM-DD'
  created_at: string
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
