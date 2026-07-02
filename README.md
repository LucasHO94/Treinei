# Treinei — PWA de Treino + Dieta

Implementação seguindo [`PLANEJAMENTO.md`](../PLANEJAMENTO.md) (arquitetura completa, MER, roadmap).

## Status

- ✅ **Fase 0** — Bootstrap: Vite + React + TS, Tailwind v4, vite-plugin-pwa (injectManifest), design tokens, ícones placeholder.
- ✅ **Fase 1** — Fundação: migrations SQL + RLS + seed do catálogo, Dexie (offline-first com outbox), cliente Supabase + Auth scaffold, shell de navegação (Hoje/Treino/Dieta/Perfil).
- ✅ **Fase 2** — Módulo Treino: catálogo (acordeão + busca + criar exercício custom), builder de rotina (divisões, exercícios, séries planejadas), execução (inputs reais, timer de descanso em Web Worker + Wake Lock + notificação local, resumo ao concluir), histórico de sessões com placeholder de última carga.
- ✅ **Fase 3** — Módulo Dieta: CRUD de refeições (timeline cronológica), busca/criação de alimentos com cálculo de macros ao vivo, check-in diário com snapshot, metas de macros no Perfil, dashboard Hoje integrando treino do dia + próxima refeição + progresso de macros.
- 🟡 **Fase 4** (parcial) — Push remoto: VAPID gerado, `notification_schedules` sincronizado com refeições (`notify`/horário) e lembrete diário de treino configurável no Perfil, fluxo de permissão (`subscribeToPush`/`unsubscribeFromPush`) e onboarding de instalação iOS. Faltam as Edge Functions `send-push`/`notifications-cron` + `pg_cron` (dependem de um projeto Supabase real) e o teste em dispositivo iOS/Android.

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

## Pendências que dependem de você (fora do escopo de código)

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
```

## Estrutura

Ver seção 3.2 do `PLANEJAMENTO.md` — organização feature-based em `src/features/*`,
camada de dados offline-first em `src/lib/db` (Dexie) + `src/lib/sync` (outbox → Supabase),
Service Worker customizado em `src/sw/service-worker.ts`.
