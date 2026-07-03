import { useState } from 'react'
import { Check, Clock, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useRecipeItems, useFoodMap } from '@/features/diet/lib/queries'
import { applyRecipeToMeal } from '@/features/diet/lib/actions'
import { formatFoodQuantity, itemsMacros } from '@/features/diet/lib/macros'
import type { Meal, Recipe } from '@/types/domain'

interface RecipeDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe: Recipe
  meals: Meal[]
}

/** Detalhe de receita (V3): ingredientes com macros calculados a partir do catálogo TACO
 * (nunca ficam desalinhados), modo de preparo autoral e aplicação direta numa refeição. */
export function RecipeDetailSheet({ open, onOpenChange, recipe, meals }: RecipeDetailSheetProps) {
  const items = useRecipeItems(recipe.id)
  const foodMap = useFoodMap()
  const [appliedTo, setAppliedTo] = useState<string>()

  const macros = itemsMacros(items ?? [], foodMap)

  async function handleApply(meal: Meal) {
    await applyRecipeToMeal(meal.id, items ?? [])
    setAppliedTo(meal.name)
    setTimeout(() => onOpenChange(false), 1200)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[90svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{recipe.name}</SheetTitle>
          {recipe.description && <SheetDescription>{recipe.description}</SheetDescription>}
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 text-xs">
            {recipe.prep_minutes != null && (
              <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-muted">
                <Clock className="size-3.5" /> {recipe.prep_minutes} min
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-muted">
              <Users className="size-3.5" /> {recipe.servings} porção
            </span>
            {(recipe.tags ?? []).map((tag) => (
              <span key={tag} className="rounded-full bg-accent/15 px-2.5 py-1 font-medium text-accent">
                {tag}
              </span>
            ))}
          </div>

          <div className="rounded-md bg-surface p-3">
            <p className="text-sm font-semibold">{Math.round(macros.kcal)} kcal</p>
            <p className="text-xs text-muted">
              P {Math.round(macros.protein_g)}g · C {Math.round(macros.carbs_g)}g · G {Math.round(macros.fat_g)}g
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted">Ingredientes</h3>
            <ul className="flex flex-col gap-1.5">
              {(items ?? []).map((item) => {
                const food = foodMap.get(item.food_id)
                if (!food) return null
                return (
                  <li key={item.id} className="flex justify-between gap-2 text-sm">
                    <span>{food.name}</span>
                    <span className="shrink-0 text-muted">{formatFoodQuantity(food, item.quantity)}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {(recipe.instructions?.length ?? 0) > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted">Modo de preparo</h3>
              <ol className="flex flex-col gap-2">
                {recipe.instructions!.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-muted">Aplicar em uma refeição</h3>
            {appliedTo ? (
              <p className="flex items-center gap-2 rounded-md bg-primary/15 p-3 text-sm text-primary">
                <Check className="size-4" /> Adicionado em "{appliedTo}"
              </p>
            ) : meals.length === 0 ? (
              <p className="text-xs text-muted">Crie uma refeição primeiro para aplicar esta receita.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {meals.map((meal) => (
                  <Button key={meal.id} variant="outline" size="sm" onClick={() => void handleApply(meal)}>
                    {meal.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
