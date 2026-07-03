import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useRoutine,
  useWorkouts,
  useWorkoutExercises,
  useExerciseMap,
} from '@/features/workout/lib/queries'
import {
  createWorkout,
  renameWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  reorderWorkoutExercises,
} from '@/features/workout/lib/actions'
import { Skeleton } from '@/components/ui/skeleton'
import { ExercisePickerSheet } from '@/features/workout/catalog/exercise-picker-sheet'
import { ExerciseDetailOverlay } from '@/features/workout/catalog/exercise-detail-overlay'
import { PlannedSetEditorSheet } from './planned-set-editor-sheet'
import { WorkoutExerciseRow } from './workout-exercise-row'
import { cn } from '@/lib/utils'
import type { Exercise, WorkoutExercise } from '@/types/domain'

function nextLabel(existing: string[]): string {
  const letters = 'ABCDEFGHIJ'
  for (const letter of letters) {
    if (!existing.includes(letter)) return letter
  }
  return String(existing.length + 1)
}

export function RoutineBuilderPage() {
  const { routineId } = useParams<{ routineId: string }>()
  const navigate = useNavigate()
  const routine = useRoutine(routineId)
  const workouts = useWorkouts(routineId)
  const exerciseMap = useExerciseMap()

  const [selectedWorkoutId, setActiveWorkoutId] = useState<string>()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise>()
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)

  // Deriva a divisão ativa em vez de "corrigir" o estado via efeito: evita uma corrida
  // onde o efeito reverte a seleção recém-criada antes da live query do Dexie atualizar
  // a lista de workouts (o novo item ainda não aparece em `workouts` por um instante).
  const activeWorkoutId = useMemo(() => {
    if (selectedWorkoutId && workouts?.some((w) => w.id === selectedWorkoutId)) return selectedWorkoutId
    return workouts?.[0]?.id
  }, [workouts, selectedWorkoutId])

  const workoutExercises = useWorkoutExercises(activeWorkoutId)

  if (!routine) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-7 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-14 rounded-full" />
          <Skeleton className="h-9 w-14 rounded-full" />
          <Skeleton className="h-9 w-14 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  async function handleAddDivision() {
    const created = await createWorkout(routineId!, nextLabel((workouts ?? []).map((w) => w.label ?? '')))
    setActiveWorkoutId(created.id)
  }

  async function handleRenameDivision() {
    const active = workouts?.find((w) => w.id === activeWorkoutId)
    if (!active) return
    const label = window.prompt('Nome da divisão', active.label ?? '')?.trim()
    if (!label) return
    await renameWorkout(active, label)
  }

  async function handleDeleteDivision() {
    const active = workouts?.find((w) => w.id === activeWorkoutId)
    if (!active) return
    if (!window.confirm(`Excluir a divisão "${active.label}" e todos os seus exercícios?`)) return
    await deleteWorkout(active.id)
    setActiveWorkoutId(undefined)
  }

  async function handleAddExercises(exercises: Exercise[]) {
    if (!activeWorkoutId) return
    for (const exercise of exercises) {
      await addExerciseToWorkout(activeWorkoutId, exercise.id)
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!workoutExercises) return
    const ids = workoutExercises.map((w) => w.id)
    const swapWith = index + direction
    if (swapWith < 0 || swapWith >= ids.length) return
    ;[ids[index], ids[swapWith]] = [ids[swapWith], ids[index]]
    await reorderWorkoutExercises(activeWorkoutId!, ids)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/treino')} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 truncate text-xl font-bold">{routine.name}</h1>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(workouts ?? []).map((workout) => (
          <button
            key={workout.id}
            type="button"
            onClick={() => setActiveWorkoutId(workout.id)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors',
              activeWorkoutId === workout.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-foreground hover:bg-card',
            )}
          >
            {workout.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleAddDivision}
          aria-label="Adicionar divisão"
          className="flex size-8 items-center justify-center rounded-full border border-dashed border-border text-muted hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {activeWorkoutId && (
        <div className="flex items-center justify-end gap-4 text-xs text-muted">
          <button type="button" onClick={handleRenameDivision} className="flex items-center gap-1 hover:text-foreground">
            <Pencil className="size-3.5" /> Renomear
          </button>
          <button type="button" onClick={handleDeleteDivision} className="flex items-center gap-1 hover:text-destructive">
            <Trash2 className="size-3.5" /> Excluir divisão
          </button>
        </div>
      )}

      {!activeWorkoutId && (
        <p className="text-sm text-muted">Crie uma divisão (A, B, C...) para começar a adicionar exercícios.</p>
      )}

      {activeWorkoutId && (
        <div className="flex flex-col gap-2">
          {(workoutExercises ?? []).map((we, index) => (
            <WorkoutExerciseRow
              key={we.id}
              workoutExercise={we}
              exercise={exerciseMap.get(we.exercise_id)}
              isFirst={index === 0}
              isLast={index === (workoutExercises?.length ?? 1) - 1}
              onMoveUp={() => void handleMove(index, -1)}
              onMoveDown={() => void handleMove(index, 1)}
              onRemove={() => void removeExerciseFromWorkout(we.id)}
              onOpen={() => setEditingExercise(we)}
              onShowDetail={() => setDetailExercise(exerciseMap.get(we.exercise_id) ?? null)}
            />
          ))}

          <Button variant="outline" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" /> Adicionar exercício
          </Button>
        </div>
      )}

      <ExercisePickerSheet open={pickerOpen} onOpenChange={setPickerOpen} onAdd={handleAddExercises} />

      <ExerciseDetailOverlay exercise={detailExercise} onClose={() => setDetailExercise(null)} />

      <PlannedSetEditorSheet
        open={!!editingExercise}
        onOpenChange={(next) => !next && setEditingExercise(undefined)}
        workoutExerciseId={editingExercise?.id}
        exerciseName={
          editingExercise ? exerciseMap.get(editingExercise.exercise_id)?.name ?? 'Exercício' : ''
        }
      />
    </div>
  )
}
