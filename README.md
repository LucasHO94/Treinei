# Treinei — PWA de Treino + Dieta

Implementação seguindo [`PLANEJAMENTO.md`](../PLANEJAMENTO.md) (arquitetura completa, MER, roadmap).

## Status

- ✅ **Fase 0** — Bootstrap: Vite + React + TS, Tailwind v4, vite-plugin-pwa (injectManifest), design tokens, ícones placeholder.
- ✅ **Fase 1** — Fundação: migrations SQL + RLS + seed do catálogo, Dexie (offline-first com outbox), cliente Supabase + Auth scaffold, shell de navegação (Hoje/Treino/Dieta/Perfil).
- ✅ **Fase 2** — Módulo Treino: catálogo (acordeão + busca + criar exercício custom), builder de rotina (divisões, exercícios, séries planejadas), execução (inputs reais, timer de descanso em Web Worker + Wake Lock + notificação local, resumo ao concluir), histórico de sessões com placeholder de última carga.
- ✅ **Fase 3** — Módulo Dieta: CRUD de refeições (timeline cronológica), busca/criação de alimentos com cálculo de macros ao vivo, check-in diário com snapshot, metas de macros no Perfil, dashboard Hoje integrando treino do dia + próxima refeição + progresso de macros.
- 🟡 **Fase 4** (parcial) — Push remoto: VAPID gerado, `notification_schedules` sincronizado com refeições (`notify`/horário) e lembrete diário de treino configurável no Perfil, fluxo de permissão (`subscribeToPush`/`unsubscribeFromPush`) e onboarding de instalação iOS. Polimento feito: safe-area insets (notch/dynamic island/home indicator), code-splitting por rota, `robots.txt`, heading semântico (`h1`→`h2`), botão de fechar de diálogo com `aria-label`. Auditoria Lighthouse (mobile, `npm run preview`): Performance 95, Acessibilidade 100, Boas Práticas 100 (SEO 63 é intencional — `robots.txt` bloqueia indexação por ser um app pessoal autenticado). Faltam as Edge Functions `send-push`/`notifications-cron` + `pg_cron` (dependem de um projeto Supabase real) e o teste em dispositivo iOS/Android físico.
- ✅ **V2 Fases B/C/D/E/F** (`../PLANEJAMENTO-V2.md`) — Catálogo com **873 exercícios** PT-BR (free-exercise-db + tradução, com fotos de execução, equipamento, nível, mecânica, instruções passo a passo e objetivos derivados); base de **613 alimentos** (TACO/UNICAMP com 16 categorias); redesign do catálogo (grupos com foto hero, grade 2 colunas com crossfade animado, seleção múltipla com contador, overlay fullscreen de execução); dashboard Hoje com card hero do treino; skeletons + microinterações (Motion); substituição de alimento por equivalência de macros.
- ✅ **V3** (`../PLANEJAMENTO-V3.md`) — Fix da mídia cortada no overlay; quantidade de alimentos editável em **gramas** (refeição e substituição); **execução guiada** do treino (toque único conclui a série com valores pré-preenchidos, timers de descanso simultâneos por exercício com chip inline + notificação nomeada, scroll automático ao concluir um bloco, tempo por exercício no histórico); **compartilhamento social** pós-treino (card gerado em Canvas + foto opcional + texto pronto via Web Share API, com fallback de download); **gerador de treino por objetivo** (motor de regras sobre objetivo/região/nível/dias/equipamento, splits reconhecidos, substituto por exercício, cria rotina real editável); **~60 receitas curadas** (10 por categoria) com ingredientes mapeados ao catálogo TACO (macros sempre corretos) e aplicação direta numa refeição.
- ✅ **V3.2 — Auth multiusuário (código):** login/cadastro/recuperação por e-mail+senha (`/entrar`, `/recuperar-senha`), gate de rotas, modo convidado ("Experimentar sem conta"), **migração convidado→conta** no 1º login (re-chaveia dados locais + push completo em ordem de FK), pull inicial por usuário (dispositivo novo), logout que isola contas no aparelho. Seed SQL do catálogo nativo gerado (`supabase/seed/catalog_full.sql`), `vercel.json` (SPA + headers de SW). **Falta o owner rodar a infra** — ver `../SETUP-SUPABASE-VERCEL.md`.
- ✅ **V3.3 — Perfil profissional (código):** cabeçalho com avatar (bucket `avatars`), nome e altura editáveis, peso atual; histórico de peso (`body_metrics`); galeria de **fotos de evolução** em bucket privado (`body-photos`) via signed URL, com excluir. Migration `0004_profiles_body.sql` (tabelas + RLS + buckets). Depende da infra da V3.2.

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com seu projeto Supabase
npm run dev
```

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Copie `Project URL` e `anon public key` para `.env.local`.
3. Aplique as migrations (via Supabase CLI ou colando no SQL Editor do Studio, nesta ordem):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/seed/0001_muscle_groups_exercises.sql`
   - `supabase/seed/0002_foods.sql`
