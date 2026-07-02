import { db } from '@/lib/db'
import { mutate } from '@/lib/db/mutate'
import type { NotificationSchedule } from '@/types/domain'

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
}

/** Cria ou atualiza o lembrete de uma refeição (kind='meal', ref_id=meal.id) — um por refeição. */
export async function upsertMealSchedule(
  userId: string,
  mealId: string,
  patch: { send_time?: string; enabled?: boolean },
): Promise<NotificationSchedule> {
  const existing = await db.notification_schedules
    .where('user_id')
    .equals(userId)
    .and((s) => s.kind === 'meal' && s.ref_id === mealId)
    .first()

  const schedule: NotificationSchedule = {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: userId,
    kind: 'meal',
    ref_id: mealId,
    send_time: patch.send_time ?? existing?.send_time ?? '12:00',
    timezone: existing?.timezone ?? localTimezone(),
    weekdays: existing?.weekdays ?? ALL_WEEKDAYS,
    enabled: patch.enabled ?? existing?.enabled ?? true,
    last_sent_on: existing?.last_sent_on ?? null,
  }
  await mutate('notification_schedules', existing ? 'update' : 'insert', schedule)
  return schedule
}

/** Cria ou atualiza o lembrete diário de treino (kind='workout_reminder') — único por usuário. */
export async function upsertWorkoutReminder(
  userId: string,
  patch: { send_time?: string; weekdays?: number[]; enabled?: boolean },
): Promise<NotificationSchedule> {
  const existing = await db.notification_schedules
    .where('user_id')
    .equals(userId)
    .and((s) => s.kind === 'workout_reminder')
    .first()

  const schedule: NotificationSchedule = {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: userId,
    kind: 'workout_reminder',
    ref_id: null,
    send_time: patch.send_time ?? existing?.send_time ?? '07:00',
    timezone: existing?.timezone ?? localTimezone(),
    weekdays: patch.weekdays ?? existing?.weekdays ?? ALL_WEEKDAYS,
    enabled: patch.enabled ?? existing?.enabled ?? true,
    last_sent_on: existing?.last_sent_on ?? null,
  }
  await mutate('notification_schedules', existing ? 'update' : 'insert', schedule)
  return schedule
}

export async function deleteSchedule(schedule: NotificationSchedule): Promise<void> {
  await mutate('notification_schedules', 'delete', schedule)
}

/** Remove o lembrete de uma refeição excluída, se existir. */
export async function deleteMealSchedule(userId: string, mealId: string): Promise<void> {
  const existing = await db.notification_schedules
    .where('user_id')
    .equals(userId)
    .and((s) => s.kind === 'meal' && s.ref_id === mealId)
    .first()
  if (existing) await deleteSchedule(existing)
}
