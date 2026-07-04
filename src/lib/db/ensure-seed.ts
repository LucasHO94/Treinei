import { db } from './index'
import { LOCAL_MUSCLE_GROUPS, LOCAL_EXERCISES, LOCAL_FOODS } from './local-seed'
import type { MuscleGroup, Exercise, Food, Recipe, RecipeItem } from '@/types/domain'

/**
 * Versão do catálogo embarcado em public/data/*.json (gerado pelos scripts
 * scripts/import-exercises.mjs, scripts/import-foods.mjs e scripts/build-recipes.mjs).
 * Incrementar lá e aqui quando o dataset mudar — a hidratação re-executa apenas nessa
 * transição.
 */
const CATALOG_VERSION = 5
const VERSION_KEY = 'treinei-catalog-version'

interface ExercisesFile {
  version: number
  muscleGroups: MuscleGroup[]
  exercises: Exercise[]
}

interface FoodsFile {
  version: number
  foods: Food[]
}

interface RecipesFile {
  version: number
  recipes: Recipe[]
  recipeItems: RecipeItem[]
}

/**
 * Garante o catálogo nativo (grupos, exercícios, alimentos) no Dexie.
 *
 * V2: o catálogo completo (~873 exercícios + ~613 alimentos) vive em
 * public/data/*.json — fora do bundle JS — e é hidratado aqui via fetch com
 * controle de versão. Os JSONs entram no precache do Service Worker, então após
 * a instalação do PWA a hidratação funciona offline.
 *
 * bulkPut é idempotente e só toca registros nativos (IDs fixos do catálogo);
 * exercícios/alimentos custom do usuário têm UUIDs próprios e nunca são afetados.
 *
 * Fallback: se o fetch falhar (primeiro load já offline, sem SW instalado) e o
 * banco estiver vazio, semeia o catálogo mínimo V1 embutido no bundle para o app
 * continuar utilizável; a próxima visita online completa a hidratação.
 */
export async function ensureLocalSeed(): Promise<void> {
  const installed = Number(localStorage.getItem(VERSION_KEY) ?? '0')
  if (installed >= CATALOG_VERSION) return

  try {
    const [exRes, foodRes, recipeRes] = await Promise.all([
      fetch('/data/exercises.json'),
      fetch('/data/foods.json'),
      fetch('/data/recipes.json'),
    ])
    if (!exRes.ok || !foodRes.ok || !recipeRes.ok) throw new Error('catálogo indisponível')
    const exFile = (await exRes.json()) as ExercisesFile
    const foodFile = (await foodRes.json()) as FoodsFile
    const recipeFile = (await recipeRes.json()) as RecipesFile

    await db.transaction(
      'rw',
      [db.muscle_groups, db.exercises, db.foods, db.recipes, db.recipe_items],
      async () => {
        await db.muscle_groups.bulkPut(exFile.muscleGroups)
        await db.exercises.bulkPut(exFile.exercises)
        await db.foods.bulkPut(foodFile.foods)
        await db.recipes.bulkPut(recipeFile.recipes)
        await db.recipe_items.bulkPut(recipeFile.recipeItems)
      },
    )
    localStorage.setItem(VERSION_KEY, String(CATALOG_VERSION))
  } catch {
    const [groupCount, exerciseCount, foodCount] = await Promise.all([
      db.muscle_groups.count(),
      db.exercises.count(),
      db.foods.count(),
    ])
    if (groupCount === 0) await db.muscle_groups.bulkPut(LOCAL_MUSCLE_GROUPS)
    if (exerciseCount === 0) await db.exercises.bulkPut(LOCAL_EXERCISES)
    if (foodCount === 0) await db.foods.bulkPut(LOCAL_FOODS)
  }
}
