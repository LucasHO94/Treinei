-- Treinei — Row Level Security
-- Referência: PLANEJAMENTO.md, seção 2.3

-- ============ Catálogo global (muscle_groups): leitura livre p/ autenticados ============
alter table muscle_groups enable row level security;
create policy "muscle_groups read" on muscle_groups for select
  to authenticated using (true);

-- ============ exercises: nativos visíveis a todos; custom só ao dono ============
alter table exercises enable row level security;

create policy "exercises read catalog or own" on exercises for select
  to authenticated using (is_custom = false or owner_id = auth.uid());

create policy "exercises insert own" on exercises for insert
  to authenticated with check (is_custom = true and owner_id = auth.uid());

create policy "exercises update own" on exercises for update
  to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "exercises delete own" on exercises for delete
  to authenticated using (owner_id = auth.uid());

-- ============ routines: dono direto ============
alter table routines enable row level security;
create policy "routines own" on routines for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ workouts: dono via routines ============
alter table workouts enable row level security;
create policy "workouts own via routine" on workouts for all
  to authenticated
  using (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));

-- ============ workout_exercises: dono via workouts -> routines ============
alter table workout_exercises enable row level security;
create policy "workout_exercises own" on workout_exercises for all
  to authenticated
  using (exists (
    select 1 from workouts w join routines r on r.id = w.routine_id
    where w.id = workout_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workouts w join routines r on r.id = w.routine_id
    where w.id = workout_id and r.user_id = auth.uid()
  ));

-- ============ planned_sets: dono via workout_exercises -> workouts -> routines ============
alter table planned_sets enable row level security;
create policy "planned_sets own" on planned_sets for all
  to authenticated
  using (exists (
    select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      join routines r on r.id = w.routine_id
    where we.id = workout_exercise_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_exercises we
      join workouts w on w.id = we.workout_id
      join routines r on r.id = w.routine_id
    where we.id = workout_exercise_id and r.user_id = auth.uid()
  ));

-- ============ workout_sessions / session_sets: dono direto / via sessão ============
alter table workout_sessions enable row level security;
create policy "workout_sessions own" on workout_sessions for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table session_sets enable row level security;
create policy "session_sets own" on session_sets for all
  to authenticated
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- ============ foods: nativos visíveis a todos; custom só ao dono (mesmo padrão de exercises) ============
alter table foods enable row level security;

create policy "foods read catalog or own" on foods for select
  to authenticated using (is_custom = false or owner_id = auth.uid());

create policy "foods insert own" on foods for insert
  to authenticated with check (is_custom = true and owner_id = auth.uid());

create policy "foods update own" on foods for update
  to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "foods delete own" on foods for delete
  to authenticated using (owner_id = auth.uid());

-- ============ meals / meal_items / meal_logs ============
alter table meals enable row level security;
create policy "meals own" on meals for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table meal_items enable row level security;
create policy "meal_items own via meal" on meal_items for all
  to authenticated
  using (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()));

alter table meal_logs enable row level security;
create policy "meal_logs own" on meal_logs for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ nutrition_goals ============
alter table nutrition_goals enable row level security;
create policy "nutrition_goals own" on nutrition_goals for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ push_subscriptions / notification_schedules ============
alter table push_subscriptions enable row level security;
create policy "push_subscriptions own" on push_subscriptions for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table notification_schedules enable row level security;
create policy "notification_schedules own" on notification_schedules for all
  to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
