import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import {
  useWorkout,
  useWorkoutExercises,
  useExerciseMap,
  useSessionSets,
  useLastSessionForWorkout,
  usePlannedSetsCountByExercise,
} from '@/features/workout/lib/queries'
import { saveSessionSet, finishWorkoutSession } from '@/features/workout/lib/actions'
import { useActiveSession } from './use-active-session'
import { useExerciseTimers } from './use-exercise-timers'
import { ExecutionExerciseBlock } from './execution-exercise-block'
import { SessionSummaryDialog } from './session-summary-dialog'
import { ExerciseDetailOverlay } from '@/features/workout/catalog/exercise-detail-overlay'
import type { Exercise, Intensity, SessionSet, WorkoutExercise } from '@/types/domain'

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
  const timers = useExerciseTimers()

  const [summary, setSummary] = useState<{
    workoutName: string
    volumeKg: number
    durationMin: number
    setsCompleted: number
  }>()
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null)

  const workoutExerciseIds = useMemo(() => (workoutExercises ?? []).map((we) => we.id), [workoutExercises])
  const plannedCounts = usePlannedSetsCountByExercise(workoutExerciseIds)

  const sessionSetMap = useMemo(
    () => new Map((sessionSets ?? []).map((s) => [`${s.workout_exercise_id}_${s.set_number}`, s])),
    [sessionSets],
  )
  const lastSetMap = useMemo(
    () => new Map((lastSession?.sets ?? []).map((s) => [`${s.workout_exercise_id}_${s.set_number}`, s])),
    [lastSession],
  )

  // Exercício "atual" (destacado): o primeiro, em ordem, que ainda não teve todas as séries concluídas.
  const currentExerciseId = useMemo(() => {
    for (const we of workoutExercises ?? []) {
      const total = plannedCounts.get(we.id) ?? 0
      let completed = 0
      for (let n = 1; n <= total; n++) if (sessionSetMap.has(`${we.id}_${n}`)) completed++
      if (total === 0 || completed < total) return we.id
    }
    return undefined
  }, [workoutExercises, plannedCounts, sessionSetMap])

  async function handleCompleteSet(
    workoutExercise: WorkoutExercise,
    setNumber: number,
    values: { reps: number | null; weight_kg: number | null; intensity: Intensity },
  ) {
    if (!session) return
    const exerciseName = exerciseMap.get(workoutExercise.exercise_id)?.name ?? 'Exercício'
    const set: SessionSet = {
      id: `${session.id}_${workoutExercise.id}_${setNumber}`,
      session_id: session.id,
      workout_exercise_id: workoutExercise.id,
      exercise_name: exerciseName,
      set_number: setNumber,
      reps: values.reps,
      weight_kg: values.weight_kg,
      intensity: values.intensity,
      completed_at: new Date().toISOString(),
    }
    await saveSessionSet(set)

    const total = plannedCounts.get(workoutExercise.id) ?? 0
    const label = setNumber < total ? `Próxima: série ${setNumber + 1}/${total}` : 'Última série concluída'
    timers.start(workoutExercise.id, workoutExercise.rest_seconds, exerciseName, label)
  }

  function handleAllSetsDone(workoutExerciseId: string) {
    const list = workoutExercises ?? []
    const idx = list.findIndex((we) => we.id === workoutExerciseId)
    const next = list[idx + 1]
    if (!next) return
    requestAnimationFrame(() => {
      document.getElementById(`exercise-block-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function handleFinish() {
    if (!session) return
    const volumeKg = (sessionSets ?? []).reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
    const durationMin = Math.max(
      1,
      Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000),
    )
    await finishWorkoutSession(session)
    setSummary({ workoutName: workout?.name ?? 'Treino', volumeKg, durationMin, setsCompleted: (sessionSets ?? []).length })
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
          exercise={exerciseMap.get(we.exercise_id)}
          sessionSetMap={sessionSetMap}
          lastSetMap={lastSetMap}
          isCurrent={we.id === currentExerciseId}
          timer={timers.timers.get(we.id)}
          onCompleteSet={handleCompleteSet}
          onShowDetail={setDetailExercise}
          onSkipTimer={() => timers.stop(we.id)}
          onAllSetsDone={() => handleAllSetsDone(we.id)}
        />
      ))}

      <ExerciseDetailOverlay exercise={detailExercise} onClose={() => setDetailExercise(null)} />

      {workoutExercises != null && workoutExercises.length === 0 && (
        <p className="text-sm text-muted">Esta divisão ainda não tem exercícios. Volte ao builder para adicioná-los.</p>
      )}

      <div className="sticky bottom-2 z-10 flex flex-col gap-2">
        {[...timers.timers.entries()]
          .filter(([id]) => id !== currentExerciseId)
          .map(([id, t]) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg border border-primary/40 bg-card/95 px-3 py-2 shadow-lg backdrop-blur"
            >
              <div>
                <p className="text-xs font-medium">{t.exerciseName}</p>
                <p className="text-xs text-muted">{t.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tabular-nums text-primary">
                  {Math.max(0, Math.ceil(t.remainingMs / 1000))}s
                </span>
                <button
                  type="button"
                  onClick={() => timers.stop(id)}
                  aria-label={`Pular descanso de ${t.exerciseName}`}
                  className="text-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))}
        <Button size="lg" onClick={handleFinish} disabled={!session}>
          <CheckCircle2 className="size-4" /> Concluir treino
        </Button>
      </div>

      {summary && (
        <SessionSummaryDialog
          open
          workoutName={summary.workoutName}
          volumeKg={summary.volumeKg}
          durationMin={summary.durationMin}
          setsCompleted={summary.setsCompleted}
        />
      )}
    </div>
  )
}
