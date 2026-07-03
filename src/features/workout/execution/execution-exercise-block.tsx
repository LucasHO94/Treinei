import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlannedSets } from '@/features/workout/lib/queries'
import { ExecutionSetRow } from './execution-set-row'
import type { Exercise, Intensity, SessionSet, WorkoutExercise } from '@/types/domain'

interface ExecutionExerciseBlockProps {
  workoutExercise: WorkoutExercise
  exercise: Exercise | undefined
  sessionSetMap: Map<string, SessionSet>
  lastSetMap: Map<string, SessionSet>
  onCompleteSet: (
    workoutExercise: WorkoutExercise,
    setNumber: number,
    values: { reps: number | null; weight_kg: number | null; intensity: Intensity },
  ) => void
  /** Abre o overlay de execução — tocar no nome do exercício (paridade com o app modelo). */
  onShowDetail: (exercise: Exercise) => void
}

export function ExecutionExerciseBlock({
  workoutExercise,
  exercise,
  sessionSetMap,
  lastSetMap,
  onCompleteSet,
  onShowDetail,
}: ExecutionExerciseBlockProps) {
  const plannedSets = usePlannedSets(workoutExercise.id)
  const exerciseName = exercise?.name ?? 'Exercício removido'

  return (
    <Card>
      <CardHeader>
        {exercise ? (
          <button type="button" onClick={() => onShowDetail(exercise)} className="text-left">
            <CardTitle className="text-primary underline-offset-4 hover:underline">{exerciseName}</CardTitle>
          </button>
        ) : (
          <CardTitle>{exerciseName}</CardTitle>
        )}
      </CardHeader>
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
