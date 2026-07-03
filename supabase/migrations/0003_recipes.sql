-- V2 Fase E: receitas sugeridas (espaço preparado; conteúdo entra na V2.1).
-- Receitas nativas (owner_id null) são curadoria global; is_custom=true são do usuário.

create table recipes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  meal_kind    text not null check (meal_kind in ('cafe','almoco','jantar','lanche','pre_treino','pos_treino')),
  description  text,
  image_url    text,
  servings     smallint not null default 1,
  prep_minutes smallint,
  source       text,                          -- crédito/origem da receita
  is_custom    boolean not null default false,
  owner_id     uuid references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  constraint custom_recipe_needs_owner check (is_custom = false or owner_id is not null)
);
create index on recipes (meal_kind);

create table recipe_items (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  food_id   uuid not null references foods(id),
  quantity  numeric(7,2) not null default 1   -- multiplicador da porção do alimento
);
create index on recipe_items (recipe_id);

-- Pedidos de receita dos usuários (CTA "Sugerir receita") — insumo de priorização.
create table recipe_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  meal_kind  text,
  note       text,
  created_at timestamptz not null default now()
);

-- RLS
alter table recipes enable row level security;
create policy "read native or own recipes" on recipes for select
  using (is_custom = false or owner_id = auth.uid());
create policy "insert own recipes" on recipes for insert
  with check (is_custom = true and owner_id = auth.uid());
create policy "update own recipes" on recipes for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own recipes" on recipes for delete
  using (owner_id = auth.uid());

alter table recipe_items enable row level security;
create policy "read items of visible recipes" on recipe_items for select
  using (exists (select 1 from recipes r where r.id = recipe_id and (r.is_custom = false or r.owner_id = auth.uid())));
create policy "write items of own recipes" on recipe_items for all
  using (exists (select 1 from recipes r where r.id = recipe_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from recipes r where r.id = recipe_id and r.owner_id = auth.uid()));

alter table recipe_requests enable row level security;
create policy "own requests" on recipe_requests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
