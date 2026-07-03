import { useState } from 'react'
import { Search, Apple, ArrowRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { useFoods, useFoodSearch } from '@/features/diet/lib/queries'
import { findSubstitutes, equivalentQuantity, scaleMacros, formatFoodQuantity } from '@/features/diet/lib/macros'
import { swapMealItemFood } from '@/features/diet/lib/actions'
import type { Food, MealItem } from '@/types/domain'

interface SwapFoodSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MealItem
  food: Food
}

/**
 * Substituição de alimento (V2): sugestões automáticas por proximidade de macros
 * (mesma categoria, kcal ±25%) + busca livre. A troca preserva as calorias do
 * item ajustando a quantidade equivalente.
 */
export function SwapFoodSheet({ open, onOpenChange, item, food }: SwapFoodSheetProps) {
  const [search, setSearch] = useState('')
  const allFoods = useFoods()
  const searchResults = useFoodSearch(search)

  const isSearching = search.trim().length > 0
  const suggestions = isSearching ? (searchResults ?? []).filter((f) => f.id !== food.id) : findSubstitutes(food, allFoods ?? [])
  const currentMacros = scaleMacros(food, item.quantity)

  async function handleSwap(to: Food) {
    const newQty = equivalentQuantity(food, item.quantity, to)
    await swapMealItemFood(item, to.id, newQty)
    setSearch('')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[85svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Substituir {food.name}</SheetTitle>
          <SheetDescription>
            Hoje: {formatFoodQuantity(food, item.quantity)} · {Math.round(currentMacros.kcal)} kcal. A troca mantém
            as calorias equivalentes.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Buscar outro alimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {!isSearching && suggestions.length > 0 && (
            <p className="text-xs font-medium text-muted">Sugestões equivalentes ({food.category})</p>
          )}

          <div className="flex flex-col gap-1">
            {suggestions.map((candidate) => {
              const qty = equivalentQuantity(food, item.quantity, candidate)
              const macros = scaleMacros(candidate, qty)
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => void handleSwap(candidate)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
                    <Apple className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{candidate.name}</p>
                    <p className="text-xs text-muted">
                      {formatFoodQuantity(candidate, qty)} · {Math.round(macros.kcal)} kcal · P{' '}
                      {Math.round(macros.protein_g)}g
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted" />
                </button>
              )
            })}
          </div>

          {suggestions.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
              {isSearching
                ? `Nenhum alimento encontrado para "${search}".`
                : 'Sem sugestões automáticas para este alimento — use a busca acima.'}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
