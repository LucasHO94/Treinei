import { useState } from 'react'
import { Search, Apple, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFoods, useFoodSearch } from '@/features/diet/lib/queries'
import { CreateFoodSheet } from './create-food-sheet'
import type { Food } from '@/types/domain'

interface FoodPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (food: Food) => void
}

export function FoodPickerSheet({ open, onOpenChange, onSelect }: FoodPickerSheetProps) {
  const [search, setSearch] = useState('')
  const allFoods = useFoods()
  const searchResults = useFoodSearch(search)
  const [createOpen, setCreateOpen] = useState(false)

  const isSearching = search.trim().length > 0
  const list = isSearching ? searchResults : allFoods

  function handleSelect(food: Food) {
    onSelect(food)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[90svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar alimento</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              autoFocus
              placeholder="Buscar alimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col gap-1">
            {(list ?? []).map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleSelect(food)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
                  <Apple className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{food.name}</p>
                  <p className="text-xs text-muted">
                    {food.portion_desc} · {Math.round(food.kcal)} kcal
                  </p>
                </div>
              </button>
            ))}
          </div>

          {isSearching && searchResults != null && searchResults.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted">Nenhum alimento encontrado para "{search}".</p>
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus /> Criar "{search}" como alimento personalizado
              </Button>
            </div>
          )}

          {!isSearching && (
            <Button size="sm" variant="ghost" className="self-start" onClick={() => setCreateOpen(true)}>
              <Plus /> Criar alimento personalizado
            </Button>
          )}
        </div>

        <CreateFoodSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          initialName={isSearching ? search : undefined}
          onCreated={handleSelect}
        />
      </SheetContent>
    </Sheet>
  )
}
