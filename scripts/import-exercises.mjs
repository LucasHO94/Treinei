// Pipeline de importação do catálogo de exercícios (Fase B da V2).
//
// Funde o free-exercise-db (EN, domínio público, ~873 exercícios) com a tradução
// PT-BR completa (joao-gugel/exercicios-bd-ptbr, mesmos IDs) e gera
// public/data/exercises.json — a fonte do catálogo hidratado no Dexie em runtime.
//
// Regras de preservação (rotinas existentes referenciam exercise_id):
//  - Os 50 exercícios legados do seed V1 mantêm seus UUIDs e nomes originais;
//    quando têm equivalente no dataset (LEGACY_MATCH), herdam mídia/instruções/
//    metadados e o item do dataset NÃO é importado de novo (evita duplicata).
//  - Novos exercícios ganham UUID v5 determinístico derivado do id do dataset —
//    rodar o script N vezes produz sempre os mesmos IDs (idempotente, e os IDs
//    baterão com o seed SQL do Supabase quando ele for gerado).
//
// Uso: node scripts/import-exercises.mjs
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(__dirname, '.cache')
const OUT = path.join(__dirname, '..', 'public', 'data')

const EN_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const PT_URL =
  'https://raw.githubusercontent.com/joao-gugel/exercicios-bd-ptbr/main/exercises/exercises-ptbr-full-translation.json'

// Namespace fixo do Treinei para UUID v5 (gerado uma vez, nunca mudar).
const UUID_NAMESPACE = '7a1e6f2b-3c4d-5e6f-8a9b-0c1d2e3f4a5b'

