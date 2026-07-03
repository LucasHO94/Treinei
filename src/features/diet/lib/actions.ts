import { db } from '@/lib/db'
import { mutate } from '@/lib/db/mutate'
import { requestSync } from '@/lib/sync/engine'
import { upsertMealSchedule, deleteMealSchedule } from '@/features/notifications/lib/actions'
import type { Meal, MealItem, MealLog, Food, NutritionGoals } from '@/types/domain'
import { mealItemsMacros } from './macros'

function nowIso() {
  return new Date().toISOString()
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---- Refeições ----

export async function createMeal(userId: string, name: string, scheduledAt: string): Promise<Meal> {
  const siblings = await db.meals.where('user_id').equals(userId).toArray()
  const meal: Meal = {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    scheduled_at: scheduledAt,
    sort_order: siblings.length,
    notify: true,
  }
  await mutate('meals', 'insert', meal)
  // notification_schedules espelha meal.notify/scheduled_at (RF15) — o cron do backend
  // lê essa tabela diretamente, sem precisar conhecer o domínio de refeições.
  await upsertMealSchedule(userId, meal.id, { send_time: meal.scheduled_at, enabled: meal.notify })
  return meal
}

export async function updateMeal(
  meal: Meal,
  patch: Partial<Pick<Meal, 'name' | 'scheduled_at' | 'notify'>>,
): Promise<void> {
  const updated = { ...meal, ...patch }
  await mutate('meals', 'update', updated)
  if (patch.scheduled_at !== undefined || patch.notify !== undefined) {
    await upsertMealSchedule(updated.user_id, updated.id, {
      send_time: updated.scheduled_at,
      enabled: updated.notify,
    })
  }
}

export async function deleteMeal(mealId: string): Promise<void> {
  const meal = await db.meals.get(mealId)
  if (!meal) return
  const items = await db.meal_items.where('meal_id').equals(mealId).toArray()
  for (const item of items) {
    await mutate('meal_items', 'delete', item)
  }
  const logs = await db.meal_logs.where('meal_id').equals(mealId).toArray()
  for (const log of logs) {
    await mutate('meal_logs', 'delete', log)
  }
  await deleteMealSchedule(meal.user_id, meal.id)
  await mutate('meals', 'delete', meal)
}

// ---- Itens da refeição ----

export async function addMealItem(mealId: string, foodId: string, quantity = 1): Promise<MealItem> {
  const item: MealItem = {
    id: crypto.randomUUID(),
    meal_id: mealId,
    food_id: foodId,
    quantity,
  }
  await mutate('meal_items', 'insert', item)
  return item
}

export async function updateMealItemQuantity(item: MealItem, quantity: number): Promise<void> {
  await mutate('meal_items', 'update', { ...item, quantity })
}

/** Troca o alimento do item preservando as calorias (quantidade equivalente pré-calculada). */
export async function swapMealItemFood(item: MealItem, newFoodId: string, newQuantity: number): Promise<void> {
  await mutate('meal_items', 'update', { ...item, food_id: newFoodId, quantity: newQuantity })
}

export async function removeMealItem(item: MealItem): Promise<void> {
  await mutate('meal_items', 'delete', item)
}

// ---- Alimentos (catálogo + custom) ----

export async function createCustomFood(
  ownerId: string,
  input: {
    name: string
    portion_desc: string
    portion_grams: number | null
    protein_g: number
    carbs_g: number
    fat_g: number
    kcal: number
  },
): Promise<Food> {
  const food: Food = {
    id: crypto.randomUUID(),
    name: input.name,
    portion_desc: input.portion_desc,
    portion_grams: input.portion_grams,
    protein_g: input.protein_g,
    carbs_g: input.carbs_g,
    fat_g: input.fat_g,
    kcal: input.kcal,
    is_custom: true,
    owner_id: ownerId,
  }
  await mutate('foods', 'insert', food)
  return food
}

// ---- Check-in diário (RF12) ----

/** Idempotente por (meal_id, log_date): repetir o check-in no mesmo dia atualiza o snapshot em vez de duplicar. */
export async function logMeal(
  userId: string,
  meal: Meal,
  items: MealItem[],
  foodMap: Map<string, Food>,
  date: string = todayDate(),
): Promise<MealLog> {
  const macros = mealItemsMacros(items, foodMap)
  const existing = await db.meal_logs
    .where('meal_id')
    .equals(meal.id)
    .and((l) => l.log_date === date)
    .first()

  const log: MealLog = {
    id: existing?.id ?? crypto.randomUUID(),
    user_id: userId,
    meal_id: meal.id,
    log_date: date,
    eaten_at: nowIso(),
    protein_g: macros.protein_g,
    carbs_g: macros.carbs_g,
    fat_g: macros.fat_g,
    kcal: macros.kcal,
  }
  await mutate('meal_logs', existing ? 'update' : 'insert', log)
  return log
}

export async function unlogMeal(log: MealLog): Promise<void> {
  await mutate('meal_logs', 'delete', log)
}

// ---- Metas de macros (RF13) ----
// NutritionGoals usa `user_id` como chave primária (sem campo `id`), então não se encaixa
// na assinatura genérica de mutate() — grava direto no Dexie + outbox aqui.

export async function setNutritionGoals(
  userId: string,
  patch: Partial<Omit<NutritionGoals, 'user_id'>>,
): Promise<void> {
  const existing = await db.nutrition_goals.get(userId)
  const goals: NutritionGoals = {
    user_id: userId,
    protein_g: patch.protein_g ?? existing?.protein_g ?? null,
    carbs_g: patch.carbs_g ?? existing?.carbs_g ?? null,
    fat_g: patch.fat_g ?? existing?.fat_g ?? null,
    kcal: patch.kcal ?? existing?.kcal ?? null,
  }

  await db.transaction('rw', db.nutrition_goals, db.outbox, async () => {
    await db.nutrition_goals.put(goals)
    await db.outbox.add({
      table: 'nutrition_goals',
      op: existing ? 'update' : 'insert',
      recordId: userId,
      payload: goals,
      created_at: nowIso(),
      attempts: 0,
    })
  })
  requestSync()
}
