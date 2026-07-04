// Dados curados do "Cronograma de Alta Performance e Hipertrofia" (planilha do usuário).
//
// Este módulo é a ÚNICA fonte da verdade do conteúdo do cronograma e é consumido por:
//   - scripts/import-foods.mjs   → injeta EXTRA_FOODS em public/data/foods.json
//   - scripts/build-recipes.mjs  → injeta CRONOGRAMA_RECIPES em public/data/recipes.json
//
// As refeições referenciam alimentos por NOME EXATO do catálogo (TACO + estes extras),
// então os macros (proteína/carbo/gordura/kcal) são sempre calculados a partir do
// alimento — nunca ficam desalinhados. Os alimentos que a planilha usa e que a TACO não
// tinha entram aqui em EXTRA_FOODS com valores por 100 g de tabelas nutricionais padrão.

/**
 * Alimentos que a planilha usa e que ainda não existiam no catálogo (TACO/seed V1).
 * Valores por 100 g. Recebem UUID determinístico (food:cronograma:<nome>) e source
 * 'cronograma' no import-foods, então bulkPut é idempotente.
 */
export const EXTRA_FOODS = [
  // Peixes
  { name: 'Filé de tilápia grelhado', category: 'Peixes e frutos do mar', protein_g: 26.2, carbs_g: 0, fat_g: 1.7, kcal: 129 },
  { name: 'Filé de pescada grelhado', category: 'Peixes e frutos do mar', protein_g: 18.5, carbs_g: 0, fat_g: 1.5, kcal: 92 },
  // Cereais / carboidratos complexos
  { name: 'Quinoa em grãos cozida', category: 'Cereais e pães', protein_g: 4.4, carbs_g: 21.3, fat_g: 1.9, kcal: 120 },
  { name: 'Arroz negro cozido', category: 'Cereais e pães', protein_g: 4.5, carbs_g: 24, fat_g: 1.1, kcal: 130 },
  { name: 'Inhame cozido', category: 'Verduras e legumes', protein_g: 2.1, carbs_g: 27.9, fat_g: 0.2, kcal: 116 },
  { name: 'Rap10 wrap integral', category: 'Cereais e pães', protein_g: 9, carbs_g: 50, fat_g: 7, kcal: 300 },
  // Leguminosas / massas especiais
  { name: 'Macarrão de grão-de-bico cozido', category: 'Leguminosas', protein_g: 8, carbs_g: 24, fat_g: 2, kcal: 150 },
  { name: 'Macarrão de lentilha cozido', category: 'Leguminosas', protein_g: 9, carbs_g: 25, fat_g: 1, kcal: 150 },
  // Nozes e sementes / gorduras boas
  { name: 'Nozes', category: 'Nozes e sementes', protein_g: 14, carbs_g: 18, fat_g: 59, kcal: 620 },
  { name: 'Pasta de amendoim integral', category: 'Nozes e sementes', protein_g: 25, carbs_g: 20, fat_g: 50, kcal: 588 },
  { name: 'Sementes de abóbora', category: 'Nozes e sementes', protein_g: 30.2, carbs_g: 10.7, fat_g: 49, kcal: 559 },
  // Leite e derivados / suplementos
  { name: 'Iogurte grego zero', category: 'Leite e derivados', protein_g: 9, carbs_g: 4, fat_g: 0, kcal: 52 },
  { name: 'Leite em pó desnatado', category: 'Leite e derivados', protein_g: 35, carbs_g: 52, fat_g: 1, kcal: 358 },
  { name: 'Creatina monohidratada', category: 'Suplementos', protein_g: 0, carbs_g: 0, fat_g: 0, kcal: 0 },
  // Verduras
  { name: 'Aspargo cozido', category: 'Verduras e legumes', protein_g: 2.4, carbs_g: 4.1, fat_g: 0.2, kcal: 22 },
  { name: 'Cogumelo Paris (champignon)', category: 'Verduras e legumes', protein_g: 3.1, carbs_g: 3.3, fat_g: 0.3, kcal: 22 },
  // Bebidas
  { name: 'Suco de uva integral', category: 'Bebidas', protein_g: 0.3, carbs_g: 15, fat_g: 0.1, kcal: 62 },
]

const TAG = 'Alta Performance'

/**
 * Refeições distintas do cronograma (o plano repete o mesmo ciclo semanal). Cada uma vira
 * uma receita sugerida, misturada às sugestões existentes do app, marcada com a tag
 * "Alta Performance" para ficar identificável. Gramas seguem as porções da planilha.
 */