4. Gere os tipos (opcional, requer Supabase CLI instalado):
   ```bash
   supabase gen types typescript --project-id <seu-project-id> > src/types/supabase.ts
   ```

## Notas de arquitetura (Fase 2)

- **Catálogo embutido no app** (`src/lib/db/local-seed.ts`) — os mesmos ~50 exercícios e 12 grupos musculares das migrations SQL são semeados localmente no Dexie no primeiro load (`ensureLocalSeed`), com os **mesmos IDs fixos** usados no seed do Supabase. Assim o catálogo funciona 100% offline sem backend configurado, e quando você conectar um projeto Supabase real os IDs batem (sem duplicar exercícios nem quebrar referências de `workout_exercises`).
- **Usuário local** (`src/lib/auth/current-user.ts`) — como ainda não há tela de login, rotinas/sessões são gravadas sob um UUID persistido em `localStorage`. Uma sessão Supabase real (quando existir) tem prioridade automaticamente.

## Notas de arquitetura (Fase 3)

- **Alimentos**: mesmo esquema de seed local com IDs fixos usado no catálogo de exercícios (`LOCAL_FOODS` em `local-seed.ts`), com busca full-text local e criação de alimento personalizado (`is_custom` + `owner_id`).
- **Macros** (`src/features/diet/lib/macros.ts`) — funções puras (`scaleMacros`, `sumMacros`, `mealItemsMacros`, `mealLogsMacros`) usadas tanto na tela de edição da refeição (macros ao vivo por item) quanto no resumo do dia (soma dos snapshots de `meal_logs`).
- **Check-in idempotente**: `logMeal()` faz upsert por `(meal_id, log_date)` — repetir o check-in no mesmo dia atualiza o snapshot em vez de duplicar; útil se o usuário editar os itens da refeição depois de já ter marcado "Comi".
- **`nutrition_goals`** tem `user_id` como chave primária (sem campo `id`), então não se encaixa na assinatura genérica de `mutate()` — grava direto no Dexie + outbox em `setNutritionGoals()` (ver `src/features/diet/lib/actions.ts`). Só faz insert/update, nunca delete (o `drainOutbox` assume uma coluna `id` no delete, que essa tabela não tem — se um dia for necessário deletar metas, ajustar o sync engine primeiro).
- **Dashboard Hoje**: sugere a divisão de treino do dia comparando `workout.weekday` com o dia da semana atual, com fallback para a primeira divisão da primeira rotina (ainda não há UI para configurar o weekday de cada divisão — fica para quando a Fase 4 adicionar lembretes de treino por dia).

## Notas de arquitetura (Fase 4 — parcial)

- **`notification_schedules` espelha o domínio, não o contrário** — `createMeal`/`updateMeal`/`deleteMeal` (`src/features/diet/lib/actions.ts`) chamam `upsertMealSchedule`/`deleteMealSchedule` (`src/features/notifications/lib/actions.ts`) sempre que `notify`/`scheduled_at` mudam. Assim o backend (quando existir) só precisa ler `notification_schedules` — não precisa conhecer a tabela `meals`. O checkbox "Notificar" já existente em `meal-detail-page.tsx` (Fase 3) agora aciona essa sincronização.
- **Lembrete de treino é um registro único por usuário** (`kind='workout_reminder'`, `ref_id=null`) — horário + dias da semana configuráveis no Perfil (`WorkoutReminderCard`). O conteúdo da notificação ("Hoje é dia de Treino B") é resolvido pelo backend cruzando o dia atual com `workouts.weekday`, não fica armazenado aqui.
- **`PushPermissionCard`** (`src/features/notifications/push-permission-card.tsx`) só habilita o botão "Ativar notificações" quando `isSupabaseConfigured` é verdadeiro — sem backend real não há onde persistir a subscription, então a UI comunica isso em vez de tentar e falhar silenciosamente.
- **Onboarding de instalação iOS** (`src/features/notifications/onboarding/ios-install-card.tsx`) detecta iOS Safari fora do modo standalone via user-agent + `matchMedia('(display-mode: standalone)')` e mostra o tutorial "Compartilhar → Adicionar à Tela de Início" — só aparece quando realmente necessário (RF17/18).
- **Code-splitting por rota** (`src/app/router.tsx`) — só a página `Hoje` (index) entra no bundle inicial; as demais usam `React.lazy` + um único `Suspense` no `AppLayout` envolvendo o `Outlet`. Reduziu o maior chunk de ~712 kB para ~340 kB e subiu o Performance do Lighthouse de 92 para 95.
- **`robots.txt` bloqueia indexação de propósito** (`Disallow: /`) — é um app pessoal autenticado, não uma página pública; isso derruba o score de SEO do Lighthouse (63), o que é o comportamento correto, não um bug a corrigir.

