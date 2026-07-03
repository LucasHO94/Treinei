import { useMemo, useState } from 'react'
import { Search, Apple, Plus } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFoods, useFoodSearch } from '@/features/diet/lib/queries'
import { CreateFoodSheet } from './create-food-sheet'
import { cn } from '@/lib/utils'
import type { Food } from '@/types/domain'

interface FoodPickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (food: Food) => void
}

export function FoodPickerSheet({ open, onOpenChange, onSelect }: FoodPickerSheetProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const allFoods = useFoods()
  const searchResults = useFoodSearch(search)
  const [createOpen, setCreateOpen] = useState(false)

  const isSearching = search.trim().length > 0

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const f of allFoods ?? []) if (f.category) set.add(f.category)
    return [...set].sort()
  }, [allFoods])

  const list = useMemo(() => {
    const base = isSearching ? (searchResults ?? []) : (allFoods ?? [])
    return category ? base.filter((f) => f.category === category) : base
  }, [isSearching, searchResults, allFoods, category])

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

        <div className="flex flex-col gap-3">
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

          {categories.length > 0 && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              <CategoryChip active={category === null} onClick={() => setCategory(null)}>
                Todos
              </CategoryChip>
              {categories.map((cat) => (
                <CategoryChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                  {cat}
                </CategoryChip>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {list.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => handleSelect(food)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface"
                style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 52px' }}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
                  <Apple className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{food.name}</p>
                  <p className="text-xs text-muted">
                    {food.portion_desc} · {Math.round(food.kcal)} kcal
                    {food.category ? ` · ${food.category}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {isSearching && searchResults != null && list.length === 0 && (
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

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-accent text-accent-foreground' : 'bg-surface text-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