export const CRONOGRAMA_RECIPES = [
  // ---- Pré-treino ----
  {
    name: 'Shot Matinal Ativador',
    meal_kind: 'pre_treino',
    description: 'Água quente com limão, mel e cúrcuma — energia rápida e foco antes do treino.',
    prep_minutes: 3,
    tags: [TAG, 'rápida'],
    ingredients: [{ name: 'Mel de abelha', grams: 20 }],
    steps: [
      'Esprema meio limão em uma xícara de água morna.',
      'Adicione o mel e uma pitada de cúrcuma e mexa bem.',
      'Beba em jejum, logo ao acordar.',
    ],
  },

  // ---- Pós-treino ----
  {
    name: 'Shake Anabólico Pós-Treino',
    meal_kind: 'pos_treino',
    description: 'Whey, banana, aveia e creatina para reabastecer glicogênio e iniciar a recuperação.',
    prep_minutes: 5,
    tags: [TAG, 'alto proteína', 'rápida'],
    ingredients: [
      { name: 'Whey protein (concentrado)', grams: 40 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Aveia em flocos', grams: 40 },
      { name: 'Creatina monohidratada', grams: 5 },
    ],
    steps: ['Bata o whey, a banana e a aveia com água ou leite no liquidificador.', 'Acrescente a creatina e misture antes de beber.'],
  },
  {
    name: 'Crepioca Proteica de Frango',
    meal_kind: 'pos_treino',
    description: 'Crepioca recheada com frango desfiado — proteína e carboidrato na janela pós-treino.',
    prep_minutes: 12,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Tapioca (goma hidratada)', grams: 60 },
      { name: 'Peito de frango grelhado', grams: 100 },
    ],
    steps: [
      'Misture os ovos batidos com a goma de tapioca.',
      'Despeje em frigideira antiaderente quente e deixe firmar.',
      'Recheie com o frango desfiado e dobre ao meio.',
    ],
  },
  {
    name: 'Wrap Proteico de Frango com Ricota',
    meal_kind: 'pos_treino',
    description: 'Wrap integral prático para o pós-treino, com frango e creme de ricota.',
    prep_minutes: 10,
    tags: [TAG, 'alto proteína', 'rápida'],
    ingredients: [
      { name: 'Rap10 wrap integral', grams: 30 },
      { name: 'Peito de frango grelhado', grams: 100 },
      { name: 'Queijo ricota', grams: 30 },
    ],
    steps: ['Passe o creme de ricota no wrap.', 'Recheie com o frango desfiado e enrole.'],
  },
  {
    name: 'Panqueca Fit de Banana',
    meal_kind: 'pos_treino',
    description: 'Panqueca sem farinha refinada, doce na medida e rica em energia.',
    prep_minutes: 12,
    tags: [TAG, 'rápida'],
    ingredients: [
      { name: 'Banana prata', grams: 100 },
      { name: 'Ovo cozido', grams: 50 },
      { name: 'Aveia em flocos', grams: 30 },
      { name: 'Mel de abelha', grams: 10 },
    ],
    steps: [
      'Amasse a banana e misture com o ovo e a aveia.',
      'Doure pequenas porções em frigideira antiaderente.',
      'Finalize com um fio de mel.',
    ],
  },
  {
    name: 'Tapioca com Ovos Mexidos e Queijo',
    meal_kind: 'pos_treino',
    description: 'Tapioca recheada com ovos mexidos e queijo branco.',
    prep_minutes: 10,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Tapioca (goma hidratada)', grams: 60 },
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Queijo minas frescal', grams: 30 },
    ],
    steps: ['Prepare a tapioca na frigideira.', 'Recheie com os ovos mexidos e o queijo, dobre ao meio.'],
  },
  {
    name: 'Omelete com Pão Integral e Ricota',
    meal_kind: 'pos_treino',
    description: 'Omelete de 3 ovos acompanhada de pão integral com ricota.',
    prep_minutes: 12,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Pão integral', grams: 50 },
      { name: 'Queijo ricota', grams: 30 },
    ],
    steps: ['Bata os ovos com sal e faça a omelete em fogo baixo.', 'Sirva com o pão integral e a ricota.'],
  },

  // ---- Café da manhã (fim de semana / dias de corrida) ----
  {
    name: 'Crepioca com Queijo e Suco de Uva',
    meal_kind: 'cafe',
    description: 'Café da manhã de fim de semana: crepioca com queijo minas e suco de uva integral.',
    prep_minutes: 12,
    tags: [TAG],
    ingredients: [
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Tapioca (goma hidratada)', grams: 60 },
      { name: 'Queijo minas frescal', grams: 30 },
      { name: 'Suco de uva integral', grams: 200 },
    ],
    steps: ['Prepare a crepioca com os ovos e a goma.', 'Recheie com o queijo.', 'Acompanhe com o suco de uva integral.'],
  },
  {
    name: 'Ovos Cozidos com Pão Integral e Mamão',
    meal_kind: 'cafe',
    description: 'Combinação equilibrada de proteína, carboidrato integral e fruta.',
    prep_minutes: 12,
    tags: [TAG],
    ingredients: [
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Pão integral', grams: 50 },
      { name: 'Mamão Papaia cru', grams: 120 },
    ],
    steps: ['Cozinhe os ovos por 8-10 minutos.', 'Sirva com o pão integral e o mamão em fatias.'],
  },
  {
    name: 'Cuscuz de Milho com Ovos e Queijo',
    meal_kind: 'cafe',
    description: 'Cuscuz nordestino com ovos e queijo branco — carboidrato e proteína logo cedo.',
    prep_minutes: 15,
    tags: [TAG, 'econômica'],
    ingredients: [
      { name: 'Cuscuz de milho cozido com sal', grams: 120 },
      { name: 'Ovo cozido', grams: 100 },
      { name: 'Queijo minas frescal', grams: 30 },
    ],
    steps: ['Prepare o cuscuz na cuscuzeira.', 'Sirva com os ovos cozidos e o queijo.'],
  },

  // ---- Almoço ----
  {
    name: 'Mandioquinha com Patinho e Brócolis',
    meal_kind: 'almoco',
    description: 'Carboidrato de baixo IG, carne magra e vegetais — almoço-base do cronograma.',
    prep_minutes: 30,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Batata baroa cozida', grams: 180 },
      { name: 'Carne bovina moída (patinho)', grams: 150 },
      { name: 'Brócolis cozido', grams: 100 },
    ],
    steps: ['Cozinhe a mandioquinha (batata-baroa) até ficar macia.', 'Refogue o patinho moído temperado.', 'Sirva com o brócolis no vapor.'],
  },
  {
    name: 'Quinoa com Tilápia e Abacate',
    meal_kind: 'almoco',
    description: 'Grão ancestral, peixe magro e gordura boa do abacate.',
    prep_minutes: 25,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Quinoa em grãos cozida', grams: 150 },
      { name: 'Filé de tilápia grelhado', grams: 150 },
      { name: 'Abacate', grams: 50 },
    ],
    steps: ['Cozinhe a quinoa em água com sal.', 'Grelhe a tilápia temperada.', 'Sirva com fatias de abacate na salada.'],
  },
  {
    name: 'Batata-Doce com Alcatra e Vagem',
    meal_kind: 'almoco',
    description: 'Clássico da hipertrofia: batata-doce, alcatra grelhada e vagem.',
    prep_minutes: 30,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Batata doce cozida', grams: 200 },
      { name: 'Carne bovina miolo de alcatra sem gordura grelhado', grams: 150 },
      { name: 'Vagem crua', grams: 80 },
    ],
    steps: ['Cozinhe ou asse a batata-doce.', 'Grelhe a alcatra ao ponto desejado.', 'Cozinhe a vagem no vapor.'],
  },
  {
    name: 'Quinoa com Frango e Rúcula',
    meal_kind: 'almoco',
    description: 'Refeição leve e proteica com quinoa, frango grelhado e rúcula.',
    prep_minutes: 25,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Quinoa em grãos cozida', grams: 150 },
      { name: 'Peito de frango grelhado', grams: 150 },
      { name: 'Rúcula crua', grams: 40 },
    ],
    steps: ['Cozinhe a quinoa.', 'Grelhe o frango temperado.', 'Monte com a rúcula por cima.'],
  },
  {
    name: 'Arroz Negro com Alcatra',
    meal_kind: 'almoco',
    description: 'Arroz negro rico em antioxidantes com tiras de alcatra acebolada.',
    prep_minutes: 35,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Arroz negro cozido', grams: 150 },
      { name: 'Carne bovina miolo de alcatra sem gordura grelhado', grams: 150 },
    ],
    steps: ['Cozinhe o arroz negro (leva mais tempo que o branco).', 'Grelhe a alcatra em tiras com cebola.'],
  },
  {
    name: 'Macarrão de Grão-de-bico ao Sugo com Frango',
    meal_kind: 'almoco',
    description: 'Massa de leguminosa rica em fibras, molho de tomate e frango.',
    prep_minutes: 25,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Macarrão de grão-de-bico cozido', grams: 180 },
      { name: 'Peito de frango grelhado', grams: 150 },
      { name: 'Tomate', grams: 60 },
    ],
    steps: ['Cozinhe o macarrão de grão-de-bico al dente.', 'Prepare um molho rápido de tomate.', 'Misture com o frango grelhado picado.'],
  },
  {
    name: 'Mandioca com Salmão',
    meal_kind: 'almoco',
    description: 'Mandioca na airfryer com salmão grelhado — ômega-3 biodisponível.',
    prep_minutes: 30,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Mandioca cozida', grams: 180 },
      { name: 'Salmão grelhado', grams: 160 },
    ],
    steps: ['Cozinhe a mandioca e finalize na airfryer com azeite.', 'Grelhe o salmão temperado, 4 minutos por lado.'],
  },
  {
    name: 'Abóbora Cabotiá com Alcatra e Brócolis',
    meal_kind: 'almoco',
    description: 'Abóbora assada, alcatra e brócolis — denso em micronutrientes e proteína.',
    prep_minutes: 35,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Abóbora cabotian cozida', grams: 200 },
      { name: 'Carne bovina miolo de alcatra sem gordura grelhado', grams: 160 },
      { name: 'Brócolis cozido', grams: 80 },
    ],
    steps: ['Asse a abóbora cabotiá em cubos.', 'Grelhe a alcatra.', 'Sirva com o brócolis no vapor.'],
  },

  // ---- Lanche da tarde ----
  {
    name: 'Iogurte com Aveia e Nozes',
    meal_kind: 'lanche',
    description: 'Lanche com gorduras nobres para sustentar o foco à tarde.',
    prep_minutes: 5,
    tags: [TAG, 'rápida'],
    ingredients: [
      { name: 'Iogurte natural', grams: 150 },
      { name: 'Aveia em flocos', grams: 30 },
      { name: 'Nozes', grams: 15 },
    ],
    steps: ['Misture o iogurte com a aveia.', 'Finalize com as nozes picadas.'],
  },
  {
    name: 'Banana com Pasta de Amendoim',
    meal_kind: 'lanche',
    description: 'Clássico pré ou pós-treino, também ótimo lanche da tarde.',
    prep_minutes: 3,
    tags: [TAG, 'rápida', 'econômica'],
    ingredients: [
      { name: 'Banana prata', grams: 100 },
      { name: 'Pasta de amendoim integral', grams: 20 },
    ],
    steps: ['Corte a banana ao meio.', 'Cubra com a pasta de amendoim.'],
  },
  {
    name: 'Iogurte Grego com Sementes de Abóbora',
    meal_kind: 'lanche',
    description: 'Iogurte grego zero com sementes ricas em minerais.',
    prep_minutes: 3,
    tags: [TAG, 'alto proteína', 'rápida', 'low carb'],
    ingredients: [
      { name: 'Iogurte grego zero', grams: 150 },
      { name: 'Sementes de abóbora', grams: 20 },
    ],
    steps: ['Cubra o iogurte grego com as sementes de abóbora.'],
  },
  {
    name: 'Vitamina de Abacate com Whey',
    meal_kind: 'lanche',
    description: 'Vitamina cremosa com gordura boa e proteína.',
    prep_minutes: 5,
    tags: [TAG, 'alto proteína', 'rápida'],
    ingredients: [
      { name: 'Leite desnatado', grams: 200 },
      { name: 'Abacate', grams: 100 },
      { name: 'Whey protein (concentrado)', grams: 20 },
    ],
    steps: ['Bata o leite com o abacate e o whey no liquidificador.', 'Sirva gelado.'],
  },
  {
    name: 'Iogurte Natural com Nozes e Mel',
    meal_kind: 'lanche',
    description: 'Aporte lipídico nobre para performance mental.',
    prep_minutes: 3,
    tags: [TAG, 'rápida'],
    ingredients: [
      { name: 'Iogurte natural', grams: 150 },
      { name: 'Nozes', grams: 15 },
      { name: 'Mel de abelha', grams: 10 },
    ],
    steps: ['Misture o iogurte com as nozes.', 'Regue com o mel.'],
  },
  {
    name: 'Maçã com Aveia e Mel',
    meal_kind: 'lanche',
    description: 'Fruta com aveia e um toque de mel — energia estável.',
    prep_minutes: 5,
    tags: [TAG, 'rápida', 'vegetariana'],
    ingredients: [
      { name: 'Maçã', grams: 130 },
      { name: 'Aveia em flocos', grams: 30 },
      { name: 'Mel de abelha', grams: 10 },
    ],
    steps: ['Pique a maçã.', 'Misture com a aveia e finalize com mel e canela a gosto.'],
  },
  {
    name: 'Sanduíche Integral de Atum',
    meal_kind: 'lanche',
    description: 'Lanche proteico e prático com atum.',
    prep_minutes: 8,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Pão integral', grams: 50 },
      { name: 'Atum em água (lata)', grams: 60 },
    ],
    steps: ['Escorra o atum e tempere com um fio de azeite.', 'Monte o sanduíche no pão integral.'],
  },
  {
    name: 'Shake de Banana com Leite em Pó',
    meal_kind: 'lanche',
    description: 'Vitamina calórica prática para os intervalos.',
    prep_minutes: 5,
    tags: [TAG, 'rápida'],
    ingredients: [
      { name: 'Leite desnatado', grams: 250 },
      { name: 'Banana prata', grams: 100 },
      { name: 'Leite em pó desnatado', grams: 20 },
    ],
    steps: ['Bata todos os ingredientes no liquidificador até ficar homogêneo.'],
  },

  // ---- Jantar ----
  {
    name: 'Abóbora Cabotiá com Frango',
    meal_kind: 'jantar',
    description: 'Jantar leve e nutritivo, sem sobrecarga calórica noturna.',
    prep_minutes: 30,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Abóbora cabotian cozida', grams: 200 },
      { name: 'Peito de frango grelhado', grams: 140 },
    ],
    steps: ['Asse a abóbora cabotiá.', 'Grelhe o frango temperado.'],
  },
  {
    name: 'Inhame com Omelete e Espinafre',
    meal_kind: 'jantar',
    description: 'Inhame cozido com omelete de 3 ovos e espinafre.',
    prep_minutes: 25,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Inhame cozido', grams: 200 },
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Espinafre Nova Zelândia refogado', grams: 40 },
    ],
    steps: ['Cozinhe o inhame até ficar macio.', 'Faça a omelete com o espinafre refogado.'],
  },
  {
    name: 'Mandioquinha com Patinho e Aspargos',
    meal_kind: 'jantar',
    description: 'Recuperação muscular à noite com carboidrato de baixo IG.',
    prep_minutes: 30,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Batata baroa cozida', grams: 180 },
      { name: 'Carne bovina moída (patinho)', grams: 140 },
      { name: 'Aspargo cozido', grams: 80 },
    ],
    steps: ['Cozinhe a mandioquinha.', 'Refogue o patinho em cubos.', 'Sirva com os aspargos no vapor.'],
  },
  {
    name: 'Omelete de Cogumelos com Inhame',
    meal_kind: 'jantar',
    description: 'Omelete de cogumelos acompanhada de inhame cozido.',
    prep_minutes: 20,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Ovo cozido', grams: 150 },
      { name: 'Cogumelo Paris (champignon)', grams: 50 },
      { name: 'Inhame cozido', grams: 150 },
    ],
    steps: ['Refogue os cogumelos fatiados.', 'Faça a omelete com os cogumelos.', 'Sirva com o inhame cozido.'],
  },
  {
    name: 'Escondidinho de Mandioquinha com Carne Moída',
    meal_kind: 'jantar',
    description: 'Versão fit do escondidinho, com purê de batata-baroa.',
    prep_minutes: 35,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Batata baroa cozida', grams: 200 },
      { name: 'Carne bovina moída (patinho)', grams: 140 },
      { name: 'Queijo minas frescal', grams: 20 },
    ],
    steps: ['Amasse a mandioquinha cozida em purê.', 'Refogue a carne moída temperada.', 'Monte em camadas e gratine com o queijo.'],
  },
  {
    name: 'Sopa de Legumes com Frango Desfiado',
    meal_kind: 'jantar',
    description: 'Sopa leve e reconfortante para garantir sono profundo.',
    prep_minutes: 30,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Peito de frango grelhado', grams: 150 },
      { name: 'Cenoura cozida', grams: 60 },
      { name: 'Batata baroa cozida', grams: 80 },
      { name: 'Brócolis cozido', grams: 60 },
    ],
    steps: ['Cozinhe os legumes em caldo até ficarem macios.', 'Bata parte para engrossar, se preferir.', 'Misture o frango desfiado antes de servir.'],
  },
  {
    name: 'Abóbora Cabotiá com Tilápia',
    meal_kind: 'jantar',
    description: 'Jantar magro e de alta digestibilidade.',
    prep_minutes: 25,
    tags: [TAG, 'alto proteína'],
    ingredients: [
      { name: 'Abóbora cabotian cozida', grams: 200 },
      { name: 'Filé de tilápia grelhado', grams: 150 },
    ],
    steps: ['Asse a abóbora cabotiá.', 'Grelhe a tilápia temperada.'],
  },
]
