import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlannedSets } from '@/features/workout/lib/queries'
import { cn } from '@/lib/utils'
import type { Exercise, Intensity, SessionSet, WorkoutExercise } from '@/types/domain'
import { ExecutionSetRow } from './execution-set-row'
import type { ExerciseTimerState } from './use-exercise-timers'

interface ExecutionExerciseBlockProps {
  workoutExercise: WorkoutExercise
  exercise: Exercise | undefined
  sessionSetMap: Map<string, SessionSet>
  lastSetMap: Map<string, SessionSet>
  isCurrent: boolean
  timer: ExerciseTimerState | undefined
  onCompleteSet: (
    workoutExercise: WorkoutExercise,
    setNumber: number,
    values: { reps: number | null; weight_kg: number | null; intensity: Intensity },
  ) => void
  /** Abre o overlay de execução — tocar no nome do exercício (paridade com o app modelo). */
  onShowDetail: (exercise: Exercise) => void
  onSkipTimer: () => void
  /** Disparado uma única vez quando a última série planejada é concluída (avança o scroll). */
  onAllSetsDone: () => void
}

export function ExecutionExerciseBlock({
  workoutExercise,
  exercise,
  sessionSetMap,
  lastSetMap,
  isCurrent,
  timer,
  onCompleteSet,
  onShowDetail,
  onSkipTimer,
  onAllSetsDone,
}: ExecutionExerciseBlockProps) {
  const plannedSets = usePlannedSets(workoutExercise.id)
  const exerciseName = exercise?.name ?? 'Exercício removido'
  const wasAllDoneRef = useRef(false)

  const total = plannedSets?.length ?? 0
  const completedCount = (plannedSets ?? []).filter((s) =>
    sessionSetMap.has(`${workoutExercise.id}_${s.set_number}`),
  ).length
  const allDone = total > 0 && completedCount === total

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) onAllSetsDone()
    wasAllDoneRef.current = allDone
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  const remainingSeconds = timer ? Math.max(0, Math.ceil(timer.remainingMs / 1000)) : 0

  return (
    <Card
      id={`exercise-block-${workoutExercise.id}`}
      className={cn(
        'scroll-mt-4 transition-shadow',
        isCurrent && !allDone && 'ring-2 ring-primary/60',
        allDone && 'opacity-70',
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        {exercise ? (
          <button type="button" onClick={() => onShowDetail(exercise)} className="text-left">
            <CardTitle className="text-primary underline-offset-4 hover:underline">{exerciseName}</CardTitle>
          </button>
        ) : (
          <CardTitle>{exerciseName}</CardTitle>
        )}
        {total > 0 && (
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
            {completedCount}/{total}
          </span>
        )}
      </CardHeader>

      {timer && (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md bg-primary/10 px-3 py-2">
          <span className="text-sm font-medium text-primary">Descanso · {timer.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tabular-nums text-primary">{remainingSeconds}s</span>
            <button
              type="button"
              onClick={onSkipTimer}
              aria-label="Pular descanso"
              className="flex size-6 items-center justify-center rounded-full text-primary/70 hover:text-primary"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <CardContent className="flex flex-col gap-2">
        <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_2.5rem] gap-2 px-1 text-xs font-medium text-muted">
          <span>#</span>
          <span>Reps</span>
          <span>Kg</span>
          <span>Intens.</span>
          <span />
        </div>
        {(plannedSets ?? []).map((plannedSet) => {
          const key = `${workoutExercise.id}_${plannedSet.set_number}`
          return (
            <ExecutionSetRow
              key={plannedSet.id}
              plannedSet={plannedSet}
              existing={sessionSetMap.get(key)}
              placeholderReps={lastSetMap.get(key)?.reps ?? undefined}
              placeholderWeight={lastSetMap.get(key)?.weight_kg ?? undefined}
              onComplete={(values) => onCompleteSet(workoutExercise, plannedSet.set_number, values)}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}
