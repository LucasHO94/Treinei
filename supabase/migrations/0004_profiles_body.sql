-- Treinei V3.3 — perfil profissional: foto, altura, histórico de peso e fotos corporais.
-- Referência: PLANEJAMENTO-V3.md §1.7 / Fase V3.3.

-- ============ PERFIL DO USUÁRIO (1 linha por usuário) ============
create table user_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_path text,                    -- caminho no bucket 'avatars' (público)
  height_cm   numeric(5,1),            -- altura atual (cm)
  updated_at  timestamptz not null default now()
);

-- ============ HISTÓRICO DE MEDIDAS (peso ao longo do tempo) ============
create table body_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg   numeric(5,1),
  height_cm   numeric(5,1),            -- opcional; permite gráfico futuro
  created_at  timestamptz not null default now()
);
create index on body_metrics (user_id, measured_on desc);

-- ============ FOTOS DE EVOLUÇÃO CORPORAL (dado sensível — só o path aqui) ============
-- A imagem fica no bucket PRIVADO 'body-photos'; a linha guarda só a referência (LGPD).
create table body_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  taken_on     date not null default current_date,
  created_at   timestamptz not null default now()
);
create index on body_photos (user_id, taken_on desc);

-- ============ RLS ============
alter table user_profiles enable row level security;
create policy "user_profiles own" on user_profiles for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table body_metrics enable row level security;
create policy "body_metrics own" on body_metrics for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table body_photos enable row level security;
create policy "body_photos own" on body_photos for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ STORAGE: buckets + políticas ============
-- avatars: bucket público (leitura via URL pública); escrita só do dono na sua pasta.
-- body-photos: bucket privado; todo acesso via signed URL e só do dono.
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true), ('body-photos', 'body-photos', false)
  on conflict (id) do nothing;

-- Convenção de path em ambos os buckets: '{auth.uid()}/arquivo.ext'
-- (a 1ª pasta é o id do usuário → isola por dono).

create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars owner write" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars owner update" on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars owner delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "body_photos owner read" on storage.objects for select
  to authenticated
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "body_photos owner write" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "body_photos owner delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'body-photos' and (storage.foldername(name))[1] = auth.uid()::text);
