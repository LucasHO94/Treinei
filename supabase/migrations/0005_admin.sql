-- Treinei — Painel de gestor (v1): promover conta, listar usuários, habilitar/desabilitar,
-- limpar histórico e excluir conta. Todas as ações passam por funções SECURITY DEFINER que
-- verificam is_admin() internamente — o cliente nunca recebe a service role key.

-- ============ ROLE ============
alter table user_profiles add column if not exists role text not null default 'user'
  check (role in ('user', 'admin'));

-- ============ is_admin(): usada nas funções abaixo (SECURITY DEFINER evita recursão de RLS) ============
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from user_profiles where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;

-- ============ admin_list_users(): visão consolidada p/ o painel ============
create or replace function admin_list_users()
returns table (
  user_id                 uuid,
  email                   text,
  created_at              timestamptz,
  last_sign_in_at         timestamptz,
  banned_until            timestamptz,
  full_name               text,
  avatar_path             text,
  role                    text,
  routines_count          bigint,
  workout_sessions_count  bigint,
  meals_count             bigint,
  meal_logs_count         bigint,
  last_activity           timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not is_admin() then
    raise exception 'apenas administradores podem executar esta ação';
  end if;

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until,
    p.full_name,
    p.avatar_path,
    coalesce(p.role, 'user'),
    (select count(*) from routines r where r.user_id = u.id),
    (select count(*) from workout_sessions s where s.user_id = u.id),
    (select count(*) from meals m where m.user_id = u.id),
    (select count(*) from meal_logs l where l.user_id = u.id),
    greatest(
      (select max(s.started_at) from workout_sessions s where s.user_id = u.id),
      (select max(l.eaten_at) from meal_logs l where l.user_id = u.id)
    )
  from auth.users u
  left join user_profiles p on p.user_id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function admin_list_users() from public;
grant execute on function admin_list_users() to authenticated;

-- ============ admin_set_user_banned(): habilitar/desabilitar login ============
-- Usa auth.users.banned_until (mesmo mecanismo da Admin API do Supabase), sem precisar
-- da service role key: escrevemos direto na tabela via função SECURITY DEFINER.
create or replace function admin_set_user_banned(target_user_id uuid, banned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'apenas administradores podem executar esta ação';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'não é possível desabilitar a própria conta';
  end if;

  update auth.users
  set banned_until = case when banned then timestamptz '2099-12-31 23:59:59+00' else null end
  where id = target_user_id;
end;
$$;

revoke all on function admin_set_user_banned(uuid, boolean) from public;
grant execute on function admin_set_user_banned(uuid, boolean) to authenticated;

-- ============ admin_clear_user_history(): apaga histórico de treinos/dieta/peso ============
-- Mantém rotinas/refeições configuradas e perfil; limpa só o HISTÓRICO (execuções, check-ins,
-- medidas de peso). Fotos de evolução ficam fora (arquivo no Storage exige limpeza à parte).
create or replace function admin_clear_user_history(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'apenas administradores podem executar esta ação';
  end if;

  delete from workout_sessions where user_id = target_user_id; -- cascade em session_sets
  delete from meal_logs where user_id = target_user_id;
  delete from body_metrics where user_id = target_user_id;
end;
$$;

revoke all on function admin_clear_user_history(uuid) from public;
grant execute on function admin_clear_user_history(uuid) to authenticated;

-- ============ admin_delete_user(): exclui a conta e todos os dados (cascade) ============
-- Não remove arquivos do Storage (avatars/body-photos) — ficam órfãos no bucket, aceitável
-- para v1 (pode ser resolvido depois com uma Edge Function se necessário).
create or replace function admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'apenas administradores podem executar esta ação';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'não é possível excluir a própria conta';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function admin_delete_user(uuid) from public;
grant execute on function admin_delete_user(uuid) to authenticated;
