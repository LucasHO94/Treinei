import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useMeals } from './lib/queries'
import { MealCard } from './meals/meal-card'
import { CreateMealDialog } from './meals/create-meal-dialog'
import { DayMacroSummary } from './tracking/day-macro-summary'
import { RecipesSection } from './recipes/recipes-section'

export function DietPage() {
  const userId = useCurrentUserId()
  const meals = useMeals(userId)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dieta</h1>
        <Button size="sm" variant="accent" onClick={() => setCreateOpen(true)}>
          <Plus /> Nova refeição
        </Button>
      </header>

      <DayMacroSummary />

      {meals != null && meals.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma refeição programada</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Cadastre suas refeições diárias (Café da Manhã, Almoço, Lanche, Jantar) com os alimentos e macros.
          </CardContent>
        </Card>
      )}

      {(meals ?? []).map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <RecipesSection />

      <CreateMealDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
