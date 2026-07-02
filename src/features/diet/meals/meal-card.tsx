import { Link } from 'react-router-dom'
import { Check, Pencil, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMealItems, useFoodMap, useMealLog } from '@/features/diet/lib/queries'
import { logMeal, unlogMeal, todayDate } from '@/features/diet/lib/actions'
import { mealItemsMacros } from '@/features/diet/lib/macros'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { cn } from '@/lib/utils'
import type { Meal } from '@/types/domain'

export function MealCard({ meal }: { meal: Meal }) {
  const userId = useCurrentUserId()
  const items = useMealItems(meal.id)
  const foodMap = useFoodMap()
  const date = todayDate()
  const log = useMealLog(meal.id, date)
  const macros = mealItemsMacros(items ?? [], foodMap)
  const eaten = !!log

  async function handleToggle() {
    if (log) {
      await unlogMeal(log)
    } else {
      await logMeal(userId, meal, items ?? [], foodMap, date)
    }
  }

  return (
    <Card className={cn(eaten && 'opacity-70')}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{meal.name}</CardTitle>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
            <Clock className="size-3" /> {meal.scheduled_at.slice(0, 5)} · {Math.round(macros.kcal)} kcal
          </p>
        </div>
        <Link
          to={`/dieta/refeicao/${meal.id}`}
          aria-label="Editar refeição"
          className="text-muted hover:text-foreground"
        >
          <Pencil className="size-4" />
        </Link>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        {(items ?? []).length === 0 ? (
          <Link to={`/dieta/refeicao/${meal.id}`} className="text-sm text-muted">
            Adicionar alimentos
          </Link>
        ) : (
          <p className="text-xs text-muted">
            P {Math.round(macros.protein_g)}g · C {Math.round(macros.carbs_g)}g · G {Math.round(macros.fat_g)}g
          </p>
        )}
        <Button size="sm" variant={eaten ? 'outline' : 'accent'} onClick={handleToggle}>
          <Check className="size-3.5" /> {eaten ? 'Comido' : 'Comi'}
        </Button>
      </CardContent>
    </Card>
  )
}
