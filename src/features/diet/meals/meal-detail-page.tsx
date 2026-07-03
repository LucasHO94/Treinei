import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useMeal, useMealItems, useFoodMap } from '@/features/diet/lib/queries'
import { updateMeal, deleteMeal, addMealItem } from '@/features/diet/lib/actions'
import { mealItemsMacros } from '@/features/diet/lib/macros'
import { FoodPickerSheet } from '@/features/diet/foods/food-picker-sheet'
import { MealItemRow } from './meal-item-row'

export function MealDetailPage() {
  const { mealId } = useParams<{ mealId: string }>()
  const navigate = useNavigate()
  const meal = useMeal(mealId)
  const items = useMealItems(mealId)
  const foodMap = useFoodMap()
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!meal) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-[2]" />
          <Skeleton className="h-11 flex-1" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const macros = mealItemsMacros(items ?? [], foodMap)

  async function handleDelete() {
    if (!window.confirm(`Excluir a refeição "${meal!.name}"?`)) return
    await deleteMeal(meal!.id)
    navigate('/dieta')
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate('/dieta')} aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="flex-1 truncate text-xl font-bold">{meal.name}</h1>
        <button type="button" onClick={handleDelete} aria-label="Excluir refeição" className="text-muted hover:text-destructive">
          <Trash2 className="size-4" />
        </button>
      </header>

      <div className="flex gap-3">
        <div className="flex flex-[2] flex-col gap-1.5">
          <label className="text-xs font-medium text-muted">Nome</label>
          <Input
            defaultValue={meal.name}
            onBlur={(e) => {
              const name = e.target.value.trim()
              if (name && name !== meal.name) void updateMeal(meal, { name })
            }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-muted">Horário</label>
          <Input
            type="time"
            defaultValue={meal.scheduled_at.slice(0, 5)}
            onChange={(e) => void updateMeal(meal, { scheduled_at: `${e.target.value}:00` })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={meal.notify}
          onChange={(e) => void updateMeal(meal, { notify: e.target.checked })}
          className="size-4 rounded border-border accent-primary"
        />
        Notificar no horário desta refeição
      </label>

      <p className="text-xs text-muted">
        Total: {Math.round(macros.kcal)} kcal · P {Math.round(macros.protein_g)}g · C {Math.round(macros.carbs_g)}g · G{' '}
        {Math.round(macros.fat_g)}g
      </p>

      <div className="flex flex-col gap-2">
        {(items ?? []).map((item) => (
          <MealItemRow key={item.id} item={item} food={foodMap.get(item.food_id)} />
        ))}

        <Button variant="outline" onClick={() => setPickerOpen(true)}>
          <Plus className="size-4" /> Adicionar alimento
        </Button>
      </div>

      <FoodPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(food) => void addMealItem(meal.id, food.id)}
      />
    </div>
  )
}
