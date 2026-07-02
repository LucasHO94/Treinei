import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMealLogsForDate, useNutritionGoals } from '@/features/diet/lib/queries'
import { mealLogsMacros } from '@/features/diet/lib/macros'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { todayDate } from '@/features/diet/lib/actions'

function MacroBar({
  label,
  value,
  goal,
  unit,
}: {
  label: string
  value: number
  goal: number | null | undefined
  unit: string
}) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-foreground">
          {Math.round(value)}
          {unit}
          {goal ? (
            <span className="text-muted">
              {' '}
              / {Math.round(goal)}
              {unit}
            </span>
          ) : null}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Resumo de macros do dia (RF12): soma os snapshots de meal_logs de hoje vs. metas do perfil. */
export function DayMacroSummary() {
  const userId = useCurrentUserId()
  const date = todayDate()
  const logs = useMealLogsForDate(userId, date)
  const goals = useNutritionGoals(userId)
  const macros = mealLogsMacros(logs ?? [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macros de hoje</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <MacroBar label="Calorias" value={macros.kcal} goal={goals?.kcal} unit=" kcal" />
        <MacroBar label="Proteína" value={macros.protein_g} goal={goals?.protein_g} unit="g" />
        <MacroBar label="Carboidrato" value={macros.carbs_g} goal={goals?.carbs_g} unit="g" />
        <MacroBar label="Gordura" value={macros.fat_g} goal={goals?.fat_g} unit="g" />
        {!goals && <p className="text-xs text-muted">Defina suas metas no Perfil para ver o progresso.</p>}
      </CardContent>
    </Card>
  )
}
