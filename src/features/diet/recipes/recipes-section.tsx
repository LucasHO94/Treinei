import { useState } from 'react'
import { ChefHat, Coffee, UtensilsCrossed, Moon, Cookie, Zap, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRecipes, useMeals } from '@/features/diet/lib/queries'
import { RecipeDetailSheet } from './recipe-detail-sheet'
import { cn } from '@/lib/utils'
import type { Recipe, RecipeMealKind } from '@/types/domain'

interface RecipesSectionProps {
  userId: string
}

const CATEGORIES: { kind: RecipeMealKind; label: string; icon: LucideIcon }[] = [
  { kind: 'cafe', label: 'Café da manhã', icon: Coffee },
  { kind: 'almoco', label: 'Almoço', icon: UtensilsCrossed },
  { kind: 'jantar', label: 'Jantar', icon: Moon },
  { kind: 'lanche', label: 'Lanches', icon: Cookie },
  { kind: 'pre_treino', label: 'Pré-treino', icon: Zap },
  { kind: 'pos_treino', label: 'Pós-treino', icon: ChefHat },
]

/**
 * Sugestões de receitas por refeição (V3): ~60 receitas curadas próprias, cada uma com
 * ingredientes mapeados ao catálogo TACO (macros sempre corretos) e modo de preparo
 * autoral. Aplicar uma receita cria os itens direto na refeição escolhida.
 */
export function RecipesSection({ userId }: RecipesSectionProps) {
  const [activeKind, setActiveKind] = useState<RecipeMealKind>('cafe')
  const recipes = useRecipes(activeKind)
  const meals = useMeals(userId)
  const [detail, setDetail] = useState<Recipe | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Receitas</h2>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => setActiveKind(kind)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeKind === kind ? 'bg-accent text-accent-foreground' : 'bg-surface text-muted hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {(recipes ?? []).map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => setDetail(recipe)}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-left hover:bg-surface"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{recipe.name}</p>
              {recipe.description && <p className="truncate text-xs text-muted">{recipe.description}</p>}
            </div>
            {recipe.prep_minutes != null && (
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted">
                <Clock className="size-3.5" /> {recipe.prep_minutes}min
              </div>
            )}
          </button>
        ))}

        {recipes != null && recipes.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted">
            Nenhuma receita nessa categoria ainda.
          </p>
        )}
      </div>

      {detail && (
        <RecipeDetailSheet open onOpenChange={(open) => !open && setDetail(null)} recipe={detail} meals={meals ?? []} />
      )}
    </section>
  )
}
