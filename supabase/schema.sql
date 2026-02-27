-- Quartier FC - Supabase schema
-- Tables, enums, RLS policies, triggers and functions

-- ============================
-- ENUM TYPES
-- ============================

create type public.tournament_format as enum ('league', 'knockout', 'groups_knockout');

create type public.tournament_status as enum ('draft', 'active', 'finished');

create type public.match_status as enum ('scheduled', 'pending_validation', 'confirmed', 'disputed');

create type public.notification_type as enum (
  'match_scheduled',
  'score_submitted',
  'score_confirmed',
  'tournament_start',
  'new_round'
);

-- ============================
-- TABLES
-- ============================

-- 1. profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  position text,
  favorite_team text,
  elo_rating integer not null default 1000,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

-- 2. tournaments
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format tournament_format not null,
  status tournament_status not null default 'draft',
  created_by uuid not null references public.profiles (id) on delete cascade,
  max_players integer not null check (max_players > 1),
  start_date date not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.tournaments enable row level security;

-- 3. tournament_players (many-to-many between tournaments and profiles)
create table public.tournament_players (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  group_name text,
  joined_at timestamp with time zone not null default timezone('utc'::text, now()),
  primary key (tournament_id, player_id)
);

alter table public.tournament_players enable row level security;

-- 4. matches
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  home_player_id uuid not null references public.profiles (id) on delete cascade,
  away_player_id uuid not null references public.profiles (id) on delete cascade,
  home_score integer,
  away_score integer,
  round integer not null check (round >= 1),
  status match_status not null default 'scheduled',
  played_at timestamp with time zone,
  confirmed_by_home boolean not null default false,
  confirmed_by_away boolean not null default false,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.matches enable row level security;

