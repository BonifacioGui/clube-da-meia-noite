-- Etapa 3: fechamento semanal seguro, administração da sala e Realtime.

alter table public.profiles alter column accent set default '#5f8ee6';
alter table public.books alter column color set default '#31466f';

create or replace function public.close_week(target_room uuid, target_week date) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  goal public.weekly_goals%rowtype;
  results jsonb;
  met_count integer;
  member_count integer;
  outcome_value text;
  new_id uuid;
  local_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.is_room_member(target_room) then raise exception 'Acesso negado.'; end if;
  if extract(isodow from target_week) <> 1 then raise exception 'A semana deve começar na segunda-feira.'; end if;
  if target_week + 7 > local_today then raise exception 'A semana ainda está em andamento.'; end if;
  if exists(select 1 from public.weekly_results where room_id = target_room and week_start = target_week) then raise exception 'Esta semana já foi fechada.'; end if;

  select * into goal from public.weekly_goals where room_id = target_room and week_start = target_week;
  if goal.id is null then raise exception 'Meta semanal não encontrada.'; end if;
  select count(*) into member_count from public.room_members where room_id = target_room and left_at is null;
  if member_count <> 2 then raise exception 'A sala precisa de duas pessoas para fechar a semana.'; end if;

  select jsonb_object_agg(m.user_id::text, jsonb_build_object(
    'met', coalesce(s.days, 0) >= goal.min_days and coalesce(s.minutes, 0) >= goal.min_minutes,
    'days', coalesce(s.days, 0),
    'minutes', coalesce(s.minutes, 0)
  )) into results
  from public.room_members m
  left join lateral (
    select count(distinct read_on)::integer days, coalesce(sum(duration_minutes), 0)::integer minutes
    from public.reading_sessions rs
    where rs.room_id = target_room and rs.user_id = m.user_id
      and rs.read_on >= target_week and rs.read_on < target_week + 7
  ) s on true
  where m.room_id = target_room and m.left_at is null;

  select count(*) into met_count from jsonb_each(results) e where (e.value ->> 'met')::boolean;
  outcome_value := case when met_count = member_count then 'both_met' when met_count = 0 then 'none_met' else 'one_met' end;

  insert into public.weekly_results(room_id, week_start, goal_snapshot, member_results, outcome, closed_by)
  values (
    target_room,
    target_week,
    jsonb_build_object('min_days', goal.min_days, 'min_minutes', goal.min_minutes),
    results,
    outcome_value,
    auth.uid()
  ) returning id into new_id;

  update public.weekly_pacts set status = 'closed' where room_id = target_room and week_start = target_week;
  return new_id;
end $$;

create or replace function public.rename_room(target_room uuid, new_name text) returns void
language plpgsql security definer set search_path = public as $$
declare normalized text := trim(new_name);
begin
  if not public.is_room_owner(target_room) then raise exception 'Apenas o proprietário pode renomear o clube.'; end if;
  if char_length(normalized) not between 1 and 80 then raise exception 'O nome deve ter entre 1 e 80 caracteres.'; end if;
  update public.rooms set name = normalized where id = target_room;
end $$;

create or replace function public.revoke_room_invites(target_room uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare affected integer;
begin
  if not public.is_room_owner(target_room) then raise exception 'Apenas o proprietário pode revogar convites.'; end if;
  update public.room_invites set revoked_at = now()
    where room_id = target_room and revoked_at is null and used_at is null and expires_at > now();
  get diagnostics affected = row_count;
  return affected;
end $$;

revoke all on function public.rename_room(uuid, text) from public;
revoke all on function public.revoke_room_invites(uuid) from public;
grant execute on function public.rename_room(uuid, text) to authenticated;
grant execute on function public.revoke_room_invites(uuid) to authenticated;

-- Membros ativos continuam vendo o nome usado por ex-membros nos registros históricos.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or exists(
    select 1 from public.room_members mine
    join public.room_members theirs on theirs.room_id = mine.room_id
    where mine.user_id = auth.uid() and mine.left_at is null and theirs.user_id = profiles.id
  )
);

-- Eventos são apenas gatilhos de revalidação: o cliente sempre relê a fonte de verdade.
alter table public.profiles replica identity full;
alter table public.rooms replica identity full;
alter table public.room_members replica identity full;
alter table public.room_invites replica identity full;
alter table public.books replica identity full;
alter table public.reading_sessions replica identity full;
alter table public.weekly_goals replica identity full;
alter table public.pact_cards replica identity full;
alter table public.weekly_pacts replica identity full;
alter table public.vault_transactions replica identity full;
alter table public.weekly_results replica identity full;

do $$
declare table_name text;
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'profiles', 'rooms', 'room_members', 'room_invites', 'books', 'reading_sessions',
      'weekly_goals', 'pact_cards', 'weekly_pacts', 'vault_transactions', 'weekly_results'
    ] loop
      if not exists(
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;
