import { Link } from 'react-router-dom'
import { Flame, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useRoutines, useWorkouts } from '@/features/workout/lib/queries'
import { useMeals, useMealLogsForDate } from '@/features/diet/lib/queries'
import { todayDate } from '@/features/diet/lib/actions'
import { DayMacroSummary } from '@/features/diet/tracking/day-macro-summary'

/** Sugere a divisão do dia: primeira que casa com o weekday de hoje, senão a primeira da rotina. */
function useTodayWorkout(userId: string) {
  const routines = useRoutines(userId)
  const routine = routines?.[0]
  const workouts = useWorkouts(routine?.id)
  const weekday = new Date().getDay()
  const workout = workouts?.find((w) => w.weekday === weekday) ?? workouts?.[0]
  return { routine, workout, hasRoutines: (routines?.length ?? 0) > 0 }
}

export function TodayPage() {
  const userId = useCurrentUserId()
  const { routine, workout, hasRoutines } = useTodayWorkout(userId)

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5 text-primary" />
            Treino de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          {workout ? (
            <>
              <div>
                <p className="font-medium">{routine!.name}</p>
                <p className="text-sm text-muted">Treino {workout.label}</p>
              </div>
              <Button size="sm" asChild>
                <Link to={`/treino/executar/${workout.id}`}>Iniciar Treino {workout.label}</Link>
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>

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
