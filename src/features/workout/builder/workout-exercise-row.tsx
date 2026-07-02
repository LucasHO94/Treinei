import { ChevronUp, ChevronDown, Trash2, Dumbbell } from 'lucide-react'
import { usePlannedSets } from '@/features/workout/lib/queries'
import type { WorkoutExercise } from '@/types/domain'

interface WorkoutExerciseRowProps {
  workoutExercise: WorkoutExercise
  exerciseName: string
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onOpen: () => void
}

export function WorkoutExerciseRow({
  workoutExercise,
  exerciseName,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onOpen,
}: WorkoutExerciseRowProps) {
  const sets = usePlannedSets(workoutExercise.id)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-3 text-left">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
          <Dumbbell className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{exerciseName}</p>
          <p className="text-xs text-muted">
            {(sets ?? []).length} séries · descanso {workoutExercise.rest_seconds}s
            {workoutExercise.notes ? ` · ${workoutExercise.notes}` : ''}
          </p>
        </div>
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label="Mover para cima"
          className="text-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          aria-label="Mover para baixo"
          className="text-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover exercício"
        className="text-muted hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
