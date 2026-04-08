create extension if not exists pgcrypto;

create type public.friend_state_t as enum ('pending', 'accepted', 'blocked', 'declined');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_lowercase check (username is null or username = lower(username)),
  constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_]{3,20}$')
);

create table public.player_progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  rank text not null default 'Unranked',
  season_rank text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.player_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  kills integer not null default 0,
  deaths integer not null default 0,
  highest_score integer not null default 0,
  highest_mass integer not null default 0,
  time_played_seconds integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.match_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null,
  placement integer,
  score integer not null default 0,
  kills integer not null default 0,
  duration_seconds integer not null default 0,
  xp_gained integer not null default 0,
  reward_label text,
  played_at timestamptz not null default timezone('utc', now())
);

create table public.wallet_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  cash_balance numeric(18, 2) not null default 0,
  sol_balance numeric(18, 6) not null default 0,
  pending_withdrawals numeric(18, 2) not null default 0,
  pending_deposits numeric(18, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_type text not null,
  item_key text not null,
  rarity text not null default 'common',
  quantity integer not null default 1,
  equipped boolean not null default false,
  unlocked_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.friends (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  friend_state public.friend_state_t not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint friends_distinct_users check (user_a <> user_b),
  constraint friends_canonical_pair check (user_a < user_b),
  constraint friends_unique_pair unique (user_a, user_b),
  constraint friends_requested_by_member check (requested_by = user_a or requested_by = user_b)
);

create index match_history_user_id_played_at_idx on public.match_history (user_id, played_at desc);
create index inventory_items_user_id_idx on public.inventory_items (user_id, equipped);
create index friends_user_a_idx on public.friends (user_a, friend_state);
create index friends_user_b_idx on public.friends (user_b, friend_state);

create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

create trigger player_progress_updated_at
before update on public.player_progress
for each row execute procedure public.set_updated_at();

create trigger player_stats_updated_at
before update on public.player_stats
for each row execute procedure public.set_updated_at();

create trigger wallet_accounts_updated_at
before update on public.wallet_accounts
for each row execute procedure public.set_updated_at();

create trigger inventory_items_updated_at
before update on public.inventory_items
for each row execute procedure public.set_updated_at();

create trigger friends_updated_at
before update on public.friends
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_dashboard_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.player_progress (user_id)
  values (new.id);

  insert into public.player_stats (user_id)
  values (new.id);

  insert into public.wallet_accounts (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_dashboard_user();

alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.player_stats enable row level security;
alter table public.match_history enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.inventory_items enable row level security;
alter table public.friends enable row level security;
