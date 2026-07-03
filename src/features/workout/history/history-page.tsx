import { useState } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useSessionHistory, useSessionSets, useWorkout } from '@/features/workout/lib/queries'
import { INTENSITY_LABEL } from '@/features/workout/lib/intensity'
import { cn } from '@/lib/utils'
import type { WorkoutSession } from '@/types/domain'

export function HistoryPage() {
  const userId = useCurrentUserId()
  const sessions = useSessionHistory(userId)
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string>()

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/treino')} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-bold">Histórico</h1>
      </header>

      {sessions != null && sessions.length === 0 && (
        <p className="text-sm text-muted">Nenhum treino concluído ainda. Execute uma divisão para começar seu histórico.</p>
      )}

      <div className="flex flex-col gap-2">
        {(sessions ?? []).map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            expanded={expandedId === session.id}
            onToggle={() => setExpandedId((current) => (current === session.id ? undefined : session.id))}
          />
        ))}
      </div>
    </div>
  )
}

function SessionRow({
  session,
  expanded,
  onToggle,
}: {
  session: WorkoutSession
  expanded: boolean
  onToggle: () => void
}) {
  const workout = useWorkout(session.workout_id ?? undefined)
  const sets = useSessionSets(expanded ? session.id : undefined)

  const volumeKg = (sets ?? []).reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
  const durationMin =
    session.finished_at != null
      ? Math.round(
          (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000,
        )
      : null

  const setsByExercise = new Map<string, typeof sets>()
  for (const set of sets ?? []) {
    const list = setsByExercise.get(set.exercise_name) ?? []
    list.push(set)
    setsByExercise.set(set.exercise_name, list)
  }

  // Tempo por exercício (V3): derivado dos completed_at das séries, sem precisar de schema
  // novo — do início da 1ª série ao fim da última série daquele exercício.
  function exerciseDurationMin(exerciseSets: typeof sets): number | null {
    if (!exerciseSets || exerciseSets.length < 2) return null
    const timestamps = exerciseSets.map((s) => new Date(s.completed_at).getTime())
    const spanMs = Math.max(...timestamps) - Math.min(...timestamps)
    return Math.max(1, Math.round(spanMs / 60000))
  }

  return (
    <Card>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between p-4 text-left">
        <div>
          <p className="text-sm font-medium">{workout?.name ?? 'Divisão'}</p>
          <p className="text-xs text-muted">
            {new Date(session.started_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
            {durationMin != null && ` · ${durationMin} min`}
          </p>
        </div>
        <ChevronDown className={cn('size-4 text-muted transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <CardContent className="flex flex-col gap-3 pt-0">
          <p className="text-xs text-muted">Volume total: {Math.round(volumeKg)} kg</p>
          {[...setsByExercise.entries()].map(([exerciseName, exerciseSets]) => {
            const durationMin = exerciseDurationMin(exerciseSets)
            return (
              <div key={exerciseName} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{exerciseName}</p>
                  {durationMin != null && <p className="text-xs text-muted">{durationMin} min</p>}
                </div>
                <div className="flex flex-col gap-0.5">
                  {(exerciseSets ?? []).map((set) => (
                    <p key={set.id} className="text-xs text-muted tabular-nums">
                      Série {set.set_number}: {set.reps ?? '—'} reps × {set.weight_kg ?? '—'} kg
                      {set.intensity && ` · ${INTENSITY_LABEL[set.intensity]}`}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}
