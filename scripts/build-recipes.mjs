// Gera public/data/recipes.json a partir de uma base curada de receitas (V3 Fase 7).
// Cada receita referencia alimentos já existentes no catálogo TACO (public/data/foods.json)
// por nome exato — os macros são calculados automaticamente a partir deles, então nunca
// ficam desalinhados com o resto do app. O modo de preparo é 100% autoral (sem raspagem de
// sites de receita, que teria risco de direito autoral sobre o texto).
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const UUID_NAMESPACE = '7a1e6f2b-3c4d-5e6f-8a9b-0c1d2e3f4a5b'

function uuidV5(name, namespace) {
  const ns = namespace.replace(/-/g, '')
  const nsBytes = Buffer.from(ns, 'hex')
  const hash = createHash('sha1')
    .update(Buffer.concat([nsBytes, Buffer.from(name, 'utf8')]))
    .digest()
  const b = Buffer.from(hash.subarray(0, 16))
  b[6] = (b[6] & 0x0f) | 0x50
  b[8] = (b[8] & 0x3f) | 0x80
  const h = b.toString('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const foodsData = JSON.parse(readFileSync(path.join(ROOT, 'public/data/foods.json'), 'utf8'))
const foodByName = new Map(foodsData.foods.map((f) => [f.name, f]))

function food(name) {
  const f = foodByName.get(name)
  if (!f) throw new Error(`Alimento não encontrado no catálogo: "${name}"`)
  return f
}

// ---- Base curada (10 por categoria x 6 categorias = 60 receitas) ----

const RECIPES = [
  // ---- Café da manhã ----
  {
    name: 'Omelete de claras com espinafre',
    meal_kind: 'cafe',
    description: 'Café da manhã leve e proteico, pronto em poucos minutos.',
    prep_minutes: 10,
    tags: ['alto proteína', 'rápida', 'low carb'],
    ingredients: [
      { name: 'Ovo (clara)', grams: 120 },
      { name: 'Espinafre Nova Zelândia refogado', grams: 60 },
      { name: 'Queijo minas frescal', grams: 30 },
    ],
    steps: [
      'Bata as claras com um pouco de sal.',
      'Refogue o espinafre em uma frigideira antiaderente.',
      'Adicione as claras batidas e deixe firmar em fogo baixo.',
      'Finalize com o queijo picado e dobre a omelete ao meio.',
    ],
  },
  {
    name: 'Mingau de aveia com banana',
    meal_kind: 'cafe',
    description: 'Clássico e reconfortante, ótima fonte de energia para começar o dia.',
    prep_minutes: 8,
    tags: ['econômica', 'rápida'],
    ingredients: [
      { name: 'Aveia em flocos', grams: 40 },
      { name: 'Leite desnatado', grams: 200 },
      { name: 'Banana prata', grams: 100 },
    ],
    steps: [
      'Aqueça o leite em fogo baixo sem deixar ferver.',
      'Adicione a aveia e mexa por 3-4 minutos até engrossar.',
      'Corte a banana em rodelas e misture ao final.',
    ],
  },
  {
    name: 'Panqueca de banana e aveia',
    meal_kind: 'cafe',
    description: 'Panqueca fit sem farinha refinada, doce na medida certa.',
    prep_minutes: 12,
    tags: ['rápida'],
    ingredients: [
      { name: 'Banana prata', grams: 120 },
      { name: 'Aveia em flocos', grams: 40 },
      { name: 'Ovo cozido', grams: 50 },
    ],
    steps: [
      'Amasse a banana com um garfo até virar um purê.',
      'Misture com o ovo e a aveia até formar uma massa homogênea.',
      'Despeje pequenas porções em frigideira antiaderente aquecida.',
      'Doure dos dois lados em fogo baixo.',
    ],
  },
  {
    name: 'Tapioca com queijo e presunto',
    meal_kind: 'cafe',
    description: 'Tapioca recheada, prática para o dia a dia.',
    prep_minutes: 8,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Tapioca (goma hidratada)', grams: 60 },
      { name: 'Queijo minas frescal', grams: 30 },
      { name: 'Presunto sem capa de gordura', grams: 20 },
    ],
    steps: [
      'Espalhe a goma de tapioca em frigideira antiaderente quente.',
      'Deixe firmar por cerca de 1 minuto e vire.',
      'Recheie com o queijo e o presunto e dobre ao meio.',
    ],
  },
  {
    name: 'Vitamina de banana com aveia',
    meal_kind: 'cafe',
    description: 'Vitamina cremosa para quem prefere tomar o café da manhã líquido.',
    prep_minutes: 5,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Leite desnatado', grams: 200 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Aveia em flocos', grams: 20 },
    ],
    steps: ['Bata todos os ingredientes no liquidificador até ficar homogêneo.', 'Sirva gelado.'],
  },
  {
    name: 'Pão integral com abacate e ovo',
    meal_kind: 'cafe',
    description: 'Combinação de gorduras boas e proteína para saciedade prolongada.',
    prep_minutes: 10,
    tags: ['vegetariana'],
    ingredients: [
      { name: 'Pão integral', grams: 50 },
      { name: 'Abacate', grams: 60 },
      { name: 'Ovo cozido', grams: 50 },
    ],
    steps: [
      'Amasse o abacate com um garfo e tempere com sal a gosto.',
      'Passe no pão torrado.',
      'Corte o ovo em fatias e finalize por cima.',
    ],
  },
  {
    name: 'Iogurte com aveia e banana',
    meal_kind: 'cafe',
    description: 'Café da manhã montado em camadas, rápido e sem fogão.',
    prep_minutes: 5,
    tags: ['rápida', 'vegetariana'],
    ingredients: [
      { name: 'Iogurte natural', grams: 150 },
      { name: 'Aveia em flocos', grams: 20 },
      { name: 'Banana prata', grams: 80 },
    ],
    steps: ['Corte a banana em rodelas.', 'Monte em camadas: iogurte, aveia e banana.'],
  },
  {
    name: 'Café com leite, pão e queijo',
    meal_kind: 'cafe',
    description: 'O café da manhã mais tradicional do Brasil.',
    prep_minutes: 8,
    tags: ['econômica', 'rápida'],
    ingredients: [
      { name: 'Café infusão 10%', grams: 100 },
      { name: 'Leite desnatado', grams: 100 },
      { name: 'Pão francês', grams: 50 },
      { name: 'Queijo minas frescal', grams: 20 },
    ],
    steps: ['Misture o café com o leite quente.', 'Sirva com o pão fatiado e o queijo.'],
  },
  {
    name: 'Omelete de queijo e tomate',
    meal_kind: 'cafe',
    description: 'Omelete simples, pronta em uma frigideira só.',
    prep_minutes: 10,
    tags: ['alto proteína', 'low carb', 'rápida'],
    ingredients: [
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Queijo minas frescal', grams: 30 },
      { name: 'Tomate', grams: 50 },
    ],
    steps: [
      'Bata os ovos com sal.',
      'Adicione o tomate picado e despeje na frigideira quente.',
      'Finalize com o queijo e dobre ao ponto de derreter.',
    ],
  },
  {
    name: 'Mingau de aveia com maçã',
    meal_kind: 'cafe',
    description: 'Variação do mingau clássico com fruta cozida no próprio preparo.',
    prep_minutes: 10,
    tags: ['econômica', 'vegetariana'],
    ingredients: [
      { name: 'Aveia em flocos', grams: 40 },
      { name: 'Leite desnatado', grams: 200 },
      { name: 'Maçã', grams: 100 },
    ],
    steps: [
      'Corte a maçã em cubos pequenos.',
      'Aqueça o leite com a maçã por 3 minutos.',
      'Adicione a aveia e mexa até engrossar.',
    ],
  },

  // ---- Almoço ----
  {
    name: 'Frango grelhado com arroz integral e brócolis',
    meal_kind: 'almoco',
    description: 'O prato-base da dieta fitness: proteína magra, carbo complexo e fibras.',
    prep_minutes: 25,
    tags: ['alto proteína', 'econômica'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 150 },
      { name: 'Arroz integral cozido', grams: 150 },
      { name: 'Brócolis cozido', grams: 100 },
    ],
    steps: [
      'Tempere o peito de frango e grelhe em fogo médio até dourar dos dois lados.',
      'Cozinhe o brócolis no vapor por 5 minutos.',
      'Monte o prato com o arroz integral já cozido.',
    ],
  },
  {
    name: 'Salmão grelhado com batata doce e salada',
    meal_kind: 'almoco',
    description: 'Rico em ômega-3, com carboidrato de baixo índice glicêmico.',
    prep_minutes: 25,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Salmão grelhado', grams: 150 },
      { name: 'Batata doce cozida', grams: 150 },
      { name: 'Alface', grams: 30 },
      { name: 'Tomate', grams: 50 },
    ],
    steps: [
      'Grelhe o salmão temperado em frigideira quente, 4 minutos por lado.',
      'Cozinhe a batata doce até ficar macia.',
      'Monte a salada de alface e tomate ao lado.',
    ],
  },
  {
    name: 'Carne moída com arroz e feijão',
    meal_kind: 'almoco',
    description: 'O tradicional prato brasileiro em versão equilibrada.',
    prep_minutes: 25,
    tags: ['econômica'],
    ingredients: [
      { name: 'Carne bovina moída (patinho)', grams: 120 },
      { name: 'Arroz branco cozido', grams: 150 },
      { name: 'Feijão carioca cozido', grams: 100 },
    ],
    steps: [
      'Refogue a carne moída com cebola e alho até dourar.',
      'Sirva com o arroz e o feijão já cozidos.',
    ],
  },
  {
    name: 'Frango com batata doce e legumes',
    meal_kind: 'almoco',
    description: 'Combinação clássica de marmita fitness.',
    prep_minutes: 25,
    tags: ['alto proteína', 'econômica'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 150 },
      { name: 'Batata doce cozida', grams: 150 },
      { name: 'Abobrinha italiana refogada', grams: 80 },
    ],
    steps: [
      'Grelhe o frango temperado a gosto.',
      'Cozinhe a batata doce em cubos até ficar macia.',
      'Refogue a abobrinha em fio de azeite.',
    ],
  },
  {
    name: 'Bacalhau refogado com batata e brócolis',
    meal_kind: 'almoco',
    description: 'Prato completo com peixe, ótimo para variar a proteína da semana.',
    prep_minutes: 30,
    tags: [],
    ingredients: [
      { name: 'Bacalhau salgado refogado', grams: 150 },
      { name: 'Batata inglesa cozida', grams: 150 },
      { name: 'Brócolis cozido', grams: 80 },
    ],
    steps: [
      'Dessalgue o bacalhau previamente (de véspera, trocando a água).',
      'Refogue com cebola, alho e azeite.',
      'Sirva com a batata e o brócolis cozidos.',
    ],
  },
  {
    name: 'Feijoada leve com couve',
    meal_kind: 'almoco',
    description: 'Versão do dia a dia da feijoada, sem os cortes gordurosos.',
    prep_minutes: 35,
    tags: ['econômica'],
    ingredients: [
      { name: 'Feijão preto cozido', grams: 150 },
      { name: 'Arroz branco cozido', grams: 150 },
      { name: 'Carne bovina acém sem gordura cozido', grams: 100 },
      { name: 'Couve manteiga refogada', grams: 60 },
    ],
    steps: [
      'Cozinhe a carne até ficar macia e desfie ou corte em cubos.',
      'Misture com o feijão preto já cozido e aqueça junto.',
      'Sirva com arroz e a couve refogada.',
    ],
  },
  {
    name: 'Salada completa com frango grelhado',
    meal_kind: 'almoco',
    description: 'Opção leve e low carb para os dias mais quentes.',
    prep_minutes: 15,
    tags: ['low carb', 'alto proteína', 'rápida'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 130 },
      { name: 'Alface', grams: 50 },
      { name: 'Tomate', grams: 60 },
      { name: 'Pepino cru', grams: 40 },
      { name: 'Azeite de oliva extra virgem', grams: 10 },
    ],
    steps: [
      'Corte o frango grelhado em tiras.',
      'Monte a salada com os vegetais picados.',
      'Tempere com azeite, sal e limão a gosto.',
    ],
  },
  {
    name: 'Carne de panela com legumes',
    meal_kind: 'almoco',
    description: 'Prato reconfortante, ótimo para preparar em quantidade e congelar.',
    prep_minutes: 40,
    tags: ['econômica'],
    ingredients: [
      { name: 'Carne bovina patinho sem gordura grelhado', grams: 120 },
      { name: 'Cenoura cozida', grams: 80 },
      { name: 'Batata inglesa cozida', grams: 100 },
    ],
    steps: [
      'Cozinhe a carne em panela de pressão com água e temperos até ficar macia.',
      'Adicione a cenoura e a batata nos últimos 15 minutos de cozimento.',
    ],
  },
  {
    name: 'Camarão refogado com arroz e pimentão',
    meal_kind: 'almoco',
    description: 'Prato rápido e saboroso para variar a proteína.',
    prep_minutes: 20,
    tags: ['rápida'],
    ingredients: [
      { name: 'Camarão Rio Grande grande cozido', grams: 150 },
      { name: 'Arroz branco cozido', grams: 150 },
      { name: 'Pimentão vermelho cru', grams: 50 },
    ],
    steps: [
      'Refogue o pimentão picado em azeite.',
      'Adicione o camarão já cozido e finalize em fogo alto por 2 minutos.',
      'Sirva sobre o arroz.',
    ],
  },
  {
    name: 'Lentilha com arroz integral e legumes',
    meal_kind: 'almoco',
    description: 'Opção vegetariana rica em proteína vegetal e fibras.',
    prep_minutes: 25,
    tags: ['vegetariana', 'econômica'],
    ingredients: [
      { name: 'Lentilha cozida', grams: 120 },
      { name: 'Arroz integral cozido', grams: 150 },
      { name: 'Cenoura cozida', grams: 60 },
      { name: 'Abobrinha italiana refogada', grams: 60 },
    ],
    steps: [
      'Cozinhe a lentilha com louro até ficar macia.',
      'Refogue a cenoura e a abobrinha à parte.',
      'Sirva tudo sobre o arroz integral.',
    ],
  },

  // ---- Jantar ----
  {
    name: 'Omelete de legumes',
    meal_kind: 'jantar',
    description: 'Jantar leve, pronto em uma frigideira.',
    prep_minutes: 15,
    tags: ['vegetariana', 'low carb', 'rápida'],
    ingredients: [
      { name: 'Ovo cozido', grams: 200 },
      { name: 'Cebola crua', grams: 30 },
      { name: 'Pimentão verde cru', grams: 40 },
      { name: 'Tomate', grams: 40 },
      { name: 'Queijo minas frescal', grams: 30 },
    ],
    steps: [
      'Refogue a cebola e o pimentão picados.',
      'Bata os ovos e despeje sobre os legumes na frigideira.',
      'Adicione o tomate picado e o queijo, deixe firmar em fogo baixo.',
    ],
  },
  {
    name: 'Sopa de legumes com frango desfiado',
    meal_kind: 'jantar',
    description: 'Ótima opção para noites mais frias, leve e nutritiva.',
    prep_minutes: 30,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 100 },
      { name: 'Cenoura cozida', grams: 60 },
      { name: 'Abobrinha italiana cozida', grams: 60 },
      { name: 'Batata inglesa cozida', grams: 80 },
    ],
    steps: [
      'Cozinhe os legumes em água e caldo até ficarem macios.',
      'Bata parte dos legumes para engrossar o caldo, se preferir.',
      'Desfie o frango e misture na sopa antes de servir.',
    ],
  },
  {
    name: 'Salmão grelhado com brócolis e batata doce',
    meal_kind: 'jantar',
    description: 'Jantar completo e rico em ômega-3.',
    prep_minutes: 20,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Salmão grelhado', grams: 130 },
      { name: 'Brócolis cozido', grams: 100 },
      { name: 'Batata doce cozida', grams: 100 },
    ],
    steps: [
      'Grelhe o salmão temperado por 4 minutos de cada lado.',
      'Sirva com o brócolis e a batata doce cozidos no vapor.',
    ],
  },
  {
    name: 'Sanduíche natural de frango',
    meal_kind: 'jantar',
    description: 'Jantar prático para os dias corridos.',
    prep_minutes: 10,
    tags: ['rápida'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 100 },
      { name: 'Pão integral', grams: 50 },
      { name: 'Alface', grams: 20 },
      { name: 'Tomate', grams: 30 },
    ],
    steps: [
      'Corte o frango grelhado em fatias finas.',
      'Monte o sanduíche com o pão, a alface e o tomate.',
    ],
  },
  {
    name: 'Bacalhau com vagem e cenoura no vapor',
    meal_kind: 'jantar',
    description: 'Prato leve, ideal para fechar o dia sem pesar.',
    prep_minutes: 25,
    tags: ['low carb'],
    ingredients: [
      { name: 'Bacalhau salgado refogado', grams: 170 },
      { name: 'Vagem crua', grams: 100 },
      { name: 'Cenoura cozida', grams: 80 },
      { name: 'Azeite de oliva extra virgem', grams: 10 },
    ],
    steps: [
      'Cozinhe a vagem no vapor por 6 minutos.',
      'Aqueça o bacalhau já dessalgado e refogado com um fio de azeite.',
      'Sirva junto com a cenoura cozida.',
    ],
  },
  {
    name: 'Escondidinho de frango com batata doce',
    meal_kind: 'jantar',
    description: 'Versão fit do escondidinho tradicional.',
    prep_minutes: 30,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 120 },
      { name: 'Batata doce cozida', grams: 150 },
      { name: 'Queijo minas frescal', grams: 20 },
    ],
    steps: [
      'Desfie o frango grelhado.',
      'Amasse a batata doce cozida até formar um purê.',
      'Monte em camadas (purê, frango, purê) e gratine com o queijo no forno por 10 minutos.',
    ],
  },
  {
    name: 'Salada de atum com milho',
    meal_kind: 'jantar',
    description: 'Prático, sem precisar acender o fogão.',
    prep_minutes: 10,
    tags: ['rápida', 'alto proteína'],
    ingredients: [
      { name: 'Atum em água (lata)', grams: 100 },
      { name: 'Alface', grams: 40 },
      { name: 'Tomate', grams: 50 },
      { name: 'Milho verde cru', grams: 40 },
      { name: 'Azeite de oliva extra virgem', grams: 8 },
    ],
    steps: ['Escorra o atum.', 'Misture todos os ingredientes em uma tigela.', 'Tempere com azeite, sal e limão.'],
  },
  {
    name: 'Frango ao molho de tomate com arroz',
    meal_kind: 'jantar',
    description: 'Jantar caseiro e reconfortante.',
    prep_minutes: 25,
    tags: ['econômica'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 130 },
      { name: 'Tomate molho industrializado', grams: 60 },
      { name: 'Arroz branco cozido', grams: 120 },
    ],
    steps: [
      'Aqueça o molho de tomate temperado com alho e orégano.',
      'Adicione o frango grelhado picado e deixe apurar por 5 minutos.',
      'Sirva sobre o arroz.',
    ],
  },
  {
    name: 'Berinjela recheada com carne moída',
    meal_kind: 'jantar',
    description: 'Prato low carb, substitui o carboidrato pela berinjela.',
    prep_minutes: 35,
    tags: ['low carb'],
    ingredients: [
      { name: 'Berinjela cozida', grams: 150 },
      { name: 'Carne bovina moída (patinho)', grams: 100 },
      { name: 'Queijo minas frescal', grams: 20 },
    ],
    steps: [
      'Corte a berinjela ao meio e retire parte do miolo.',
      'Refogue a carne moída temperada e recheie a berinjela.',
      'Finalize com o queijo e gratine no forno por 10 minutos.',
    ],
  },
  {
    name: 'Crepioca de frango',
    meal_kind: 'jantar',
    description: 'Alternativa proteica à tapioca tradicional.',
    prep_minutes: 12,
    tags: ['alto proteína', 'rápida'],
    ingredients: [
      { name: 'Tapioca (goma hidratada)', grams: 70 },
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Peito de frango grelhado', grams: 100 },
      { name: 'Queijo minas frescal', grams: 20 },
    ],
    steps: [
      'Bata o ovo e misture com a goma de tapioca.',
      'Despeje em frigideira antiaderente quente e deixe firmar.',
      'Recheie com o frango desfiado e o queijo, dobre ao meio.',
    ],
  },

  // ---- Lanches ----
  {
    name: 'Iogurte com morango',
    meal_kind: 'lanche',
    description: 'Lanche rápido e refrescante.',
    prep_minutes: 3,
    tags: ['rápida', 'vegetariana'],
    ingredients: [
      { name: 'Iogurte natural', grams: 150 },
      { name: 'Morango cru', grams: 80 },
    ],
    steps: ['Corte os morangos em pedaços.', 'Misture com o iogurte.'],
  },
  {
    name: 'Vitamina de abacate',
    meal_kind: 'lanche',
    description: 'Cremosa e rica em gorduras boas.',
    prep_minutes: 5,
    tags: ['vegetariana', 'rápida'],
    ingredients: [
      { name: 'Abacate', grams: 100 },
      { name: 'Leite desnatado', grams: 150 },
    ],
    steps: ['Bata os ingredientes no liquidificador até ficar cremoso.', 'Sirva gelado.'],
  },
  {
    name: 'Mix de castanhas',
    meal_kind: 'lanche',
    description: 'Lanche prático sem preparo, ótimo para levar na bolsa.',
    prep_minutes: 1,
    tags: ['rápida', 'vegetariana'],
    ingredients: [
      { name: 'Castanha do Pará', grams: 15 },
      { name: 'Amendoim torrado', grams: 15 },
      { name: 'Castanha-de-caju torrada salgada', grams: 15 },
    ],
    steps: ['Misture as castanhas em um pote.'],
  },
  {
    name: 'Banana com amendoim torrado',
    meal_kind: 'lanche',
    description: 'Clássico pré ou pós-treino, também serve como lanche da tarde.',
    prep_minutes: 3,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Banana prata', grams: 100 },
      { name: 'Amendoim torrado', grams: 20 },
    ],
    steps: ['Corte a banana ao meio.', 'Polvilhe o amendoim picado por cima.'],
  },
  {
    name: 'Queijo com pão integral',
    meal_kind: 'lanche',
    description: 'Lanche simples e equilibrado.',
    prep_minutes: 5,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Pão integral', grams: 50 },
      { name: 'Queijo minas frescal', grams: 30 },
    ],
    steps: ['Monte o sanduíche com o queijo fatiado.'],
  },
  {
    name: 'Frutas variadas',
    meal_kind: 'lanche',
    description: 'Lanche leve e rico em fibras e vitaminas.',
    prep_minutes: 5,
    tags: ['vegetariana', 'rápida', 'econômica'],
    ingredients: [
      { name: 'Maçã', grams: 100 },
      { name: 'Uva Itália crua', grams: 80 },
      { name: 'Melancia crua', grams: 100 },
    ],
    steps: ['Corte as frutas em pedaços e misture em uma tigela.'],
  },
  {
    name: 'Iogurte com aveia e banana',
    meal_kind: 'lanche',
    description: 'Combinação prática que rende energia até a próxima refeição.',
    prep_minutes: 5,
    tags: ['vegetariana', 'rápida'],
    ingredients: [
      { name: 'Iogurte natural', grams: 150 },
      { name: 'Aveia em flocos', grams: 20 },
      { name: 'Banana prata', grams: 50 },
    ],
    steps: ['Corte a banana em rodelas.', 'Misture o iogurte com a aveia e finalize com a banana.'],
  },
  {
    name: 'Sanduíche natural de atum',
    meal_kind: 'lanche',
    description: 'Lanche proteico, ótimo para depois do treino ou entre refeições.',
    prep_minutes: 8,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Pão integral', grams: 50 },
      { name: 'Atum em água (lata)', grams: 60 },
      { name: 'Alface', grams: 15 },
    ],
    steps: ['Escorra o atum e tempere com um fio de azeite.', 'Monte o sanduíche com a alface.'],
  },
  {
    name: 'Ovo cozido com torrada',
    meal_kind: 'lanche',
    description: 'Lanche simples e barato, fácil de preparar em quantidade.',
    prep_minutes: 10,
    tags: ['econômica', 'alto proteína'],
    ingredients: [
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Pão francês', grams: 50 },
    ],
    steps: ['Cozinhe os ovos por 8-10 minutos.', 'Sirva com o pão torrado.'],
  },
  {
    name: 'Smoothie verde',
    meal_kind: 'lanche',
    description: 'Lanche refrescante com folhas escuras.',
    prep_minutes: 5,
    tags: ['vegetariana', 'rápida'],
    ingredients: [
      { name: 'Espinafre Nova Zelândia cru', grams: 40 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Leite desnatado', grams: 150 },
    ],
    steps: ['Bata todos os ingredientes no liquidificador até ficar homogêneo.'],
  },

  // ---- Pré-treino ----
  {
    name: 'Banana com aveia',
    meal_kind: 'pre_treino',
    description: 'Carboidrato de rápida digestão para energia no treino.',
    prep_minutes: 3,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Banana prata', grams: 100 },
      { name: 'Aveia em flocos', grams: 30 },
    ],
    steps: ['Corte a banana em rodelas e polvilhe a aveia por cima.'],
  },
  {
    name: 'Pão integral com ovo',
    meal_kind: 'pre_treino',
    description: 'Combinação simples de carboidrato e proteína antes do treino.',
    prep_minutes: 10,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Pão integral', grams: 50 },
      { name: 'Ovo cozido', grams: 100 },
    ],
    steps: ['Cozinhe o ovo e fatie.', 'Monte o sanduíche com o pão.'],
  },
  {
    name: 'Vitamina de banana com whey',
    meal_kind: 'pre_treino',
    description: 'Rápida de preparar, dá energia e um pouco de proteína antes do treino.',
    prep_minutes: 5,
    tags: ['alto proteína', 'rápida'],
    ingredients: [
      { name: 'Leite desnatado', grams: 200 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Whey protein (concentrado)', grams: 30 },
    ],
    steps: ['Bata todos os ingredientes no liquidificador.'],
  },
  {
    name: 'Tapioca com banana',
    meal_kind: 'pre_treino',
    description: 'Carboidrato de fácil digestão, sem excesso de fibra ou gordura.',
    prep_minutes: 10,
    tags: ['rápida'],
    ingredients: [
      { name: 'Tapioca (goma hidratada)', grams: 60 },
      { name: 'Banana prata', grams: 80 },
    ],
    steps: [
      'Espalhe a goma de tapioca na frigideira quente.',
      'Recheie com a banana fatiada e dobre ao meio.',
    ],
  },
  {
    name: 'Batata doce com frango',
    meal_kind: 'pre_treino',
    description: 'Combinação clássica quando o treino é 1-2h depois da refeição.',
    prep_minutes: 25,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Batata doce cozida', grams: 150 },
      { name: 'Peito de frango grelhado', grams: 100 },
    ],
    steps: ['Cozinhe a batata doce até ficar macia.', 'Sirva com o frango grelhado.'],
  },
  {
    name: 'Mingau de aveia com banana',
    meal_kind: 'pre_treino',
    description: 'Boa opção quando o treino é pela manhã.',
    prep_minutes: 10,
    tags: ['econômica'],
    ingredients: [
      { name: 'Aveia em flocos', grams: 40 },
      { name: 'Leite desnatado', grams: 150 },
      { name: 'Banana prata', grams: 80 },
    ],
    steps: ['Aqueça o leite e adicione a aveia, mexendo até engrossar.', 'Finalize com a banana em rodelas.'],
  },
  {
    name: 'Pão francês com banana amassada',
    meal_kind: 'pre_treino',
    description: 'Opção simples e barata de carboidrato rápido.',
    prep_minutes: 5,
    tags: ['econômica', 'rápida'],
    ingredients: [
      { name: 'Pão francês', grams: 50 },
      { name: 'Banana prata', grams: 80 },
    ],
    steps: ['Amasse a banana com um garfo.', 'Passe no pão.'],
  },
  {
    name: 'Mix de aveia, castanha e banana',
    meal_kind: 'pre_treino',
    description: 'Combinação prática para levar pronta na bolsa de treino.',
    prep_minutes: 5,
    tags: ['rápida'],
    ingredients: [
      { name: 'Aveia em flocos', grams: 30 },
      { name: 'Castanha-do-Brasil crua', grams: 15 },
      { name: 'Banana prata', grams: 50 },
    ],
    steps: ['Pique a castanha e misture com a aveia.', 'Sirva com a banana em rodelas por cima.'],
  },
  {
    name: 'Suco de laranja com aveia',
    meal_kind: 'pre_treino',
    description: 'Hidratação e carboidrato juntos antes do treino.',
    prep_minutes: 5,
    tags: ['rápida', 'econômica'],
    ingredients: [
      { name: 'Laranja baía suco', grams: 200 },
      { name: 'Aveia em flocos', grams: 20 },
    ],
    steps: ['Bata o suco de laranja com a aveia no liquidificador.'],
  },
  {
    name: 'Omelete simples pré-treino',
    meal_kind: 'pre_treino',
    description: 'Boa opção quando o treino é 1h30-2h depois de comer.',
    prep_minutes: 10,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Pão integral', grams: 30 },
    ],
    steps: ['Prepare o ovo mexido ou cozido.', 'Sirva com o pão integral.'],
  },

  // ---- Pós-treino ----
  {
    name: 'Whey com banana',
    meal_kind: 'pos_treino',
    description: 'Reposição rápida de proteína e carboidrato após o treino.',
    prep_minutes: 5,
    tags: ['alto proteína', 'rápida'],
    ingredients: [
      { name: 'Whey protein (concentrado)', grams: 30 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Leite desnatado', grams: 200 },
    ],
    steps: ['Bata todos os ingredientes no liquidificador.'],
  },
  {
    name: 'Frango com arroz branco',
    meal_kind: 'pos_treino',
    description: 'O clássico pós-treino: proteína magra e carboidrato de rápida absorção.',
    prep_minutes: 25,
    tags: ['alto proteína', 'econômica'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 150 },
      { name: 'Arroz branco cozido', grams: 150 },
    ],
    steps: ['Grelhe o frango temperado.', 'Sirva com o arroz branco.'],
  },
  {
    name: 'Omelete proteico com queijo',
    meal_kind: 'pos_treino',
    description: 'Opção rápida quando o treino termina tarde da noite.',
    prep_minutes: 10,
    tags: ['alto proteína', 'low carb'],
    ingredients: [
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Queijo minas frescal', grams: 30 },
    ],
    steps: ['Prepare os ovos mexidos ou em omelete.', 'Finalize com o queijo.'],
  },
  {
    name: 'Batata inglesa com carne moída',
    meal_kind: 'pos_treino',
    description: 'Boa reposição de carboidrato e proteína após treinos intensos.',
    prep_minutes: 25,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Batata inglesa cozida', grams: 150 },
      { name: 'Carne bovina moída (patinho)', grams: 120 },
    ],
    steps: ['Refogue a carne moída temperada.', 'Sirva com a batata cozida.'],
  },
  {
    name: 'Iogurte com whey e banana',
    meal_kind: 'pos_treino',
    description: 'Lanche cremoso e prático para depois do treino.',
    prep_minutes: 5,
    tags: ['alto proteína', 'rápida'],
    ingredients: [
      { name: 'Iogurte natural', grams: 150 },
      { name: 'Whey protein (concentrado)', grams: 20 },
      { name: 'Banana prata', grams: 80 },
    ],
    steps: ['Misture o whey no iogurte até dissolver bem.', 'Finalize com a banana em rodelas.'],
  },
  {
    name: 'Atum com batata doce',
    meal_kind: 'pos_treino',
    description: 'Prático para quem treina fora de casa e leva marmita.',
    prep_minutes: 20,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Atum em água (lata)', grams: 100 },
      { name: 'Batata doce cozida', grams: 150 },
    ],
    steps: ['Cozinhe a batata doce.', 'Sirva com o atum escorrido.'],
  },
  {
    name: 'Sanduíche proteico de frango',
    meal_kind: 'pos_treino',
    description: 'Praticidade sem abrir mão da proteína pós-treino.',
    prep_minutes: 10,
    tags: ['alto proteína', 'rápida'],
    ingredients: [
      { name: 'Pão integral', grams: 60 },
      { name: 'Peito de frango grelhado', grams: 100 },
      { name: 'Queijo minas frescal', grams: 20 },
    ],
    steps: ['Corte o frango em fatias.', 'Monte o sanduíche com o queijo.'],
  },
  {
    name: 'Salmão com arroz integral',
    meal_kind: 'pos_treino',
    description: 'Opção com ômega-3 para quem treina à noite e janta em seguida.',
    prep_minutes: 20,
    tags: ['alto proteína'],
    ingredients: [
      { name: 'Salmão grelhado', grams: 130 },
      { name: 'Arroz integral cozido', grams: 130 },
    ],
    steps: ['Grelhe o salmão temperado.', 'Sirva com o arroz integral.'],
  },
  {
    name: 'Vitamina pós-treino de banana e aveia',
    meal_kind: 'pos_treino',
    description: 'Combina proteína, carboidrato e potássio em um só copo.',
    prep_minutes: 5,
    tags: ['alto proteína', 'rápida'],
    ingredients: [
      { name: 'Leite desnatado', grams: 200 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Aveia em flocos', grams: 30 },
      { name: 'Whey protein (concentrado)', grams: 20 },
    ],
    steps: ['Bata todos os ingredientes no liquidificador até ficar homogêneo.'],
  },
  {
    name: 'Ovo com batata doce',
    meal_kind: 'pos_treino',
    description: 'Combinação simples e barata, clássica de quem busca ganho de massa.',
    prep_minutes: 20,
    tags: ['econômica', 'alto proteína'],
    ingredients: [
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Batata doce cozida', grams: 150 },
    ],
    steps: ['Cozinhe os ovos e a batata doce.', 'Sirva juntos.'],
  },
]

