import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { usePlannedSets, useWorkoutExercise } from '@/features/workout/lib/queries'
import {
  addPlannedSet,
  removePlannedSet,
  updatePlannedSet,
  updateWorkoutExercise,
  removeExerciseFromWorkout,
} from '@/features/workout/lib/actions'
import { INTENSITY_ORDER, INTENSITY_LABEL } from '@/features/workout/lib/intensity'
import { cn } from '@/lib/utils'

interface PlannedSetEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workoutExerciseId: string | undefined
  exerciseName: string
}

export function PlannedSetEditorSheet({
  open,
  onOpenChange,
  workoutExerciseId,
  exerciseName,
}: PlannedSetEditorSheetProps) {
  const workoutExercise = useWorkoutExercise(workoutExerciseId)
  const sets = usePlannedSets(workoutExerciseId)

  if (!workoutExercise) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[90svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{exerciseName}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Descanso (s)</label>
              <Input
                type="number"
                min={0}
                step={15}
                value={workoutExercise.rest_seconds}
                onChange={(e) =>
                  void updateWorkoutExercise(workoutExercise, {
                    rest_seconds: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex flex-[2] flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Observação</label>
              <Input
                placeholder="Ex.: pegada aberta"
                defaultValue={workoutExercise.notes ?? ''}
                onBlur={(e) =>
                  void updateWorkoutExercise(workoutExercise, { notes: e.target.value || null })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.5rem] items-center gap-2 px-1 text-xs font-medium text-muted">
              <span>#</span>
              <span>Reps</span>
              <span>Carga (kg)</span>
              <span>Intensidade</span>
              <span />
            </div>
            {(sets ?? []).map((set) => (
              <div
                key={set.id}
                className="grid grid-cols-[1.5rem_1fr_1fr_1fr_1.5rem] items-center gap-2"
              >
                <span className="text-sm tabular-nums text-muted">{set.set_number}</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="—"
                  defaultValue={set.target_reps ?? ''}
                  onBlur={(e) =>
                    void updatePlannedSet(set, {
                      target_reps: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="—"
                  defaultValue={set.target_weight_kg ?? ''}
                  onBlur={(e) =>
                    void updatePlannedSet(set, {
                      target_weight_kg: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
                <select
                  value={set.intensity}
                  onChange={(e) =>
                    void updatePlannedSet(set, { intensity: e.target.value as typeof set.intensity })
                  }
                  className="h-11 rounded-md border border-border bg-surface px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {INTENSITY_ORDER.map((i) => (
                    <option key={i} value={i}>
                      {INTENSITY_LABEL[i]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={(sets ?? []).length <= 1}
                  onClick={() => void removePlannedSet(set)}
                  aria-label="Remover série"
                  className={cn('text-muted hover:text-destructive', (sets ?? []).length <= 1 && 'opacity-30')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              onClick={() => void addPlannedSet(workoutExercise.id)}
            >
              <Plus className="size-4" /> Série
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              void removeExerciseFromWorkout(workoutExercise.id)
              onOpenChange(false)
            }}
          >
            <Trash2 className="size-4" /> Remover exercício da divisão
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
