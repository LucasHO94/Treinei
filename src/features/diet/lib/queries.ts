import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

export function useFoodMap() {
  const list = useLiveQuery(() => db.foods.toArray(), [], [])
  return useMemo(() => new Map((list ?? []).map((f) => [f.id, f])), [list])
}

export function useFoods() {
  return useLiveQuery(
    async () => {
      const list = await db.foods.toArray()
      return list.sort((a, b) => a.name.localeCompare(b.name))
    },
    [],
    [],
  )
}

export function useFoodSearch(term: string) {
  return useLiveQuery(
    async () => {
      const q = term.trim().toLowerCase()
      if (!q) return []
      const all = await db.foods.toArray()
      return all.filter((f) => f.name.toLowerCase().includes(q)).sort((a, b) => a.name.localeCompare(b.name))
    },
    [term],
    [],
  )
}

export function useMeals(userId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      const list = await db.meals.where('user_id').equals(userId).toArray()
      return list.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    },
    [userId],
    [],
  )
}

export function useMeal(mealId: string | undefined) {
  return useLiveQuery(async () => (mealId ? db.meals.get(mealId) : undefined), [mealId])
}

export function useMealItems(mealId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!mealId) return []
      return db.meal_items.where('meal_id').equals(mealId).toArray()
    },
    [mealId],
    [],
  )
}

export function useMealLog(mealId: string | undefined, date: string) {
  return useLiveQuery(
    async () => {
      if (!mealId) return undefined
      return db.meal_logs
        .where('meal_id')
        .equals(mealId)
        .and((l) => l.log_date === date)
        .first()
    },
    [mealId, date],
  )
}

export function useMealLogsForDate(userId: string | undefined, date: string) {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      return db.meal_logs
        .where('user_id')
        .equals(userId)
        .and((l) => l.log_date === date)
        .toArray()
    },
    [userId, date],
    [],
  )
}

export function useNutritionGoals(userId: string | undefined) {
  return useLiveQuery(async () => (userId ? db.nutrition_goals.get(userId) : undefined), [userId])
}
