import type { Food, MealItem, MealLog } from '@/types/domain'

export interface Macros {
  protein_g: number
  carbs_g: number
  fat_g: number
  kcal: number
}

export const EMPTY_MACROS: Macros = { protein_g: 0, carbs_g: 0, fat_g: 0, kcal: 0 }

/** `quantity` é o multiplicador da porção do alimento (1 = uma porção conforme `portion_desc`). */
export function scaleMacros(food: Pick<Food, 'protein_g' | 'carbs_g' | 'fat_g' | 'kcal'>, quantity: number): Macros {
  return {
    protein_g: food.protein_g * quantity,
    carbs_g: food.carbs_g * quantity,
    fat_g: food.fat_g * quantity,
    kcal: food.kcal * quantity,
  }
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (acc, m) => ({
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
      kcal: acc.kcal + m.kcal,
    }),
    { ...EMPTY_MACROS },
  )
}

export function mealItemsMacros(items: MealItem[], foodMap: Map<string, Food>): Macros {
  return sumMacros(
    items.map((item) => {
      const food = foodMap.get(item.food_id)
      return food ? scaleMacros(food, item.quantity) : EMPTY_MACROS
    }),
  )
}

export function mealLogsMacros(logs: MealLog[]): Macros {
  return sumMacros(
    logs.map((log) => ({
      protein_g: log.protein_g ?? 0,
      carbs_g: log.carbs_g ?? 0,
      fat_g: log.fat_g ?? 0,
      kcal: log.kcal ?? 0,
    })),
  )
}

// ---- Substituição de alimentos (V2) ----

/**
 * Sugere substitutos para um alimento: mesma categoria, kcal por 100g dentro de
 * ±25%, ordenados pela menor distância combinada de kcal e proteína (os dois
 * eixos que mais importam numa troca de dieta). Retorna no máximo `limit`.
 */
export function findSubstitutes(food: Food, allFoods: Food[], limit = 8): Food[] {
  const per100 = (f: Food) => {
    const grams = f.portion_grams || 100
    return { kcal: (f.kcal / grams) * 100, protein: (f.protein_g / grams) * 100 }
  }
  const base = per100(food)
  if (base.kcal <= 0) return []

  return allFoods
    .filter(
      (f) =>
        f.id !== food.id &&
        f.category != null &&
        f.category === food.category &&
        Math.abs(per100(f).kcal - base.kcal) / base.kcal <= 0.25,
    )
    .map((f) => {
      const p = per100(f)
      const kcalDist = Math.abs(p.kcal - base.kcal) / base.kcal
      const proteinDist = base.protein > 0 ? Math.abs(p.protein - base.protein) / base.protein : 0
      return { food: f, score: kcalDist + proteinDist * 0.5 }
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((s) => s.food)
}

/**
 * Quantidade equivalente em kcal ao trocar `from` (com `quantity` porções) por `to`.
 * Arredonda para múltiplos de 0.25 porção (mínimo 0.25).
 */
export function equivalentQuantity(from: Food, quantity: number, to: Food): number {
  if (to.kcal <= 0) return quantity
  const targetKcal = from.kcal * quantity
  const raw = targetKcal / to.kcal
  return Math.max(0.25, Math.round(raw * 4) / 4)
}
