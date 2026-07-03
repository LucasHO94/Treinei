import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { usePlannedSets } from '@/features/workout/lib/queries'
import { ExerciseMedia } from '@/components/exercise-media'
import type { Exercise, WorkoutExercise } from '@/types/domain'

interface WorkoutExerciseRowProps {
  workoutExercise: WorkoutExercise
  exercise: Exercise | undefined
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onOpen: () => void
  /** Abre o overlay de execução (mídia + instruções) — tocar na miniatura. */
  onShowDetail: () => void
}

export function WorkoutExerciseRow({
  workoutExercise,
  exercise,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onOpen,
  onShowDetail,
}: WorkoutExerciseRowProps) {
  const sets = usePlannedSets(workoutExercise.id)
  const exerciseName = exercise?.name ?? 'Exercício removido'

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        onClick={onShowDetail}
        aria-label={`Ver execução de ${exerciseName}`}
        className="shrink-0"
      >
        <ExerciseMedia
          exercise={exercise ?? { name: exerciseName, images: null, media_url: null }}
          animate={false}
          className="size-12 rounded-md"
        />
      </button>

      <button type="button" onClick={onOpen} className="flex flex-1 items-center gap-3 text-left">
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
