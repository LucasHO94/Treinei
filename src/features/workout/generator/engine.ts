import type { Exercise, Intensity } from '@/types/domain'

// Motor determinístico de geração de treino (V3): sem IA/backend — regras sobre os
// metadados que o catálogo V2 já traz (goals/level/mechanics/equipment). Função pura,
// recebe o catálogo já carregado do Dexie e devolve divisões prontas para persistir.
//
// V3.9: a seleção de exercícios passou a ser guiada por ORÇAMENTO DE TEMPO (quanto o
// usuário quer treinar por sessão) em vez de um número fixo por grupo — cada exercício
// tem um custo estimado em segundos (séries × (trabalho + descanso) + transição) e a
// divisão é montada até esgotar o tempo disponível, priorizando os grupos citados
// primeiro no split (o "foco" do dia) sobre os secundários/sinergistas.

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

/** Duração de sessão que o usuário quer treinar — dirige o orçamento de tempo do gerador. */
export const DURATION_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1h' },
  { minutes: 75, label: '1h15' },
  { minutes: 90, label: '1h30' },
  { minutes: 120, label: '2h' },
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
// A ordem dos groupIds dentro de cada dia importa: os primeiros são o alvo principal
// do dia e recebem mais exercícios do orçamento de tempo (ver buildDivisionExercises).

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
  intensity: Intensity
}

const OBJECTIVE_PARAMS: Record<Goal, ObjectiveParams> = {
  hipertrofia: { sets: 4, repsMin: 8, repsMax: 12, restSeconds: 75, intensity: 'heavy' },
  força: { sets: 5, repsMin: 3, repsMax: 6, restSeconds: 150, intensity: 'heavy' },
  definição: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 40, intensity: 'light' },
  'perda de peso': { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30, intensity: 'light' },
  resistência: { sets: 3, repsMin: 15, repsMax: 20, restSeconds: 30, intensity: 'light' },
  mobilidade: { sets: 2, repsMin: 10, repsMax: 15, restSeconds: 30, intensity: 'light' },
}

function averageParams(goals: Goal[]): { sets: number; targetReps: number; restSeconds: number; intensity: Intensity } {
  const list = goals.map((g) => OBJECTIVE_PARAMS[g])
  const avg = (pick: (p: ObjectiveParams) => number) => list.reduce((acc, p) => acc + pick(p), 0) / list.length
  const heavy = list.some((p) => p.intensity === 'heavy')
  return {
    sets: Math.round(avg((p) => p.sets)),
    targetReps: Math.round(avg((p) => (p.repsMin + p.repsMax) / 2)),
    restSeconds: Math.round(avg((p) => p.restSeconds) / 5) * 5,
    intensity: heavy ? 'heavy' : 'light',
  }
}

// ---- Estimativa de tempo (orçamento da sessão) ----
// Referências de treino de academia: ritmo controlado ~3s por repetição, mais o
// descanso entre séries, mais ~30s de transição (trocar aparelho/anotar carga).

const WORK_SECONDS_PER_REP = 3
const TRANSITION_SECONDS = 30
const WARMUP_SETS = 2
const WARMUP_REPS = 15
const WARMUP_REST_SECONDS = 20
const MAX_EXERCISES_PER_GROUP = 4

function estimateSetsSeconds(sets: number, targetReps: number, restSeconds: number): number {
  return sets * (targetReps * WORK_SECONDS_PER_REP + restSeconds) + TRANSITION_SECONDS
}

export interface DivisionEstimate {
  minutes: number
  totalSets: number
  exerciseCount: number
}