// ---- UUID v5 (RFC 4122, SHA-1) sem dependências ----
function uuidV5(name, namespace) {
  const ns = namespace.replace(/-/g, '')
  const nsBytes = Buffer.from(ns, 'hex')
  const hash = createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')])).digest()
  const b = Buffer.from(hash.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50 // versão 5
  b[8] = (b[8] & 0x3f) | 0x80 // variante RFC
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

async function loadDataset(file, url) {
  const p = path.join(CACHE, file)
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  console.log(`baixando ${url}...`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`)
  const data = await res.json()
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(p, JSON.stringify(data))
  return data
}

// ---- Mapeamentos ----

// primaryMuscles (EN) → muscle_group_id do Treinei (IDs fixos do seed V1)
const MUSCLE_TO_GROUP = {
  chest: 1,
  lats: 2,
  'middle back': 2,
  'lower back': 2,
  shoulders: 3,
  biceps: 4,
  triceps: 5,
  forearms: 6,
  traps: 7,
  neck: 7,
  abdominals: 8,
  quadriceps: 9,
  hamstrings: 9,
  adductors: 9,
  abductors: 9,
  glutes: 10,
  calves: 11,
}

const EQUIPMENT_PT = {
  'body only': 'Peso do corpo',
  machine: 'Máquina',
  dumbbell: 'Halteres',
  barbell: 'Barra',
  cable: 'Cabo',
  kettlebells: 'Kettlebell',
  bands: 'Elástico',
  'medicine ball': 'Medicine ball',
  'exercise ball': 'Bola de exercício',
  'e-z curl bar': 'Barra W',
  'foam roll': 'Rolo de espuma',
  other: 'Outro',
}

const LEVEL_PT = { beginner: 'iniciante', intermediate: 'intermediário', expert: 'avançado' }
const CATEGORY_PT = {
  strength: 'força',
  stretching: 'alongamento',
  plyometrics: 'pliometria',
  strongman: 'strongman',
  powerlifting: 'powerlifting',
  cardio: 'cardio',
  'olympic weightlifting': 'LPO',
}
const FORCE_PT = { push: 'empurrar', pull: 'puxar', static: 'estático' }
const MECHANIC_PT = { compound: 'composto', isolation: 'isolado' }

// Nome legado (seed V1) → id do free-exercise-db. Validado manualmente contra o dataset.
const LEGACY_MATCH = {
  'Supino Reto no Aparelho': 'Machine_Bench_Press',
  'Supino Inclinado no Aparelho': 'Leverage_Incline_Chest_Press',
  'Supino Reto c/ Halteres': 'Dumbbell_Bench_Press',
  'Supino Inclinado c/ Halteres': 'Incline_Dumbbell_Press',
  'Crucifixo no Voador': 'Butterfly',
  'Pullover - v. Peito': 'Bent-Arm_Dumbbell_Pullover',
  'Puxada pela Frente - Pegada Aberta': 'Wide-Grip_Lat_Pulldown',
  'Puxada pela Frente - Pegada Invertida': 'Underhand_Cable_Pulldowns',
  'Remada no Aparelho': 'Leverage_Iso_Row',
  'Remada Vertical no Aparelho': 'Leverage_High_Row',
  'Remada Sentado - Pegada Invertida': 'Seated_Cable_Rows',
  'Remada Unilateral c/ Halter (Serrote)': 'One-Arm_Dumbbell_Row',
  'Crucifixo Inverso no Voador': 'Reverse_Machine_Flyes',
  'Desenvolvimento no Aparelho': 'Machine_Shoulder_Military_Press',
  'Desenvolvimento c/ Halteres': 'Dumbbell_Shoulder_Press',
  'Elevação Lateral': 'Side_Lateral_Raise',
  'Elevação Frontal c/ Halteres': 'Front_Two-Dumbbell_Raise',
  'Elevação Frontal c/ Anilha': 'Front_Plate_Raise',
  'Remada Alta c/ Cabo': 'Upright_Cable_Row',
  'Rosca Direta no Cabo': 'Standing_Biceps_Cable_Curl',
  'Rosca Direta c/ Cabo - Pegada Invertida': 'Reverse_Cable_Curl',
  'Rosca Inclinada': 'Incline_Dumbbell_Curl',
  'Rosca Concentrada': 'Concentration_Curls',
  'Rosca c/ Halteres': 'Dumbbell_Bicep_Curl',
  'Rosca Hammer c/ Cabo - Corda': 'Cable_Hammer_Curls_-_Rope_Attachment',
  'Scott Martelo c/ Halteres': 'Preacher_Hammer_Dumbbell_Curl',
  'Tríceps Francês': 'Standing_Dumbbell_Triceps_Extension',
  'Tríceps Francês Unilateral': 'Dumbbell_One-Arm_Triceps_Extension',
  'Extensão de Cotovelos no Cabo - Pegada Invertida': 'Reverse_Grip_Triceps_Pushdown',
  'Extensão de Cotovelos na Roldana Alta': 'Triceps_Pushdown',
  'Extensão de Cotovelos c/ Halteres': 'Lying_Dumbbell_Tricep_Extension',
  'Mergulho no Aparelho - v. Tríceps': 'Dip_Machine',
  'Rosca de Punho': 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench',
  'Rosca de Punho Invertida': 'Palms-Down_Wrist_Curl_Over_A_Bench',
  'Encolhimento de Ombros c/ Halteres': 'Dumbbell_Shrug',
  'Infra no Solo': 'Flat_Bench_Lying_Leg_Raise',
  'Jack Knifes': 'Jackknife_Sit-Up',
  Legpress: 'Leg_Press',
  'Legpress Horizontal': 'Narrow_Stance_Leg_Press',
  'Agachamento no Hack': 'Hack_Squat',
  'Extensão de Joelhos': 'Leg_Extensions',
  'Flexão de Joelhos - Deitado': 'Lying_Leg_Curls',
  'Flexão de Joelhos no Aparelho - Sentado': 'Seated_Leg_Curl',
  'Adução de Coxa Sentado': 'Thigh_Adductor',
  'Abdução de Coxa Sentado': 'Thigh_Abductor',
  'Elevação de Quadril': 'Butt_Lift_Bridge',
  'Panturrilha no Leg Press': 'Calf_Press_On_The_Leg_Press_Machine',
  'Panturrilha em Pé no Aparelho': 'Standing_Calf_Raises',
  'Agachamento Livre sem Peso': 'Bodyweight_Squat',
  'Ondas de Pulso - Para Baixo': 'Battling_Ropes',
}

// Foto de capa por grupo (image[0] de um exercício icônico do grupo).
const GROUP_COVER = {
  1: 'Barbell_Bench_Press_-_Medium_Grip/0.jpg',
  2: 'Wide-Grip_Lat_Pulldown/0.jpg',
  3: 'Dumbbell_Shoulder_Press/0.jpg',
  4: 'Dumbbell_Bicep_Curl/0.jpg',
  5: 'Triceps_Pushdown/0.jpg',
  6: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg',
  7: 'Dumbbell_Shrug/0.jpg',
  8: 'Crunches/0.jpg',
  9: 'Barbell_Squat/0.jpg',
  10: 'Barbell_Hip_Thrust/0.jpg',
  11: 'Standing_Calf_Raises/0.jpg',
  12: 'Pushups/0.jpg',
}

// Objetivos de treino derivados (filtro transversal do catálogo).
function deriveGoals(en) {
  const goals = new Set()
  const cat = en.category
  const isBody = en.equipment === 'body only' || en.equipment == null
  if (cat === 'powerlifting' || cat === 'olympic weightlifting' || cat === 'strongman') goals.add('força')
  if (cat === 'strength') {
    goals.add('hipertrofia')
    if (en.mechanic === 'compound' && (en.equipment === 'barbell' || en.equipment === 'dumbbell')) goals.add('força')
    if (en.mechanic === 'isolation') goals.add('definição')
  }
  if (cat === 'cardio' || cat === 'plyometrics') {
    goals.add('perda de peso')
    goals.add('resistência')
  }
  if (isBody && cat !== 'stretching') goals.add('resistência')
  if (cat === 'stretching') goals.add('mobilidade')
  return [...goals]
}

// ---- Seed legado (nomes + IDs a preservar) — extraído de src/lib/db/local-seed.ts ----
const legacySeed = JSON.parse(readFileSync(path.join(__dirname, 'legacy-exercises.json'), 'utf8'))

async function main() {
  const en = await loadDataset('exercises-en.json', EN_URL)
  const pt = await loadDataset('exercises-ptbr.json', PT_URL)

  const enById = new Map(en.map((e) => [e.id, e]))
  const ptById = new Map(pt.map((e) => [e.id, e]))
  const matchedDatasetIds = new Set(Object.values(LEGACY_MATCH))

  // Valida o mapa legado antes de qualquer coisa.
  for (const [legacyName, dsId] of Object.entries(LEGACY_MATCH)) {
    if (!enById.has(dsId)) throw new Error(`LEGACY_MATCH inválido: "${legacyName}" → "${dsId}" não existe no dataset`)
  }

  const exercises = []

  // 1. Legados primeiro (IDs e nomes intactos; metadados herdados quando há match).
  for (const legacy of legacySeed) {
    const dsId = LEGACY_MATCH[legacy.name]
    const enEx = dsId ? enById.get(dsId) : null
    const ptEx = dsId ? ptById.get(dsId) : null
    exercises.push({
      id: legacy.id,
      muscle_group_id: legacy.muscle_group_id,
      name: legacy.name,
      name_en: enEx?.name ?? null,
      media_url: null,
      images: enEx?.images ?? null,
      equipment: enEx ? (EQUIPMENT_PT[enEx.equipment] ?? 'Outro') : null,
      level: enEx ? LEVEL_PT[enEx.level] : null,
      mechanics: enEx?.mechanic ? MECHANIC_PT[enEx.mechanic] : null,
      force: enEx?.force ? FORCE_PT[enEx.force] : null,
      category: enEx ? CATEGORY_PT[enEx.category] : 'força',
      instructions: ptEx?.instructions ?? [],
      secondary_muscle_ids: enEx
        ? [...new Set((enEx.secondaryMuscles ?? []).map((m) => MUSCLE_TO_GROUP[m]).filter(Boolean))]
        : [],
      goals: enEx ? deriveGoals(enEx) : ['hipertrofia'],
      is_custom: false,
      owner_id: null,
      created_at: legacy.created_at,
    })
  }

  // 2. Dataset completo (menos os já representados pelos legados).
  let skippedNoGroup = 0
  for (const enEx of en) {
    if (matchedDatasetIds.has(enEx.id)) continue
    const groupId = MUSCLE_TO_GROUP[enEx.primaryMuscles?.[0]]
    if (!groupId) {
      skippedNoGroup++
      continue
    }
    const ptEx = ptById.get(enEx.id)
    exercises.push({
      id: uuidV5(`exercise:${enEx.id}`, UUID_NAMESPACE),
      muscle_group_id: groupId,
      name: ptEx?.name ?? enEx.name,
      name_en: enEx.name,
      media_url: null,
      images: enEx.images ?? null,
      equipment: EQUIPMENT_PT[enEx.equipment] ?? 'Outro',
      level: LEVEL_PT[enEx.level] ?? 'iniciante',
      mechanics: enEx.mechanic ? MECHANIC_PT[enEx.mechanic] : null,
      force: enEx.force ? FORCE_PT[enEx.force] : null,
      category: CATEGORY_PT[enEx.category] ?? 'força',
      instructions: ptEx?.instructions ?? enEx.instructions ?? [],
      secondary_muscle_ids: [...new Set((enEx.secondaryMuscles ?? []).map((m) => MUSCLE_TO_GROUP[m]).filter(Boolean))],
      goals: deriveGoals(enEx),
      is_custom: false,
      owner_id: null,
      created_at: '2026-01-01T00:00:00.000Z',
    })
  }

  const muscleGroups = [
    { id: 1, slug: 'peito', name: 'Peitorais', sort_order: 1 },
    { id: 2, slug: 'costas', name: 'Costas', sort_order: 2 },
    { id: 3, slug: 'ombros', name: 'Ombros', sort_order: 3 },
    { id: 4, slug: 'biceps', name: 'Bíceps', sort_order: 4 },
    { id: 5, slug: 'triceps', name: 'Tríceps', sort_order: 5 },
    { id: 6, slug: 'antebraco', name: 'Antebraço', sort_order: 6 },
    { id: 7, slug: 'trapezio', name: 'Trapézio', sort_order: 7 },
    { id: 8, slug: 'abdomen', name: 'Abdômen', sort_order: 8 },
    { id: 9, slug: 'coxa_quadril', name: 'Coxa / Quadril', sort_order: 9 },
    { id: 10, slug: 'gluteos', name: 'Glúteos', sort_order: 10 },
    { id: 11, slug: 'panturrilha', name: 'Panturrilha', sort_order: 11 },
    { id: 12, slug: 'peso_corpo', name: 'Peso do Corpo', sort_order: 12 },
  ].map((g) => ({ ...g, image_url: GROUP_COVER[g.id] ?? null }))

  const out = {
    version: 2,
    generatedAt: new Date().toISOString(),
    imageBase: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/',
    muscleGroups,
    exercises,
  }

  mkdirSync(OUT, { recursive: true })
  const outPath = path.join(OUT, 'exercises.json')
  writeFileSync(outPath, JSON.stringify(out))
  const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024)
  console.log(`✔ ${outPath}`)
  console.log(`  ${exercises.length} exercícios (${legacySeed.length} legados preservados, ${skippedNoGroup} sem grupo ignorados), ${kb} KB`)

  // Sanidade: IDs únicos e legados intactos.
  const ids = new Set(exercises.map((e) => e.id))
  if (ids.size !== exercises.length) throw new Error('IDs duplicados no output!')
  for (const legacy of legacySeed) {
    const found = exercises.find((e) => e.id === legacy.id)
    if (!found || found.name !== legacy.name) throw new Error(`Legado corrompido: ${legacy.name}`)
  }
  console.log('  sanidade OK (IDs únicos, legados intactos)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
