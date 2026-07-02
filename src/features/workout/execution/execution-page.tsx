import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import {
  useWorkout,
  useWorkoutExercises,
  useExerciseMap,
  useSessionSets,
  useLastSessionForWorkout,
} from '@/features/workout/lib/queries'
import { saveSessionSet, finishWorkoutSession } from '@/features/workout/lib/actions'
import { useActiveSession } from './use-active-session'
import { useRestTimer } from './use-rest-timer'
import { RestTimerSheet } from './rest-timer-sheet'
import { ExecutionExerciseBlock } from './execution-exercise-block'
import { SessionSummaryDialog } from './session-summary-dialog'
import type { Intensity, SessionSet, WorkoutExercise } from '@/types/domain'

export function ExecutionPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const userId = useCurrentUserId()
  const navigate = useNavigate()

  const workout = useWorkout(workoutId)
  const workoutExercises = useWorkoutExercises(workoutId)
  const exerciseMap = useExerciseMap()
  const session = useActiveSession(workoutId, userId)
  const sessionSets = useSessionSets(session?.id)
  const lastSession = useLastSessionForWorkout(workoutId)
  const restTimer = useRestTimer()

  const [summary, setSummary] = useState<{ volumeKg: number; durationMin: number; setsCompleted: number }>()

  const sessionSetMap = useMemo(
    () => new Map((sessionSets ?? []).map((s) => [`${s.workout_exercise_id}_${s.set_number}`, s])),
    [sessionSets],
  )
  const lastSetMap = useMemo(
    () => new Map((lastSession?.sets ?? []).map((s) => [`${s.workout_exercise_id}_${s.set_number}`, s])),
    [lastSession],
  )

  async function handleCompleteSet(
    workoutExercise: WorkoutExercise,
    setNumber: number,
    values: { reps: number | null; weight_kg: number | null; intensity: Intensity },
  ) {
    if (!session) return
    const set: SessionSet = {
      id: `${session.id}_${workoutExercise.id}_${setNumber}`,
      session_id: session.id,
      workout_exercise_id: workoutExercise.id,
      exercise_name: exerciseMap.get(workoutExercise.exercise_id)?.name ?? 'Exercício',
      set_number: setNumber,
      reps: values.reps,
      weight_kg: values.weight_kg,
      intensity: values.intensity,
      completed_at: new Date().toISOString(),
    }
    await saveSessionSet(set)
    restTimer.start(workoutExercise.rest_seconds)
  }

  async function handleFinish() {
    if (!session) return
    const volumeKg = (sessionSets ?? []).reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
    const durationMin = Math.max(
      1,
      Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000),
    )
    await finishWorkoutSession(session)
    setSummary({ volumeKg, durationMin, setsCompleted: (sessionSets ?? []).length })
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/treino')} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted">Executando</p>
          <h1 className="text-xl font-bold">{workout?.name ?? '...'}</h1>
        </div>
      </header>

      {(workoutExercises ?? []).map((we) => (
        <ExecutionExerciseBlock
          key={we.id}
          workoutExercise={we}
          exerciseName={exerciseMap.get(we.exercise_id)?.name ?? 'Exercício removido'}
          sessionSetMap={sessionSetMap}
          lastSetMap={lastSetMap}
          onCompleteSet={handleCompleteSet}
        />
      ))}

      {workoutExercises != null && workoutExercises.length === 0 && (
        <p className="text-sm text-muted">Esta divisão ainda não tem exercícios. Volte ao builder para adicioná-los.</p>
      )}

      <Button size="lg" onClick={handleFinish} disabled={!session}>
        <CheckCircle2 className="size-4" /> Concluir treino
      </Button>

      <RestTimerSheet
        open={restTimer.running}
        remainingMs={restTimer.remainingMs}
        totalMs={restTimer.totalMs}
        onSkip={restTimer.stop}
      />

      {summary && (
        <SessionSummaryDialog
          open
          volumeKg={summary.volumeKg}
          durationMin={summary.durationMin}
          setsCompleted={summary.setsCompleted}
        />
      )}
    </div>
  )
}