## Notas de arquitetura (V2 — catálogo expandido)

- **Catálogo fora do bundle**: os ~873 exercícios + ~613 alimentos vivem em `public/data/exercises.json` / `public/data/foods.json` (gerados por `scripts/import-exercises.mjs` / `scripts/import-foods.mjs`), hidratados no Dexie via fetch com controle de versão (`ensure-seed.ts`, chave `treinei-catalog-version`). Os JSONs entram no precache do SW (glob `json` no vite.config) — offline total após instalar o PWA. O seed V1 embutido virou fallback para primeiro load offline.
- **IDs preservados**: os 50 exercícios e 30 alimentos do seed V1 mantêm seus UUIDs (rotinas/refeições existentes nunca quebram). 50 deles foram casados manualmente com o dataset (`LEGACY_MATCH` no script) e herdaram mídia/instruções; os equivalentes do dataset não são importados de novo. Novos registros usam **UUID v5 determinístico** (namespace fixo) — reimportar gera sempre os mesmos IDs, que baterão com o seed SQL do Supabase.
- **Mídia de execução**: 2 fotos por exercício (início/fim do movimento, domínio público do free-exercise-db) com **crossfade CSS** simulando o vídeo em loop do app de referência (`ExerciseMedia` + keyframes em `index.css`, com `prefers-reduced-motion`). URLs resolvidas por `exerciseImageUrl()` (`src/lib/catalog/media.ts`) — trocar a base para Supabase Storage no futuro é 1 linha. Cache offline via rota CacheFirst do SW.
- **Substituição de alimentos** (`findSubstitutes`/`equivalentQuantity` em `macros.ts`): mesma categoria, kcal/100g ±25%, ordenação por distância de kcal+proteína; a troca ajusta a quantidade para manter as calorias do item (múltiplos de 0.25 porção).
- **Listas longas**: células/rows usam `content-visibility: auto` + `contain-intrinsic-size` (virtualização nativa do browser) — suficiente para os volumes atuais; TanStack Virtual fica para quando a TBCA (~5.500 alimentos) entrar.
- **Receitas**: schema completo (`0003_recipes.sql`: recipes/recipe_items/recipe_requests + RLS) e stores Dexie v3 prontos; ainda fora de `SYNCED_TABLES` até o conteúdo/CRUD ganharem sync com o Supabase (V3.2).

## Notas de arquitetura (V3)

- **Gramas editáveis** (`gramsForQuantity`/`quantityForGrams`/`formatFoodQuantity` em `macros.ts`): o modelo de dados não mudou (`MealItem.quantity` continua sendo o multiplicador de porção) — só a camada de apresentação passou a converter para/de gramas quando `food.portion_grams` existe. Alimentos sem peso de porção conhecido (ex.: "1 fatia") continuam editáveis por porções.
- **Timers de descanso simultâneos** (`use-exercise-timers.ts` + `rest-timer-worker.ts`): o worker mantém um `Map<key, targetTimestamp>` em vez de um único timer — cada `workout_exercise_id` tem seu próprio countdown independente, todos no mesmo Web Worker (RF14 original preservado: nunca confia em tempo decorrido, sempre recalcula `target - now`). Permite avançar de exercício com o descanso do anterior ainda rodando.
- **Card de compartilhamento** (`share-card.ts` + `share-workout-sheet.tsx`): desenhado em Canvas 2D puro (sem lib de imagem), com foto do usuário opcional como fundo (`URL.createObjectURL` do `<input capture>`). Publicação via `navigator.share` com `files` — não existe API direta de publicação em rede social para apps web pessoais (exigiria app business aprovado pela Meta); fallback de baixar PNG + copiar texto quando `share`/`canShare` não estão disponíveis (ex.: desktop).
- **Gerador de treino** (`features/workout/generator/engine.ts`): motor puro e testável, sem IA — splits reconhecidos (full body/superior-inferior/push-pull-legs/ABCD/especialização) mapeados para os 12 `muscle_groups`, parâmetros de série/reps/descanso por objetivo (média ponderada quando múltiplos objetivos selecionados), pontuação de exercícios por `goals`/mecânica. "Usar este treino" grava uma `Routine` real via as mesmas actions do builder manual.
- **Receitas curadas** (`scripts/build-recipes.mjs`): cada receita referencia alimentos existentes do catálogo por nome exato — os macros são somados automaticamente a partir do TACO, nunca digitados à mão. Preparo é 100% autoral (sem raspagem de site de receita, que teria risco de direito autoral sobre o texto). Script valida a faixa de kcal esperada por categoria antes de gravar `public/data/recipes.json`. Base atual: **60 receitas** (10/categoria) — ampliar para as ~240 do plano original é só adicionar entradas ao array `RECIPES` e rodar `node scripts/build-recipes.mjs` de novo, sem mudança de código.