/** Duração/volume estimados de uma divisão gerada — usado na prévia da UI. */
export function estimateDivision(division: GeneratedWorkout): DivisionEstimate {
  const totalSeconds = division.exercises.reduce((acc, e) => acc + estimateSetsSeconds(e.sets, e.targetReps, e.restSeconds), 0)
  const totalSets = division.exercises.reduce((acc, e) => acc + e.sets, 0)
  return { minutes: Math.round(totalSeconds / 60), totalSets, exerciseCount: division.exercises.length }
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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Candidatos de um grupo muscular ordenados por pontuação (objetivo + composto).
 * Empates são embaralhados — mantém a hierarquia de qualidade, mas evita que a
 * sugestão saia sempre idêntica para os mesmos filtros.
 */
function rankedCandidates(pool: Exercise[], groupId: number, goals: Goal[], level: Level, equipmentMode: EquipmentMode, used: Set<string>): Exercise[] {
  const candidates = pool.filter(
    (e) => e.muscle_group_id === groupId && !used.has(e.id) && levelAllowed(e, level) && equipmentAllowed(e, equipmentMode),
  )
  const byScore = new Map<number, Exercise[]>()
  for (const e of candidates) {
    const score = scoreExercise(e, goals)
    const bucket = byScore.get(score)
    if (bucket) bucket.push(e)
    else byScore.set(score, [e])
  }
  const scoresDesc = [...byScore.keys()].sort((a, b) => b - a)
  return scoresDesc.flatMap((score) => shuffle(byScore.get(score)!))
}

/** Exercício de mobilidade/aquecimento real do catálogo, compatível com a região do dia. */
function pickWarmupExercise(pool: Exercise[], dayGroupIds: number[], equipmentMode: EquipmentMode, used: Set<string>): Exercise | null {
  const candidates = pool.filter(
    (e) => dayGroupIds.includes(e.muscle_group_id) && (e.goals ?? []).includes('mobilidade') && !used.has(e.id) && equipmentAllowed(e, equipmentMode),
  )
  return candidates[0] ?? null
}

function compostoRank(exercise: Exercise): number {
  return exercise.mechanics === 'composto' ? 0 : 1
}

interface BuildDivisionInput {
  pool: Exercise[]
  dayGroups: number[]
  goals: Goal[]
  level: Level
  equipmentMode: EquipmentMode
  params: ReturnType<typeof averageParams>
  used: Set<string>
  budgetSeconds: number
}

/**
 * Monta os exercícios de uma divisão dentro do orçamento de tempo da sessão:
 * 1. Aquecimento real (mobilidade) quando existe candidato compatível.
 * 2. Round-robin ponderado pelos grupos do dia — os citados primeiro no split são o
 *    alvo principal e recebem mais exercícios que os secundários/sinergistas, como um
 *    personal trainer prioriza o grupo foco do dia.
 * 3. Ordena o resultado final com compostos (multiarticulares) antes de isolados —
 *    devem ser feitos com o sistema nervoso/musculatura ainda descansados.
 */
function buildDivisionExercises({ pool, dayGroups, goals, level, equipmentMode, params, used, budgetSeconds }: BuildDivisionInput): GeneratedExercise[] {
  let remaining = budgetSeconds
  const warmupBlock: GeneratedExercise[] = []

  const warmup = pickWarmupExercise(pool, dayGroups, equipmentMode, used)
  if (warmup) {
    const cost = estimateSetsSeconds(WARMUP_SETS, WARMUP_REPS, WARMUP_REST_SECONDS)
    if (cost <= remaining) {
      warmupBlock.push({ exercise: warmup, sets: WARMUP_SETS, targetReps: WARMUP_REPS, restSeconds: WARMUP_REST_SECONDS, intensity: 'light' })
      used.add(warmup.id)
      remaining -= cost
    }
  }

  const candidatesByGroup = new Map<number, Exercise[]>()
  for (const groupId of dayGroups) candidatesByGroup.set(groupId, rankedCandidates(pool, groupId, goals, level, equipmentMode, used))

  const weight = new Map(dayGroups.map((g, i) => [g, dayGroups.length - i]))
  const picked = new Map(dayGroups.map((g) => [g, 0]))
  const exhausted = new Set<number>()
  const exerciseCost = estimateSetsSeconds(params.sets, params.targetReps, params.restSeconds)

  const result: GeneratedExercise[] = []
  while (exhausted.size < dayGroups.length) {
    let bestGroup: number | null = null
    let bestScore = -Infinity
    for (const groupId of dayGroups) {
      if (exhausted.has(groupId)) continue
      const score = weight.get(groupId)! / (picked.get(groupId)! + 1)
      if (score > bestScore) {
        bestScore = score
        bestGroup = groupId
      }
    }
    if (bestGroup == null) break

    const candidates = candidatesByGroup.get(bestGroup)!
    const next = candidates.find((e) => !used.has(e.id))
    if (!next || picked.get(bestGroup)! >= MAX_EXERCISES_PER_GROUP || exerciseCost > remaining) {
      exhausted.add(bestGroup)
      continue
    }

    result.push({ exercise: next, sets: params.sets, targetReps: params.targetReps, restSeconds: params.restSeconds, intensity: params.intensity })
    used.add(next.id)
    picked.set(bestGroup, picked.get(bestGroup)! + 1)
    remaining -= exerciseCost
  }

  return [...warmupBlock, ...result.sort((a, b) => compostoRank(a.exercise) - compostoRank(b.exercise))]
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
  /** Minutos disponíveis por sessão — dirige o orçamento de tempo de cada divisão. */
  durationMinutes: number
  exercises: Exercise[]
}

/**
 * Gera um plano de treino por objetivo/região/nível/dias/equipamento/tempo — 100%
 * baseado em regras sobre os metadados do catálogo (sem IA). Divisões seguem splits
 * reconhecidos (full body / superior-inferior / push-pull-legs / ABCD / especialização
 * por grupo) filtrados pelas regiões escolhidas; o volume de cada divisão é montado
 * para caber no tempo de sessão informado, não num número fixo de exercícios.
 */
export function generateWorkoutPlan(input: GenerateWorkoutPlanInput): GeneratedWorkout[] {
  const { goals, regionKeys, level, daysPerWeek, equipmentMode, durationMinutes, exercises } = input
  if (goals.length === 0 || regionKeys.length === 0) return []

  const selectedGroupIds = new Set(
    REGION_OPTIONS.filter((r) => regionKeys.includes(r.key)).flatMap((r) => r.groupIds),
  )
  const params = averageParams(goals)
  const template = SPLIT_TEMPLATES[Math.min(6, Math.max(1, daysPerWeek))]
  const budgetSeconds = Math.max(0, durationMinutes) * 60
  const used = new Set<string>()

  const divisions: GeneratedWorkout[] = []
  for (const day of template) {
    const dayGroups = [...new Set(day.groupIds.filter((id) => selectedGroupIds.has(id)))]
    if (dayGroups.length === 0) continue

    const dayExercises = buildDivisionExercises({ pool: exercises, dayGroups, goals, level, equipmentMode, params, used, budgetSeconds })
    if (dayExercises.length > 0) divisions.push({ name: day.name, exercises: dayExercises })
  }

  return divisions
}

// ---- Programa curado: Cronograma de Alta Performance (ABCD) ----
// Split FIXO da planilha do usuário ("Cronograma de Alta Performance e Hipertrofia"),
// oferecido separadamente do gerador por objetivo. A planilha define os grupos de cada
// dia (não os exercícios), então montamos cada divisão escolhendo exercícios reais do
// catálogo para aqueles grupos, reaproveitando o mesmo motor do gerador. O conjunto
// `used` é compartilhado entre os 4 dias: A e C (mesmos grupos) saem com exercícios
// diferentes, como uma variação de ênfase — igual a um ABCD de verdade.

interface CuratedDay {
  name: string
  groupIds: number[]
  goals: Goal[]
}

// Peito(1) Bíceps(4) Costas(2) Tríceps(5) Trapézio(7) Coxa/Quadril(9) Panturrilha(11).
const ABCD_DAYS: CuratedDay[] = [
  { name: 'Treino A · Peito, Bíceps, Posterior e Panturrilha', groupIds: [1, 4, 9, 11], goals: ['hipertrofia'] },
  { name: 'Treino B · Costas, Trapézio, Tríceps e Quadríceps', groupIds: [2, 7, 5, 9], goals: ['hipertrofia'] },
  { name: 'Treino C · Peito, Bíceps, Posterior e Panturrilha (ênfase hipertrofia)', groupIds: [1, 4, 9, 11], goals: ['hipertrofia'] },
  { name: 'Treino D · Costas, Trapézio, Tríceps e Quadríceps (ênfase volume)', groupIds: [2, 7, 5, 9], goals: ['hipertrofia', 'resistência'] },
]

/** Nome do programa curado — exibido na tela de Treino, separado dos treinos sugeridos. */
export const CURATED_ABCD_NAME = 'Protocolo Titã · ABCD Alta Performance'

/**
 * Monta o programa ABCD da planilha do usuário. Sessão de ~75 min por padrão, nível
 * intermediário, academia completa. Determinístico por dia, com variação entre gerações
 * (embaralhamento dentro de cada faixa de pontuação, como no gerador).
 */
export function buildCuratedAbcdPlan(exercises: Exercise[], durationMinutes = 75): GeneratedWorkout[] {
  const budgetSeconds = Math.max(0, durationMinutes) * 60
  const used = new Set<string>()
  const divisions: GeneratedWorkout[] = []
  for (const day of ABCD_DAYS) {
    const params = averageParams(day.goals)
    const dayGroups = [...new Set(day.groupIds)]
    const dayExercises = buildDivisionExercises({
      pool: exercises,
      dayGroups,
      goals: day.goals,
      level: 'intermediário',
      equipmentMode: 'academia',
      params,
      used,
      budgetSeconds,
    })
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