-- 5. notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_match_id uuid references public.matches (id) on delete set null,
  related_tournament_id uuid references public.tournaments (id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

-- 6. push_subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

-- ============================
-- RLS POLICIES
-- ============================

-- PROFILES

create policy "Profiles are viewable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- TOURNAMENTS

create policy "Tournaments are viewable by authenticated users"
on public.tournaments
for select
to authenticated
using (true);

create policy "Authenticated users can create tournaments"
on public.tournaments
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Tournament creator can update their tournaments"
on public.tournaments
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

-- TOURNAMENT_PLAYERS

create policy "Tournament players are viewable by authenticated users"
on public.tournament_players
for select
to authenticated
using (true);

create policy "Authenticated users can join tournaments as themselves"
on public.tournament_players
for insert
to authenticated
with check (player_id = auth.uid());

-- MATCHES

create policy "Matches are viewable by tournament participants"
on public.matches
for select
to authenticated
using (
  exists (
    select 1
    from public.tournament_players tp
    where tp.tournament_id = matches.tournament_id
      and tp.player_id = auth.uid()
  )
);

create policy "Tournament participants can update their matches"
on public.matches
for update
to authenticated
using (
  auth.uid() in (home_player_id, away_player_id) or
  auth.uid() = (
    select t.created_by from public.tournaments t
    where t.id = matches.tournament_id
  )
)
with check (
  auth.uid() in (home_player_id, away_player_id) or
  auth.uid() = (
    select t.created_by from public.tournaments t
    where t.id = matches.tournament_id
  )
);

create policy "Tournament creator can insert matches"
on public.matches
for insert
to authenticated
with check (
  auth.uid() = (
    select t.created_by from public.tournaments t
    where t.id = matches.tournament_id
  )
);

-- NOTIFICATIONS

create policy "Users can view their own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Service role can insert notifications"
on public.notifications
for insert
with check (auth.role() = 'service_role');

-- PUSH SUBSCRIPTIONS

create policy "Users can manage their push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can delete their push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

-- ============================
-- ELO RATING FUNCTION
-- ============================

create or replace function public.update_elo_after_match()
returns trigger
language plpgsql
as $$
declare
  k constant integer := 32;
  home_rating integer;
  away_rating integer;
  home_expected numeric;
  away_expected numeric;
  home_score_result numeric;
  away_score_result numeric;
begin
  -- Only run when a match becomes confirmed
  if (tg_op = 'UPDATE'
      and old.status is distinct from 'confirmed'
      and new.status = 'confirmed') then

    if new.home_score is null or new.away_score is null then
      return new;
    end if;

    select elo_rating into home_rating from public.profiles where id = new.home_player_id;
    select elo_rating into away_rating from public.profiles where id = new.away_player_id;

    if home_rating is null or away_rating is null then
      return new;
    end if;

    home_expected := 1.0 / (1.0 + power(10.0, (away_rating - home_rating) / 400.0));
    away_expected := 1.0 / (1.0 + power(10.0, (home_rating - away_rating) / 400.0));

    if new.home_score > new.away_score then
      home_score_result := 1;
      away_score_result := 0;
    elsif new.home_score < new.away_score then
      home_score_result := 0;
      away_score_result := 1;
    else
      home_score_result := 0.5;
      away_score_result := 0.5;
    end if;

    update public.profiles
    set elo_rating = round(home_rating + k * (home_score_result - home_expected))
    where id = new.home_player_id;

    update public.profiles
    set elo_rating = round(away_rating + k * (away_score_result - away_expected))
    where id = new.away_player_id;
  end if;

  return new;
end;
$$;

create trigger trg_update_elo_after_match
after update on public.matches
for each row
execute function public.update_elo_after_match();

-- ============================
-- NOTIFICATION FUNCTIONS
-- ============================

create or replace function public.create_match_notifications_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  home_username text;
  away_username text;
  tour_name text;
begin
  if new.status = 'scheduled' then
    select username into home_username from public.profiles where id = new.home_player_id;
    select username into away_username from public.profiles where id = new.away_player_id;
    select name into tour_name from public.tournaments where id = new.tournament_id;

    insert into public.notifications (user_id, type, title, message, related_match_id, related_tournament_id)
    values (
      new.home_player_id,
      'match_scheduled',
      'Match programmé',
      coalesce('Ton match contre ' || away_username || ' dans ' || tour_name, 'Nouveau match programmé'),
      new.id,
      new.tournament_id
    );

    insert into public.notifications (user_id, type, title, message, related_match_id, related_tournament_id)
    values (
      new.away_player_id,
      'match_scheduled',
      'Match programmé',
      coalesce('Ton match contre ' || home_username || ' dans ' || tour_name, 'Nouveau match programmé'),
      new.id,
      new.tournament_id
    );
  end if;

  return new;
end;
$$;

create trigger trg_create_match_notifications_on_insert
after insert on public.matches
for each row
execute function public.create_match_notifications_on_insert();

create or replace function public.create_match_notifications_on_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tour_name text;
begin
  select name into tour_name from public.tournaments where id = new.tournament_id;

  -- Score soumis par le joueur home (status -> pending_validation)
  if old.status is distinct from 'pending_validation'
     and new.status = 'pending_validation' then
    insert into public.notifications (user_id, type, title, message, related_match_id, related_tournament_id)
    values (
      new.away_player_id,
      'score_submitted',
      'Score à valider',
      coalesce('Le score de ton match dans ' || tour_name || ' est en attente de ta validation.', 'Score soumis'),
      new.id,
      new.tournament_id
    );
  end if;

  -- Score confirmé par away (status -> confirmed)
  if old.status is distinct from 'confirmed'
     and new.status = 'confirmed' then
    insert into public.notifications (user_id, type, title, message, related_match_id, related_tournament_id)
    values (
      new.home_player_id,
      'score_confirmed',
      'Score confirmé',
      coalesce('Le score de ton match dans ' || tour_name || ' a été confirmé.', 'Score confirmé'),
      new.id,
      new.tournament_id
    );

    insert into public.notifications (user_id, type, title, message, related_match_id, related_tournament_id)
    values (
      new.away_player_id,
      'score_confirmed',
      'Score confirmé',
      coalesce('Le score de ton match dans ' || tour_name || ' a été confirmé.', 'Score confirmé'),
      new.id,
      new.tournament_id
    );
  end if;

  -- Score contesté (status -> disputed) → notification à l’admin du tournoi
  if old.status is distinct from 'disputed'
     and new.status = 'disputed' then
    insert into public.notifications (user_id, type, title, message, related_match_id, related_tournament_id)
    select
      t.created_by,
      'score_confirmed', -- type dédié non prévu dans le schema, on garde score_confirmed pour signaler un évènement lié au score
      'Score contesté',
      coalesce('Un score a été contesté dans ' || t.name || '.', 'Score contesté'),
      new.id,
      new.tournament_id
    from public.tournaments t
    where t.id = new.tournament_id;
  end if;

  return new;
end;
$$;

create trigger trg_create_match_notifications_on_update
after update on public.matches
for each row
execute function public.create_match_notifications_on_update();

-- ============================
-- TOURNAMENT NOTIFICATIONS
-- ============================

create or replace function public.create_tournament_start_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Tournoi passe de draft à active
  if old.status is distinct from 'active'
     and new.status = 'active' then
    insert into public.notifications (user_id, type, title, message, related_tournament_id)
    select
      tp.player_id,
      'tournament_start',
      'Le tournoi commence',
      'Le tournoi ' || new.name || ' a démarré.',
      new.id
    from public.tournament_players tp
    where tp.tournament_id = new.id;
  end if;

  return new;
end;
$$;

create trigger trg_create_tournament_start_notification
after update on public.tournaments
for each row
execute function public.create_tournament_start_notification();

-- ============================
-- AUTH → PROFILES SYNC
-- ============================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