## Notas de arquitetura (V3.2 / V3.3 — multiusuário e perfil)

- **Gate de rotas** (`app/protected-shell.tsx`): sem sessão e sem modo convidado → `/entrar`. Sem Supabase configurado, o app abre direto (fallback offline-first, comportamento pré-V3.2). `useCurrentUserId` já prioriza `session.user.id` e cai no id de convidado local quando deslogado.
- **Migração convidado→conta** (`lib/auth/migrate-guest.ts`): ao logar, o id efetivo muda do convidado para o do Supabase — sem migração, os dados locais (chaveados pelo convidado) sumiriam da UI e seriam rejeitados pelo RLS. A migração re-chaveia as linhas no Dexie, **descarta a outbox antiga** (payloads com id de convidado falhariam o `with check`) e re-enfileira um **push completo em ordem de dependência (FK)**. Idempotente por conta (marca em `localStorage`).
- **Catálogo nativo x sync**: o catálogo (exercícios/alimentos/receitas nativos) é hidratado do JSON local, **não** é puxado do servidor (`pullAll` filtra exercises/foods por `owner_id` = só os custom do usuário). Mas ele **precisa existir no Postgres** para as FKs dos dados do usuário — por isso o `scripts/build-supabase-seed.mjs` gera `supabase/seed/catalog_full.sql` (colunas base) para o owner rodar uma vez.
- **Perfil (V3.3)**: `user_profiles` é chaveado por `user_id` (mesmo padrão de `nutrition_goals` — grava direto Dexie+outbox). Peso é série temporal em `body_metrics`. Fotos corporais são **dado sensível**: bucket **privado** `body-photos`, exibidas por **signed URL** de curta duração; o avatar fica no bucket **público** `avatars`. Convenção de path `{user_id}/arquivo` isola por dono no Storage (RLS em `storage.objects`, migration `0004`).

## Pendências que dependem de você (fora do escopo de código)

- **Rodar a infra Supabase + Vercel** — SQL das migrations + seed, Auth, Storage e envs do deploy. Passo a passo em `../SETUP-SUPABASE-VERCEL.md`. É o único bloqueio para a V3.2/V3.3 funcionarem em produção; o código já está pronto e verificado no localhost (gate, cadastro/login, convidado, perfil).

- **Conta/projeto Supabase real** — não é possível criar programaticamente; siga o passo acima. Bloqueia as Edge Functions `send-push`/`notifications-cron` e o `pg_cron` da Fase 4 (o app já grava tudo localmente em `notification_schedules`, só falta o backend enviar).
- **Chave privada VAPID** — já gerada nesta sessão, guarde-a com você (não fica salva no repo); ela vira secret da Edge Function `send-push` quando o projeto Supabase existir. A pública já está em `.env.local`.
- **Ícones finais e GIFs de exercícios** — os ícones em `public/icons/` são placeholders gerados por `scripts/generate-icons.mjs`. Os GIFs/ilustrações de execução de exercício (`exercises.media_url`) precisam vir de um banco licenciado (ex.: ExerciseDB) ou de produção própria — **nunca reaproveitar assets do app de referência**, por questão de direitos autorais.
- **Base completa de alimentos (TACO)** — `supabase/seed/0002_foods.sql` tem ~30 itens comuns; a tabela TACO completa (~500 itens) fica para a Fase 3.
- **Teste real em dispositivo iOS (≥16.4)** — instalação na Tela de Início e push só podem ser validados em hardware real, não em simulador de navegador.

## Scripts

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # typecheck + build de produção
npm run preview   # servir o build de produção localmente
npm run lint       # oxlint
node scripts/generate-icons.mjs   # regenerar ícones placeholder do manifest
node scripts/build-recipes.mjs    # regenerar public/data/recipes.json a partir da base curada
node scripts/build-supabase-seed.mjs  # gerar supabase/seed/catalog_full.sql (catálogo nativo p/ o Supabase)
```

## Estrutura

Ver seção 3.2 do `PLANEJAMENTO.md` — organização feature-based em `src/features/*`,
camada de dados offline-first em `src/lib/db` (Dexie) + `src/lib/sync` (outbox → Supabase),
Service Worker customizado em `src/sw/service-worker.ts`.
