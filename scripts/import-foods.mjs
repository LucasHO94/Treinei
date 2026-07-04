// Pipeline de importação da base de alimentos TACO (Fase C da V2).
//
// Fonte: Tabela Brasileira de Composição de Alimentos (TACO/NEPA-UNICAMP, dados
// públicos), via JSON do repo marcelosanto/tabela_taco (MIT). ~597 alimentos com
// macros por 100g e categoria.
//
// Regras de preservação: os 30 alimentos do seed V1 mantêm seus UUIDs/nomes;
// itens TACO muito parecidos com um legado são pulados (dedup por nome
// normalizado) para não poluir a busca com duplicatas.
//
// Uso: node scripts/import-foods.mjs
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(__dirname, '.cache')
const OUT = path.join(__dirname, '..', 'public', 'data')
const TACO_URL = 'https://raw.githubusercontent.com/marcelosanto/tabela_taco/main/TACO.json'
const UUID_NAMESPACE = '7a1e6f2b-3c4d-5e6f-8a9b-0c1d2e3f4a5b'

function uuidV5(name, namespace) {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ''), 'hex')
  const hash = createHash('sha1').update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')])).digest()
  const b = Buffer.from(hash.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50
  b[8] = (b[8] & 0x3f) | 0x80
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// "Tr" (traço) e "NA" viram 0 — convenção da própria TACO para quantidades desprezíveis/não analisadas.
function num(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v * 100) / 100
  return 0
}

// Categoria TACO → categoria curta do app
const CATEGORY_MAP = {
  'Cereais e derivados': 'Cereais e pães',
  'Verduras, hortaliças e derivados': 'Verduras e legumes',
  'Frutas e derivados': 'Frutas',
  'Gorduras e óleos': 'Óleos e gorduras',
  'Pescados e frutos do mar': 'Peixes e frutos do mar',
  'Carnes e derivados': 'Carnes',
  'Leite e derivados': 'Leite e derivados',
  'Bebidas (alcoólicas e não alcoólicas)': 'Bebidas',
  'Ovos e derivados': 'Ovos',
  'Produtos açucarados': 'Doces e açúcares',
  Miscelâneas: 'Outros',
  'Outros alimentos industrializados': 'Industrializados',
  'Alimentos preparados': 'Pratos prontos',
  'Leguminosas e derivados': 'Leguminosas',
  'Nozes e sementes': 'Nozes e sementes',
}

// Legados (seed V1): categoria atribuída manualmente + termos de dedup contra a TACO.
const LEGACY_CATEGORY = {
  'Arroz branco cozido': 'Cereais e pães',
  'Arroz integral cozido': 'Cereais e pães',
  'Feijão carioca cozido': 'Leguminosas',
  'Feijão preto cozido': 'Leguminosas',
  'Peito de frango grelhado': 'Carnes',
  'Coxa de frango assada': 'Carnes',
  'Carne bovina moída (patinho)': 'Carnes',
  'Ovo cozido': 'Ovos',
  'Ovo (clara)': 'Ovos',
  'Batata doce cozida': 'Verduras e legumes',
  'Batata inglesa cozida': 'Verduras e legumes',
  'Aveia em flocos': 'Cereais e pães',
  'Pão francês': 'Cereais e pães',
  'Pão integral': 'Cereais e pães',
  'Whey protein (concentrado)': 'Suplementos',
  'Banana prata': 'Frutas',
  Maçã: 'Frutas',
  'Brócolis cozido': 'Verduras e legumes',
  Tomate: 'Verduras e legumes',
  Alface: 'Verduras e legumes',
  'Azeite de oliva extra virgem': 'Óleos e gorduras',
  'Castanha do Pará': 'Nozes e sementes',
  'Amendoim torrado': 'Nozes e sementes',
  'Iogurte natural integral': 'Leite e derivados',
  'Leite desnatado': 'Leite e derivados',
  'Queijo minas frescal': 'Leite e derivados',
  'Tapioca (goma hidratada)': 'Cereais e pães',
  'Salmão grelhado': 'Peixes e frutos do mar',
  'Atum em água (lata)': 'Peixes e frutos do mar',
  Abacate: 'Frutas',
}

// TACO ids cujo conteúdo já é coberto por um legado (dedup manual dos casos óbvios,
// por descrição exata da TACO).
const TACO_DEDUP = new Set([
  'Arroz, tipo 1, cozido',
  'Arroz, integral, cozido',
  'Feijão, carioca, cozido',
  'Feijão, preto, cozido',
  'Frango, peito, sem pele, grelhado',
  'Batata, doce, cozida',
  'Batata, inglesa, cozida',
  'Aveia, flocos, crua',
  'Pão, trigo, francês',
  'Azeite, de oliva, extra virgem',
  'Castanha-do-brasil, crua',
  'Amendoim, torrado, salgado',
  'Leite, de vaca, desnatado, UHT',
  'Queijo, minas, frescal',
  'Abacate, cru',
])

