import { Trash2, Apple } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { updateMealItemQuantity, removeMealItem } from '@/features/diet/lib/actions'
import { scaleMacros } from '@/features/diet/lib/macros'
import type { Food, MealItem } from '@/types/domain'

interface MealItemRowProps {
  item: MealItem
  food: Food | undefined
}

export function MealItemRow({ item, food }: MealItemRowProps) {
  const macros = food ? scaleMacros(food, item.quantity) : undefined

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
        <Apple className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{food?.name ?? 'Alimento removido'}</p>
        <p className="text-xs text-muted">
          {food?.portion_desc}
          {macros
            ? ` · ${Math.round(macros.kcal)} kcal · P ${Math.round(macros.protein_g)}g · C ${Math.round(macros.carbs_g)}g · G ${Math.round(macros.fat_g)}g`
            : ''}
        </p>
      </div>
      <Input
        type="number"
        min={0}
        step={0.5}
        defaultValue={item.quantity}
        onBlur={(e) => void updateMealItemQuantity(item, Number(e.target.value) || 0)}
        className="w-16 text-center"
      />
      <button
        type="button"
        onClick={() => void removeMealItem(item)}
        aria-label="Remover alimento"
        className="text-muted hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
