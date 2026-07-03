import { useState } from 'react'
import { Trash2, Apple, ArrowLeftRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { updateMealItemQuantity, removeMealItem } from '@/features/diet/lib/actions'
import { scaleMacros, gramsForQuantity, quantityForGrams } from '@/features/diet/lib/macros'
import { SwapFoodSheet } from '@/features/diet/foods/swap-food-sheet'
import type { Food, MealItem } from '@/types/domain'

interface MealItemRowProps {
  item: MealItem
  food: Food | undefined
}

export function MealItemRow({ item, food }: MealItemRowProps) {
  const macros = food ? scaleMacros(food, item.quantity) : undefined
  const [swapOpen, setSwapOpen] = useState(false)
  const grams = food ? gramsForQuantity(food, item.quantity) : null

  function handleQuantityInput(rawValue: number) {
    if (!food) return
    const safeValue = Math.max(0, rawValue)
    const quantity = grams != null ? quantityForGrams(food, safeValue) : safeValue
    void updateMealItemQuantity(item, quantity)
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
        <Apple className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{food?.name ?? 'Alimento removido'}</p>
        <p className="text-xs text-muted">
          {food?.household_measure ? `${food.household_measure} · ` : food?.portion_desc ? `${food.portion_desc} · ` : ''}
          {macros
            ? `${Math.round(macros.kcal)} kcal · P ${Math.round(macros.protein_g)}g · C ${Math.round(macros.carbs_g)}g · G ${Math.round(macros.fat_g)}g`
            : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Input
          // key força remontagem quando a quantidade muda por fora (ex.: substituição
          // equivalente) — defaultValue sozinho não atualiza input não-controlado. Inclui
          // `grams` (não só quantity) porque `food` chega undefined no primeiro render
          // (useLiveQuery assíncrono); sem isso o input fica preso no valor calculado
          // antes do alimento carregar.
          key={`${item.food_id}_${item.quantity}_${grams ?? 'q'}`}
          type="number"
          min={0}
          step={grams != null ? 5 : 0.5}
          defaultValue={grams ?? item.quantity}
          onBlur={(e) => handleQuantityInput(Number(e.target.value) || 0)}
          className="w-16 text-center"
          aria-label={grams != null ? 'Quantidade em gramas' : 'Quantidade de porções'}
        />
        {grams != null && <span className="text-xs text-muted">g</span>}
      </div>
      {food && (
        <button
          type="button"
          onClick={() => setSwapOpen(true)}
          aria-label={`Substituir ${food.name}`}
          className="text-muted hover:text-accent"
        >
          <ArrowLeftRight className="size-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => void removeMealItem(item)}
        aria-label="Remover alimento"
        className="text-muted hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>

      {food && <SwapFoodSheet open={swapOpen} onOpenChange={setSwapOpen} item={item} food={food} />}
    </div>
  )
}