// ---- Build ----

const KCAL_RANGE = {
  cafe: [120, 550],
  almoco: [300, 950],
  jantar: [250, 900],
  lanche: [80, 450],
  pre_treino: [100, 500],
  pos_treino: [150, 600],
}

const recipes = []
const recipeItems = []
let warnings = 0

for (const r of RECIPES) {
  const recipeId = uuidV5(`recipe:${r.name}`, UUID_NAMESPACE)
  let totalKcal = 0

  const items = r.ingredients.map((ing) => {
    const f = food(ing.name)
    const quantity = f.portion_grams ? ing.grams / f.portion_grams : 1
    totalKcal += f.kcal * quantity
    return {
      id: uuidV5(`recipe-item:${r.name}:${ing.name}`, UUID_NAMESPACE),
      recipe_id: recipeId,
      food_id: f.id,
      quantity: Math.round(quantity * 100) / 100,
    }
  })

  const [min, max] = KCAL_RANGE[r.meal_kind]
  if (totalKcal < min || totalKcal > max) {
    console.warn(`aviso: "${r.name}" (${r.meal_kind}) = ${Math.round(totalKcal)} kcal, fora da faixa [${min}-${max}]`)
    warnings++
  }

  recipes.push({
    id: recipeId,
    name: r.name,
    meal_kind: r.meal_kind,
    description: r.description,
    image_url: null,
    servings: 1,
    prep_minutes: r.prep_minutes,
    source: 'treinei-curadoria',
    is_custom: false,
    owner_id: null,
    created_at: '2026-07-03T00:00:00.000Z',
    tags: r.tags,
    instructions: r.steps,
  })
  recipeItems.push(...items)
}

const byKind = {}
for (const r of recipes) byKind[r.meal_kind] = (byKind[r.meal_kind] ?? 0) + 1

writeFileSync(
  path.join(ROOT, 'public/data/recipes.json'),
  JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), recipes, recipeItems }),
)

console.log(`${recipes.length} receitas geradas (${warnings} avisos de faixa de kcal)`)
console.log(byKind)
