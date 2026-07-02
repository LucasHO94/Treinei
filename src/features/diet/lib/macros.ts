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
