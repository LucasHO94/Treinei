import { ChefHat, Coffee, UtensilsCrossed, Moon, Cookie, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RecipeMealKind } from '@/types/domain'

const CATEGORIES: { kind: RecipeMealKind; label: string; icon: LucideIcon }[] = [
  { kind: 'cafe', label: 'Café da manhã', icon: Coffee },
  { kind: 'almoco', label: 'Almoço', icon: UtensilsCrossed },
  { kind: 'jantar', label: 'Jantar', icon: Moon },
  { kind: 'lanche', label: 'Lanches', icon: Cookie },
  { kind: 'pre_treino', label: 'Pré-treino', icon: Zap },
  { kind: 'pos_treino', label: 'Pós-treino', icon: ChefHat },
]

/**
 * Seção de receitas sugeridas (V2 Fase E) — o schema (recipes/recipe_items) já está
 * pronto no banco; o conteúdo curado entra na V2.1. Esta seção reserva o espaço na
 * UI e comunica o que vem por aí.
 */
export function RecipesSection() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Receitas</h2>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
          Em breve
        </span>
      </div>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map(({ kind, label, icon: Icon }) => (
          <div
            key={kind}
            className="flex h-24 w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card opacity-70"
          >
            <Icon className="size-6 text-accent" />
            <p className="text-center text-xs font-medium text-muted">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">
        Sugestões de receitas por refeição, com macros calculados e aplicação direta na sua dieta.
      </p>
    </section>
  )
}
