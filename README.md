# Treinei — PWA de Treino + Dieta

Implementação seguindo [`PLANEJAMENTO.md`](../PLANEJAMENTO.md) (arquitetura completa, MER, roadmap).

## Status

- ✅ **Fase 0** — Bootstrap: Vite + React + TS, Tailwind v4, vite-plugin-pwa (injectManifest), design tokens, ícones placeholder.
- ✅ **Fase 1** — Fundação: migrations SQL + RLS + seed do catálogo, Dexie (offline-first com outbox), cliente Supabase + Auth scaffold, shell de navegação (Hoje/Treino/Dieta/Perfil).
- ⬜ **Fase 2** — Módulo Treino (catálogo, builder, execução com timer, histórico).
- ⬜ **Fase 3** — Módulo Dieta (refeições, alimentos, check-in, metas).
- ⬜ **Fase 4** — Push remoto (Edge Functions + pg_cron), polimento iOS/Android.

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

## Pendências que dependem de você (fora do escopo de código)

- **Conta/projeto Supabase real** — não é possível criar programaticamente; siga o passo acima.
- **Chaves VAPID para Web Push** (Fase 4) — gerar com `npx web-push generate-vapid-keys`; a pública vai em `VITE_VAPID_PUBLIC_KEY`, a privada é um secret da Edge Function.
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
