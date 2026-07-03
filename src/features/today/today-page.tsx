import { Link } from 'react-router-dom'
import { Flame, UtensilsCrossed } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useRoutines, useWorkouts } from '@/features/workout/lib/queries'
import { useMeals, useMealLogsForDate } from '@/features/diet/lib/queries'
import { todayDate } from '@/features/diet/lib/actions'
import { DayMacroSummary } from '@/features/diet/tracking/day-macro-summary'
import { exerciseImageUrl } from '@/lib/catalog/media'

/** Sugere a divisão do dia: primeira que casa com o weekday de hoje, senão a primeira da rotina. */
function useTodayWorkout(userId: string) {
  const routines = useRoutines(userId)
  const routine = routines?.[0]
  const workouts = useWorkouts(routine?.id)
  const weekday = new Date().getDay()
  const workout = workouts?.find((w) => w.weekday === weekday) ?? workouts?.[0]
  return { routine, workout, hasRoutines: (routines?.length ?? 0) > 0 }
}

/** Foto de capa do treino do dia: imagem do grupo muscular mais frequente na divisão. */
function useWorkoutCover(workoutId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!workoutId) return null
      const wes = await db.workout_exercises.where('workout_id').equals(workoutId).toArray()
      if (!wes.length) return null
      const exercises = await db.exercises.bulkGet(wes.map((we) => we.exercise_id))
      const freq = new Map<number, number>()
      for (const ex of exercises) {
        if (ex) freq.set(ex.muscle_group_id, (freq.get(ex.muscle_group_id) ?? 0) + 1)
      }
      const topGroupId = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      if (topGroupId == null) return null
      const group = await db.muscle_groups.get(topGroupId)
      return group?.image_url ?? null
    },
    [workoutId],
    null,
  )
}

export function TodayPage() {
  const userId = useCurrentUserId()
  const { routine, workout, hasRoutines } = useTodayWorkout(userId)
  const cover = useWorkoutCover(workout?.id)

  const date = todayDate()
  const meals = useMeals(userId)
  const logs = useMealLogsForDate(userId, date)
  const loggedMealIds = new Set((logs ?? []).map((l) => l.meal_id))
  const nextMeal = (meals ?? []).find((m) => !loggedMealIds.has(m.id))

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <p className="text-sm text-muted">Hoje</p>
        <h1 className="text-2xl font-bold">Bora treinar 💪</h1>
      </header>

      {workout ? (
        <Link
          to={`/treino/executar/${workout.id}`}
          className="relative block h-40 overflow-hidden rounded-lg transition-transform active:scale-[0.99]"
        >
          {cover && (
            <img
              src={exerciseImageUrl(cover) ?? undefined}
              alt=""
              aria-hidden
              className="absolute inset-0 size-full object-cover object-[center_25%]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-background/20" />
          <div className="relative flex h-full flex-col justify-end p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Flame className="size-3.5" /> Treino de hoje
            </p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold leading-tight">{workout.name}</p>
                <p className="text-xs text-muted">{routine!.name}</p>
              </div>
              <Button size="sm" className="pointer-events-none shrink-0">
                Iniciar Treino {workout.label}
              </Button>
            </div>
          </div>
        </Link>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-5 text-primary" />
              Treino de hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">{hasRoutines ? 'Nenhuma divisão cadastrada' : 'Nenhuma rotina ativa'}</p>
              <p className="text-sm text-muted">
                {hasRoutines ? 'Adicione divisões à sua rotina' : 'Crie uma rotina para começar'}
              </p>
            </div>
            <Button size="sm" asChild>
              <Link to={hasRoutines ? `/treino/rotina/${routine!.id}` : '/treino'}>
                {hasRoutines ? 'Editar rotina' : 'Criar rotina'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-5 text-accent" />
            Próxima refeição
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextMeal ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{nextMeal.name}</p>
                <p className="text-sm text-muted">às {nextMeal.scheduled_at.slice(0, 5)}</p>
              </div>
              <Button size="sm" variant="accent" asChild>
                <Link to="/dieta">Ver</Link>
              </Button>
            </div>
          ) : (meals ?? []).length > 0 ? (
            <p className="text-sm text-muted">Todas as refeições de hoje foram registradas 🎉</p>
          ) : (
            <p className="text-sm text-muted">Configure suas refeições na aba Dieta</p>
          )}
        </CardContent>
      </Card>

      <DayMacroSummary />
    </div>
  )
}
