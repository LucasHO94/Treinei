import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useWorkoutReminder } from './lib/queries'
import { upsertWorkoutReminder } from './lib/actions'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]

interface WorkoutReminderCardProps {
  userId: string
}

/** Lembrete diário de treino (RF16): "Hoje é dia de Treino B — Costas" no horário e dias configurados. */
export function WorkoutReminderCard({ userId }: WorkoutReminderCardProps) {
  const reminder = useWorkoutReminder(userId)
  const enabled = reminder?.enabled ?? false
  const sendTime = reminder?.send_time.slice(0, 5) ?? '07:00'
  const weekdays = reminder?.weekdays ?? ALL_WEEKDAYS

  function toggleWeekday(day: number) {
    const next = weekdays.includes(day) ? weekdays.filter((d) => d !== day) : [...weekdays, day].sort()
    void upsertWorkoutReminder(userId, { weekdays: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => void upsertWorkoutReminder(userId, { enabled: e.target.checked })}
          className="size-4 rounded border-border accent-primary"
        />
        Lembrete diário de treino
      </label>

      {enabled && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Horário</label>
            <Input
              type="time"
              value={sendTime}
              onChange={(e) => void upsertWorkoutReminder(userId, { send_time: `${e.target.value}:00` })}
              className="w-32"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Dias</label>
            <div className="flex gap-1.5">
              {WEEKDAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekday(day)}
                  className={cn(
                    'h-8 flex-1 rounded-md text-xs font-medium transition-colors',
                    weekdays.includes(day)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-surface text-muted hover:bg-border',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
