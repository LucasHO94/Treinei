// Nomes das tabelas sincronizáveis — usados tanto pelo schema do Dexie quanto pelo SyncEngine.
export const SYNCED_TABLES = [
  'routines',
  'workouts',
  'workout_exercises',
  'planned_sets',
  'workout_sessions',
  'session_sets',
  'exercises', // inclui itens custom do usuário; nativos (is_custom=false) só são lidos, nunca via outbox
  'foods', // mesma regra de exercises
  'meals',
  'meal_items',
  'meal_logs',
  'nutrition_goals',
  'notification_schedules',
] as const

export type SyncedTable = (typeof SYNCED_TABLES)[number]

export type OutboxOp = 'insert' | 'update' | 'delete'

export interface OutboxEntry {
  id?: number
  table: SyncedTable
  op: OutboxOp
  recordId: string
  payload: unknown
  created_at: string
  attempts: number
}
