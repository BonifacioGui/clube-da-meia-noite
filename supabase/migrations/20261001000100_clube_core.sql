-- Clube da Meia-Noite: schema inicial multiusuário.
-- Execute com `supabase db push` ou cole no SQL Editor de um projeto novo.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  avatar_url text,
  accent text not null default '#d69b54' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, user_id),
  check ((role = 'owner') or role = 'member')
);
create unique index room_members_one_active_room_per_user on public.room_members(user_id) where left_at is null;
create index room_members_active_room_idx on public.room_members(room_id) where left_at is null;

create table public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token_hash bytea not null unique,
  created_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  used_at timestamptz,
  used_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index room_invites_room_idx on public.room_invites(room_id, created_at desc);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  owner_id uuid not null,
  title text not null check (char_length(trim(title)) between 1 and 180),
  author text not null default '',
  current_page integer not null default 0 check (current_page >= 0),
  total_pages integer not null default 0 check (total_pages >= 0 and (total_pages = 0 or current_page <= total_pages)),
  status text not null default 'want_to_read' check (status in ('want_to_read', 'reading', 'completed')),
  color text not null default '#744d62' check (color ~ '^#[0-9a-fA-F]{6}$'),
  completed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (room_id, owner_id) references public.room_members(room_id, user_id) on delete restrict
);
create unique index books_one_current_per_member on public.books(room_id, owner_id) where status = 'reading';
create index books_room_owner_idx on public.books(room_id, owner_id, created_at desc);

create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  book_id uuid not null references public.books(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  read_on date not null,
  start_page integer check (start_page is null or start_page >= 0),
  end_page integer check (end_page is null or end_page >= 0),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  foreign key (room_id, user_id) references public.room_members(room_id, user_id) on delete restrict,
  check (ended_at >= started_at),
  check (start_page is null or end_page is null or end_page >= start_page)
);
create index reading_sessions_room_date_idx on public.reading_sessions(room_id, read_on desc);
create index reading_sessions_user_date_idx on public.reading_sessions(user_id, read_on desc);

create table public.weekly_goals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  week_start date not null,
  min_days integer not null check (min_days between 1 and 7),
  min_minutes integer not null check (min_minutes between 1 and 10080),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, week_start),
  check (extract(isodow from week_start) = 1)
);

-- Cards são extensíveis: `kind` não é enum rígido e `metadata` aceita novos formatos.
create table public.pact_cards (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  kind text not null check (char_length(trim(kind)) between 1 and 40),
  title text not null check (char_length(trim(title)) between 1 and 180),
  description text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pact_cards_room_idx on public.pact_cards(room_id, kind) where active;

create table public.weekly_pacts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  week_start date not null,
  status text not null default 'active' check (status in ('draft', 'active', 'closed')),
  elements jsonb not null default '[]'::jsonb check (jsonb_typeof(elements) = 'array'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, week_start),
  check (extract(isodow from week_start) = 1)
);

create table public.vault_transactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount <> 0),
  reason text not null check (char_length(trim(reason)) between 1 and 180),
  occurred_on date not null,
  created_at timestamptz not null default now()
);
create index vault_transactions_room_idx on public.vault_transactions(room_id, occurred_on desc, created_at desc);

create table public.weekly_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  week_start date not null,
  goal_snapshot jsonb not null check (jsonb_typeof(goal_snapshot) = 'object'),
  member_results jsonb not null check (jsonb_typeof(member_results) = 'object'),
  outcome text not null check (outcome in ('both_met', 'one_met', 'none_met')),
  closed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (room_id, week_start),
  check (extract(isodow from week_start) = 1)
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, achievement_key)
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger rooms_updated before update on public.rooms for each row execute function public.set_updated_at();
create trigger books_updated before update on public.books for each row execute function public.set_updated_at();
create trigger weekly_goals_updated before update on public.weekly_goals for each row execute function public.set_updated_at();
create trigger pact_cards_updated before update on public.pact_cards for each row execute function public.set_updated_at();
create trigger weekly_pacts_updated before update on public.weekly_pacts for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_room_member(target_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.room_members m where m.room_id = target_room and m.user_id = auth.uid() and m.left_at is null)
$$;
create or replace function public.is_room_owner(target_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.rooms r where r.id = target_room and r.owner_id = auth.uid())
$$;

