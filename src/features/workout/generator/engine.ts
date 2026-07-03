import type { Exercise, Intensity } from '@/types/domain'

// Motor determinístico de geração de treino (V3): sem IA/backend — regras sobre os
// metadados que o catálogo V2 já traz (goals/level/mechanics/equipment). Função pura,
// recebe o catálogo já carregado do Dexie e devolve divisões prontas para persistir.

export type Goal = 'hipertrofia' | 'força' | 'definição' | 'perda de peso' | 'resistência' | 'mobilidade'
export type Level = 'iniciante' | 'intermediário' | 'avançado'
export type EquipmentMode = 'academia' | 'casa_halteres' | 'peso_corpo'

export const GOAL_OPTIONS: { key: Goal; label: string }[] = [
  { key: 'hipertrofia', label: 'Hipertrofia' },
  { key: 'força', label: 'Força' },
  { key: 'definição', label: 'Definição' },
  { key: 'perda de peso', label: 'Perda de peso' },
  { key: 'resistência', label: 'Resistência' },
  { key: 'mobilidade', label: 'Mobilidade' },
]

export const EQUIPMENT_MODE_OPTIONS: { key: EquipmentMode; label: string }[] = [
  { key: 'academia', label: 'Academia completa' },
  { key: 'casa_halteres', label: 'Halteres em casa' },
  { key: 'peso_corpo', label: 'Peso do corpo' },
]

const EQUIPMENT_ALLOWED: Record<EquipmentMode, Set<string> | null> = {
  academia: null, // null = qualquer equipamento
  casa_halteres: new Set(['Halteres', 'Peso do corpo', 'Elástico', 'Bola de exercício', 'Kettlebell', 'Medicine ball', 'Rolo de espuma']),
  peso_corpo: new Set(['Peso do corpo', 'Elástico']),
}

const LEVEL_ORDER: Record<Level, number> = { iniciante: 0, intermediário: 1, avançado: 2 }

// ---- Regiões do corpo (agrupam os 12 muscle_groups do catálogo em algo que o usuário escolhe) ----

export interface RegionOption {
  key: string
  label: string
  groupIds: number[]
}

const PEITO = [1]
const COSTAS = [2, 7]
const OMBROS = [3]
const BRACOS = [4, 5, 6]
const PERNAS = [9, 11]
const GLUTEOS = [10]
const CORE = [8]
const TODOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export const REGION_OPTIONS: RegionOption[] = [
  { key: 'peito', label: 'Peito', groupIds: PEITO },
  { key: 'costas', label: 'Costas', groupIds: COSTAS },
  { key: 'ombros', label: 'Ombros', groupIds: OMBROS },
  { key: 'bracos', label: 'Braços', groupIds: BRACOS },
  { key: 'pernas', label: 'Pernas', groupIds: PERNAS },
  { key: 'gluteos', label: 'Glúteos', groupIds: GLUTEOS },
  { key: 'core', label: 'Core / Abdômen', groupIds: CORE },
  { key: 'corpo_todo', label: 'Corpo todo', groupIds: TODOS },
]

// ---- Splits por dias/semana (grupos musculares coerentes por divisão) ----

interface SplitDay {
  name: string
  groupIds: number[]
}

const SPLIT_TEMPLATES: Record<number, SplitDay[]> = {
  1: [{ name: 'Full Body', groupIds: TODOS }],
  2: [
    { name: 'Superior', groupIds: [...PEITO, ...COSTAS, ...OMBROS, ...BRACOS] },
    { name: 'Inferior', groupIds: [...PERNAS, ...GLUTEOS, ...CORE] },
  ],
  3: [
    { name: 'Empurrar', groupIds: [...PEITO, ...OMBROS, 5] },
    { name: 'Puxar', groupIds: [...COSTAS, 4, 6] },
    { name: 'Pernas', groupIds: [...PERNAS, ...GLUTEOS, ...CORE] },
  ],
  4: [
    { name: 'Superior A', groupIds: [...PEITO, ...OMBROS, 5] },
    { name: 'Inferior A', groupIds: PERNAS },
    { name: 'Superior B', groupIds: [...COSTAS, 4, 6] },
    { name: 'Inferior B', groupIds: [...GLUTEOS, ...CORE] },
  ],
  5: [
    { name: 'Peito', groupIds: PEITO },
    { name: 'Costas', groupIds: COSTAS },
    { name: 'Pernas', groupIds: [...PERNAS, ...GLUTEOS] },
    { name: 'Ombros', groupIds: OMBROS },
    { name: 'Braços/Core', groupIds: [...BRACOS, ...CORE] },
  ],
  6: [
    { name: 'Peito', groupIds: PEITO },
    { name: 'Costas', groupIds: COSTAS },
    { name: 'Pernas', groupIds: PERNAS },
    { name: 'Ombros', groupIds: OMBROS },
    { name: 'Braços', groupIds: BRACOS },
    { name: 'Glúteos/Core', groupIds: [...GLUTEOS, ...CORE] },
  ],
}

// ---- Parâmetros de treino por objetivo ----

interface ObjectiveParams {
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  exercisesPerGroup: number
  intensity: Intensity
}

const OBJECTIVE_PARAMS: Record<Goal, ObjectiveParams> = {
  hipertrofia: { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 75, exercisesPerGroup: 2, intensity: 'heavy' },
  força: { sets: 5, repsMin: 3, repsMax: 6, restSeconds: 150, exercisesPerGroup: 1, intensity: 'heavy' },
  definição: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 40, exercisesPerGroup: 2, intensity: 'light' },
  'perda de peso': { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30, exercisesPerGroup: 2, intensity: 'light' },
  resistência: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30, exercisesPerGroup: 2, intensity: 'light' },
  mobilidade: { sets: 2, repsMin: 10, repsMax: 15, restSeconds: 30, exercisesPerGroup: 1, intensity: 'light' },
}