const legacyFoods = JSON.parse(readFileSync(path.join(__dirname, 'legacy-foods.json'), 'utf8'))
const { EXTRA_FOODS } = await import('./cronograma-data.mjs')
const { EXPANSION_FOODS } = await import('./catalog-expansion-data.mjs')

async function main() {
  let taco
  const cached = path.join(CACHE, 'taco.json')
  if (existsSync(cached)) {
    taco = JSON.parse(readFileSync(cached, 'utf8'))
  } else {
    const res = await fetch(TACO_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    taco = await res.json()
    mkdirSync(CACHE, { recursive: true })
    writeFileSync(cached, JSON.stringify(taco))
  }

  const foods = []

  // 1. Legados (IDs/nomes/valores intactos, ganham categoria e source).
  for (const legacy of legacyFoods) {
    foods.push({
      ...legacy,
      category: LEGACY_CATEGORY[legacy.name] ?? 'Outros',
      source: 'seed-v1',
      household_measure: null,
    })
  }

  // 2. TACO completa (menos duplicatas dos legados).
  let deduped = 0
  for (const item of taco) {
    if (!item.description || TACO_DEDUP.has(item.description)) {
      deduped++
      continue
    }
    // Nome mais amigável: "Arroz, integral, cozido" → "Arroz integral cozido"
    const name = item.description.replace(/,\s+/g, ' ').replace(/\s{2,}/g, ' ').trim()
    foods.push({
      id: uuidV5(`food:taco:${item.id}`, UUID_NAMESPACE),
      name,
      portion_desc: '100g',
      portion_grams: 100,
      protein_g: num(item.protein_g),
      carbs_g: num(item.carbohydrate_g),
      fat_g: num(item.lipid_g),
      kcal: num(item.energy_kcal),
      is_custom: false,
      owner_id: null,
      category: CATEGORY_MAP[item.category] ?? 'Outros',
      source: 'taco',
      household_measure: null,
    })
  }

  // 3. Extras do Cronograma de Alta Performance (alimentos da planilha do usuário que a
  // TACO não cobria). UUID determinístico + source 'cronograma' → bulkPut idempotente.
  const existingNames = new Set(foods.map((f) => f.name))
  let extras = 0
  for (const extra of EXTRA_FOODS) {
    if (existingNames.has(extra.name)) continue
    foods.push({
      id: uuidV5(`food:cronograma:${extra.name}`, UUID_NAMESPACE),
      name: extra.name,
      portion_desc: '100g',
      portion_grams: 100,
      protein_g: num(extra.protein_g),
      carbs_g: num(extra.carbs_g),
      fat_g: num(extra.fat_g),
      kcal: num(extra.kcal),
      is_custom: false,
      owner_id: null,
      category: extra.category ?? 'Outros',
      source: 'cronograma',
      household_measure: null,
    })
    extras++
  }

  // 4. Expansão geral do catálogo (V3.10): mais variedade de alimentos comuns não
  // cobertos pela TACO (industrializados/importados). UUID determinístico + source
  // 'expansion' → bulkPut idempotente.
  let expansions = 0
  for (const extra of EXPANSION_FOODS) {
    if (existingNames.has(extra.name)) continue
    foods.push({
      id: uuidV5(`food:expansion:${extra.name}`, UUID_NAMESPACE),
      name: extra.name,
      portion_desc: '100g',
      portion_grams: 100,
      protein_g: num(extra.protein_g),
      carbs_g: num(extra.carbs_g),
      fat_g: num(extra.fat_g),
      kcal: num(extra.kcal),
      is_custom: false,
      owner_id: null,
      category: extra.category ?? 'Outros',
      source: 'expansion',
      household_measure: null,
    })
    expansions++
  }

  const out = {
    version: 4,
    generatedAt: new Date().toISOString(),
    foods,
  }

  mkdirSync(OUT, { recursive: true })
  const outPath = path.join(OUT, 'foods.json')
  writeFileSync(outPath, JSON.stringify(out))
  const kb = Math.round(Buffer.byteLength(JSON.stringify(out)) / 1024)
  console.log(`✔ ${outPath}`)
  console.log(
    `  ${foods.length} alimentos (${legacyFoods.length} legados, ${deduped} duplicatas TACO puladas, ${extras} extras do cronograma, ${expansions} extras de expansão), ${kb} KB`,
  )

  const ids = new Set(foods.map((f) => f.id))
  if (ids.size !== foods.length) throw new Error('IDs duplicados!')
  const cats = new Set(foods.map((f) => f.category))
  console.log(`  categorias (${cats.size}): ${[...cats].sort().join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