create or replace function public.enforce_room_capacity() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.left_at is null and (select count(*) from public.room_members where room_id = new.room_id and left_at is null and user_id <> new.user_id) >= 2 then
    raise exception 'A sala já possui duas pessoas.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger room_capacity before insert or update of left_at on public.room_members for each row execute function public.enforce_room_capacity();

create or replace function public.create_room(room_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_room uuid;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if exists(select 1 from public.room_members where user_id = auth.uid() and left_at is null) then raise exception 'Você já participa de uma sala.'; end if;
  insert into public.rooms(name, owner_id) values (trim(room_name), auth.uid()) returning id into new_room;
  insert into public.room_members(room_id, user_id, role) values (new_room, auth.uid(), 'owner');
  insert into public.weekly_goals(room_id, week_start, min_days, min_minutes, created_by)
    values (new_room, date_trunc('week', now() at time zone 'America/Sao_Paulo')::date, 4, 120, auth.uid());
  insert into public.weekly_pacts(room_id, week_start, created_by)
    values (new_room, date_trunc('week', now() at time zone 'America/Sao_Paulo')::date, auth.uid());
  return new_room;
end $$;

create or replace function public.create_room_invite(target_room uuid)
returns table(token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare raw_token text := encode(gen_random_bytes(32), 'hex'); expiry timestamptz := now() + interval '7 days';
begin
  if not public.is_room_owner(target_room) then raise exception 'Apenas o proprietário pode convidar.'; end if;
  if (select count(*) from public.room_members where room_id = target_room and left_at is null) >= 2 then raise exception 'A sala já está completa.'; end if;
  update public.room_invites set revoked_at = now() where room_id = target_room and revoked_at is null and used_at is null;
  insert into public.room_invites(room_id, token_hash, created_by, expires_at)
    values (target_room, digest(raw_token, 'sha256'), auth.uid(), expiry);
  return query select raw_token, expiry;
end $$;

create or replace function public.join_room_by_invite(raw_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare invite public.room_invites%rowtype; member_count integer;
begin
  if auth.uid() is null then raise exception 'Autenticação necessária.'; end if;
  if exists(select 1 from public.room_members where user_id = auth.uid() and left_at is null) then raise exception 'Você já participa de uma sala.'; end if;
  select * into invite from public.room_invites
    where token_hash = digest(raw_token, 'sha256') and revoked_at is null and used_at is null and expires_at > now()
    for update;
  if invite.id is null then raise exception 'Convite inválido, expirado ou já utilizado.'; end if;
  perform 1 from public.rooms where id = invite.room_id for update;
  select count(*) into member_count from public.room_members where room_id = invite.room_id and left_at is null;
  if member_count >= 2 then raise exception 'A sala já está completa.'; end if;
  insert into public.room_members(room_id, user_id, role) values (invite.room_id, auth.uid(), 'member')
    on conflict (room_id, user_id) do update set left_at = null, joined_at = now(), role = 'member';
  update public.room_invites set used_at = now(), used_by = auth.uid() where id = invite.id;
  if member_count + 1 >= 2 then update public.room_invites set revoked_at = now() where room_id = invite.room_id and used_at is null and revoked_at is null; end if;
  return invite.room_id;
end $$;

create or replace function public.leave_room(target_room uuid, transfer_to uuid default null) returns void
language plpgsql security definer set search_path = public as $$
declare room_owner uuid; active_members integer;
begin
  select owner_id into room_owner from public.rooms where id = target_room for update;
  if not public.is_room_member(target_room) then raise exception 'Você não participa desta sala.'; end if;
  select count(*) into active_members from public.room_members where room_id = target_room and left_at is null;
  if room_owner = auth.uid() and active_members > 1 then
    if transfer_to is null or not exists(select 1 from public.room_members where room_id = target_room and user_id = transfer_to and left_at is null and user_id <> auth.uid()) then
      raise exception 'Transfira a propriedade antes de sair.';
    end if;
    update public.rooms set owner_id = transfer_to where id = target_room;
    update public.room_members set role = 'owner' where room_id = target_room and user_id = transfer_to;
  end if;
  update public.room_members set left_at = now(), role = 'member' where room_id = target_room and user_id = auth.uid();
end $$;

create or replace function public.record_reading_session(
  target_book uuid, session_started_at timestamptz, session_ended_at timestamptz,
  session_start_page integer default null, session_end_page integer default null, session_note text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare b public.books%rowtype; tz text; new_id uuid; minutes integer;
begin
  select * into b from public.books where id = target_book for update;
  if b.id is null or b.owner_id <> auth.uid() or not public.is_room_member(b.room_id) then raise exception 'Livro inválido.'; end if;
  if session_ended_at < session_started_at then raise exception 'Horário final inválido.'; end if;
  minutes := greatest(1, ceil(extract(epoch from (session_ended_at - session_started_at)) / 60.0)::integer);
  if minutes > 1440 then raise exception 'Sessão longa demais.'; end if;
  select timezone into tz from public.profiles where id = auth.uid();
  insert into public.reading_sessions(room_id, user_id, book_id, started_at, ended_at, duration_minutes, read_on, start_page, end_page, note)
    values (b.room_id, auth.uid(), b.id, session_started_at, session_ended_at, minutes, (session_ended_at at time zone coalesce(tz, 'America/Sao_Paulo'))::date, session_start_page, session_end_page, nullif(trim(session_note), '')) returning id into new_id;
  if session_end_page is not null then
    update public.books set current_page = greatest(current_page, least(case when total_pages > 0 then total_pages else session_end_page end, session_end_page)),
      status = case when total_pages > 0 and session_end_page >= total_pages then 'completed' else status end,
      completed_at = case when total_pages > 0 and session_end_page >= total_pages then (session_ended_at at time zone coalesce(tz, 'America/Sao_Paulo'))::date else completed_at end
      where id = b.id;
  end if;
  return new_id;
end $$;

create or replace function public.close_week(target_room uuid, target_week date) returns uuid
language plpgsql security definer set search_path = public as $$
declare goal public.weekly_goals%rowtype; results jsonb; met_count integer; member_count integer; outcome_value text; new_id uuid;
begin
  if not public.is_room_member(target_room) then raise exception 'Acesso negado.'; end if;
  if extract(isodow from target_week) <> 1 then raise exception 'A semana deve começar na segunda-feira.'; end if;
  select * into goal from public.weekly_goals where room_id = target_room and week_start = target_week;
  if goal.id is null then raise exception 'Meta semanal não encontrada.'; end if;
  select count(*) into member_count from public.room_members where room_id = target_room and left_at is null;
  if member_count <> 2 then raise exception 'A sala precisa de duas pessoas para fechar a semana.'; end if;
  select jsonb_object_agg(m.user_id::text, jsonb_build_object('met', coalesce(s.days,0) >= goal.min_days and coalesce(s.minutes,0) >= goal.min_minutes, 'days', coalesce(s.days,0), 'minutes', coalesce(s.minutes,0)))
  into results from public.room_members m left join lateral (
    select count(distinct read_on)::integer days, coalesce(sum(duration_minutes),0)::integer minutes from public.reading_sessions rs
    where rs.room_id = target_room and rs.user_id = m.user_id and rs.read_on >= target_week and rs.read_on < target_week + 7
  ) s on true where m.room_id = target_room and m.left_at is null;
  select count(*) into met_count from jsonb_each(results) e where (e.value ->> 'met')::boolean;
  outcome_value := case when met_count = member_count then 'both_met' when met_count = 0 then 'none_met' else 'one_met' end;
  insert into public.weekly_results(room_id, week_start, goal_snapshot, member_results, outcome, closed_by)
    values (target_room, target_week, jsonb_build_object('min_days', goal.min_days, 'min_minutes', goal.min_minutes), results, outcome_value, auth.uid()) returning id into new_id;
  update public.weekly_pacts set status = 'closed' where room_id = target_room and week_start = target_week;
  return new_id;
end $$;

create or replace function public.replace_pact_cards(target_room uuid, target_kind text, cards jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare card jsonb;
begin
  if not public.is_room_member(target_room) then raise exception 'Acesso negado.'; end if;
  if char_length(trim(target_kind)) not between 1 and 40 or jsonb_typeof(cards) <> 'array' then raise exception 'Cartas inválidas.'; end if;
  update public.pact_cards set active = false where room_id = target_room and kind = target_kind and active;
  for card in select * from jsonb_array_elements(cards) loop
    if nullif(trim(card ->> 'title'), '') is not null then
      insert into public.pact_cards(room_id, kind, title, created_by)
      values (target_room, target_kind, trim(card ->> 'title'), auth.uid());
    end if;
  end loop;
end $$;

create or replace function public.set_weekly_goal(target_room uuid, target_week date, target_days integer, target_minutes integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_member(target_room) then raise exception 'Acesso negado.'; end if;
  if extract(isodow from target_week) <> 1 or target_days not between 1 and 7 or target_minutes not between 1 and 10080 then raise exception 'Meta inválida.'; end if;
  if exists(select 1 from public.weekly_results where room_id = target_room and week_start = target_week) then raise exception 'A semana já foi fechada.'; end if;
  insert into public.weekly_goals(room_id, week_start, min_days, min_minutes, created_by)
    values (target_room, target_week, target_days, target_minutes, auth.uid())
  on conflict (room_id, week_start) do update set min_days = excluded.min_days, min_minutes = excluded.min_minutes;
end $$;

create or replace function public.set_weekly_pact(target_room uuid, target_week date, target_elements jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_room_member(target_room) then raise exception 'Acesso negado.'; end if;
  if extract(isodow from target_week) <> 1 or jsonb_typeof(target_elements) <> 'array' then raise exception 'Pacto inválido.'; end if;
  if exists(select 1 from public.weekly_results where room_id = target_room and week_start = target_week) then raise exception 'A semana já foi fechada.'; end if;
  insert into public.weekly_pacts(room_id, week_start, status, elements, created_by)
    values (target_room, target_week, 'active', target_elements, auth.uid())
  on conflict (room_id, week_start) do update set status = 'active', elements = excluded.elements;
end $$;

create or replace function public.ensure_current_week(target_room uuid, target_week date) returns void
language plpgsql security definer set search_path = public as $$
declare previous_goal public.weekly_goals%rowtype;
begin
  if not public.is_room_member(target_room) then raise exception 'Acesso negado.'; end if;
  if extract(isodow from target_week) <> 1 then raise exception 'A semana deve começar na segunda-feira.'; end if;
  select * into previous_goal from public.weekly_goals where room_id = target_room order by week_start desc limit 1;
  insert into public.weekly_goals(room_id, week_start, min_days, min_minutes, created_by)
    values (target_room, target_week, coalesce(previous_goal.min_days, 4), coalesce(previous_goal.min_minutes, 120), auth.uid())
    on conflict (room_id, week_start) do nothing;
  insert into public.weekly_pacts(room_id, week_start, created_by)
    values (target_room, target_week, auth.uid())
    on conflict (room_id, week_start) do nothing;
end $$;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_invites enable row level security;
alter table public.books enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.weekly_goals enable row level security;
alter table public.pact_cards enable row level security;
alter table public.weekly_pacts enable row level security;
alter table public.vault_transactions enable row level security;
alter table public.weekly_results enable row level security;
alter table public.user_achievements enable row level security;

create policy profiles_select on public.profiles for select using (id = auth.uid() or exists(select 1 from public.room_members mine join public.room_members theirs on theirs.room_id = mine.room_id where mine.user_id = auth.uid() and mine.left_at is null and theirs.user_id = profiles.id and theirs.left_at is null));
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy rooms_select_members on public.rooms for select using (public.is_room_member(id));
create policy rooms_update_owner on public.rooms for update using (public.is_room_owner(id)) with check (owner_id = auth.uid());
create policy memberships_select_members on public.room_members for select using (public.is_room_member(room_id));
create policy invites_select_owner on public.room_invites for select using (public.is_room_owner(room_id));

create policy books_select_members on public.books for select using (public.is_room_member(room_id));
create policy books_insert_own on public.books for insert with check (owner_id = auth.uid() and public.is_room_member(room_id));
create policy books_update_own on public.books for update using (owner_id = auth.uid() and public.is_room_member(room_id)) with check (owner_id = auth.uid() and public.is_room_member(room_id));
create policy books_delete_own on public.books for delete using (owner_id = auth.uid() and public.is_room_member(room_id));
create policy sessions_select_members on public.reading_sessions for select using (public.is_room_member(room_id));

create policy goals_select_members on public.weekly_goals for select using (public.is_room_member(room_id));
create policy cards_select_members on public.pact_cards for select using (public.is_room_member(room_id));
create policy pacts_select_members on public.weekly_pacts for select using (public.is_room_member(room_id));
create policy vault_select_members on public.vault_transactions for select using (public.is_room_member(room_id));
create policy vault_insert_members on public.vault_transactions for insert with check (created_by = auth.uid() and public.is_room_member(room_id));
create policy weekly_results_select_members on public.weekly_results for select using (public.is_room_member(room_id));
create policy achievements_select on public.user_achievements for select using (user_id = auth.uid() or exists(select 1 from public.room_members mine join public.room_members theirs on theirs.room_id = mine.room_id where mine.user_id = auth.uid() and theirs.user_id = user_achievements.user_id and mine.left_at is null and theirs.left_at is null));

revoke all on function public.create_room(text) from public;
revoke all on function public.create_room_invite(uuid) from public;
revoke all on function public.join_room_by_invite(text) from public;
revoke all on function public.leave_room(uuid, uuid) from public;
revoke all on function public.record_reading_session(uuid, timestamptz, timestamptz, integer, integer, text) from public;
revoke all on function public.close_week(uuid, date) from public;
revoke all on function public.replace_pact_cards(uuid, text, jsonb) from public;
revoke all on function public.set_weekly_goal(uuid, date, integer, integer) from public;
revoke all on function public.set_weekly_pact(uuid, date, jsonb) from public;
revoke all on function public.ensure_current_week(uuid, date) from public;
grant execute on function public.create_room(text) to authenticated;
grant execute on function public.create_room_invite(uuid) to authenticated;
grant execute on function public.join_room_by_invite(text) to authenticated;
grant execute on function public.leave_room(uuid, uuid) to authenticated;
grant execute on function public.record_reading_session(uuid, timestamptz, timestamptz, integer, integer, text) to authenticated;
grant execute on function public.close_week(uuid, date) to authenticated;
grant execute on function public.replace_pact_cards(uuid, text, jsonb) to authenticated;
grant execute on function public.set_weekly_goal(uuid, date, integer, integer) to authenticated;
grant execute on function public.set_weekly_pact(uuid, date, jsonb) to authenticated;
grant execute on function public.ensure_current_week(uuid, date) to authenticated;