function averageParams(goals: Goal[]): { sets: number; targetReps: number; restSeconds: number; exercisesPerGroup: number; intensity: Intensity } {
  const list = goals.map((g) => OBJECTIVE_PARAMS[g])
  const avg = (pick: (p: ObjectiveParams) => number) => list.reduce((acc, p) => acc + pick(p), 0) / list.length
  const heavy = list.some((p) => p.intensity === 'heavy')
  return {
    sets: Math.round(avg((p) => p.sets)),
    targetReps: Math.round(avg((p) => (p.repsMin + p.repsMax) / 2)),
    restSeconds: Math.round(avg((p) => p.restSeconds) / 5) * 5,
    exercisesPerGroup: Math.max(1, Math.min(3, Math.round(avg((p) => p.exercisesPerGroup)))),
    intensity: heavy ? 'heavy' : 'light',
  }
}

// ---- Seleção de exercícios ----

function equipmentAllowed(exercise: Exercise, mode: EquipmentMode): boolean {
  const allowed = EQUIPMENT_ALLOWED[mode]
  if (!allowed) return true
  return exercise.equipment == null || allowed.has(exercise.equipment)
}

function levelAllowed(exercise: Exercise, level: Level): boolean {
  if (!exercise.level) return true
  return LEVEL_ORDER[exercise.level] <= LEVEL_ORDER[level]
}

function scoreExercise(exercise: Exercise, goals: Goal[]): number {
  let score = 0
  const exerciseGoals = exercise.goals ?? []
  for (const g of goals) if (exerciseGoals.includes(g)) score += 2
  if (exercise.mechanics === 'composto') score += 1
  return score
}

function pickExercisesForGroup(
  pool: Exercise[],
  groupId: number,
  goals: Goal[],
  level: Level,
  equipmentMode: EquipmentMode,
  count: number,
  used: Set<string>,
): Exercise[] {
  const candidates = pool
    .filter(
      (e) =>
        e.muscle_group_id === groupId &&
        !used.has(e.id) &&
        levelAllowed(e, level) &&
        equipmentAllowed(e, equipmentMode),
    )
    .sort((a, b) => scoreExercise(b, goals) - scoreExercise(a, goals))

  const picked = candidates.slice(0, count)
  for (const e of picked) used.add(e.id)
  return picked
}

export interface GeneratedExercise {
  exercise: Exercise
  sets: number
  targetReps: number
  restSeconds: number
  intensity: Intensity
}

export interface GeneratedWorkout {
  name: string
  exercises: GeneratedExercise[]
}

export interface GenerateWorkoutPlanInput {
  goals: Goal[]
  regionKeys: string[]
  level: Level
  daysPerWeek: number
  equipmentMode: EquipmentMode
  exercises: Exercise[]
}

/**
 * Gera um plano de treino por objetivo/região/nível/dias/equipamento — 100% baseado em
 * regras sobre os metadados do catálogo (sem IA). Divisões seguem splits reconhecidos
 * (full body / superior-inferior / push-pull-legs / ABCD / especialização por grupo)
 * filtrados pelas regiões que o usuário escolheu; grupos sem exercício compatível são
 * descartados da divisão em vez de aparecerem vazios.
 */
export function generateWorkoutPlan(input: GenerateWorkoutPlanInput): GeneratedWorkout[] {
  const { goals, regionKeys, level, daysPerWeek, equipmentMode, exercises } = input
  if (goals.length === 0 || regionKeys.length === 0) return []

  const selectedGroupIds = new Set(
    REGION_OPTIONS.filter((r) => regionKeys.includes(r.key)).flatMap((r) => r.groupIds),
  )
  const params = averageParams(goals)
  const template = SPLIT_TEMPLATES[Math.min(6, Math.max(1, daysPerWeek))]
  const used = new Set<string>()

  const divisions: GeneratedWorkout[] = []
  for (const day of template) {
    const dayGroups = day.groupIds.filter((id) => selectedGroupIds.has(id))
    if (dayGroups.length === 0) continue

    // Compostos primeiro (per objetivo hipertrofia/força): grupos grandes na frente da lista.
    const dayExercises: GeneratedExercise[] = []
    for (const groupId of dayGroups) {
      const picked = pickExercisesForGroup(exercises, groupId, goals, level, equipmentMode, params.exercisesPerGroup, used)
      for (const exercise of picked) {
        dayExercises.push({
          exercise,
          sets: params.sets,
          targetReps: params.targetReps,
          restSeconds: params.restSeconds,
          intensity: params.intensity,
        })
      }
    }
    if (dayExercises.length > 0) divisions.push({ name: day.name, exercises: dayExercises })
  }

  return divisions
}

/** Substitutos para um exercício sugerido: mesmo grupo muscular + equipamento/nível compatíveis. */
export function findExerciseSubstitutes(
  exercise: Exercise,
  allExercises: Exercise[],
  level: Level,
  equipmentMode: EquipmentMode,
  goals: Goal[],
  limit = 6,
): Exercise[] {
  return allExercises
    .filter(
      (e) =>
        e.id !== exercise.id &&
        e.muscle_group_id === exercise.muscle_group_id &&
        levelAllowed(e, level) &&
        equipmentAllowed(e, equipmentMode),
    )
    .sort((a, b) => scoreExercise(b, goals) - scoreExercise(a, goals))
    .slice(0, limit)
}
