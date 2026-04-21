create table public.player_loadout (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  active_skin_id text,
  active_trail_id text,
  active_aura_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  guest_session_id text,
  mode text not null,
  resolved_skin_id text,
  status text not null default 'created',
  match_id text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint game_sessions_status_check check (status in ('created', 'joined', 'running', 'completed', 'abandoned', 'expired')),
  constraint game_sessions_identity_check check (user_id is not null or guest_session_id is not null)
);

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists last_seen_at timestamptz;

alter table public.inventory_items
  add column if not exists catalog_item_id text,
  add column if not exists source_type text not null default 'unknown',
  add column if not exists ownership_state text not null default 'owned',
  add column if not exists tradable boolean not null default false,
  add column if not exists last_used_at timestamptz;

alter table public.match_history
  add column if not exists match_id text,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists did_win boolean not null default false,
  add column if not exists top_3 boolean not null default false,
  add column if not exists top_10 boolean not null default false,
  add column if not exists top_22 boolean not null default false,
  add column if not exists deaths integer not null default 0,
  add column if not exists time_to_peak_size_seconds integer not null default 0,
  add column if not exists became_king boolean not null default false,
  add column if not exists king_time_seconds integer not null default 0,
  add column if not exists king_kills integer not null default 0,
  add column if not exists engulf_uses integer not null default 0,
  add column if not exists successful_engulfs integer not null default 0,
  add column if not exists failed_engulfs integer not null default 0,
  add column if not exists distance_traveled numeric(18, 2) not null default 0,
  add column if not exists damage_dealt integer not null default 0,
  add column if not exists damage_taken integer not null default 0,
  add column if not exists hits_landed integer not null default 0,
  add column if not exists hits_received integer not null default 0,
  add column if not exists event_participation boolean not null default false,
  add column if not exists pods_captured integer not null default 0,
  add column if not exists boss_damage integer not null default 0,
  add column if not exists boss_kills integer not null default 0,
  add column if not exists buy_in_usd numeric(18, 2) not null default 0,
  add column if not exists cash_payout_usd numeric(18, 2) not null default 0,
  add column if not exists profit_usd numeric(18, 2) not null default 0;

alter table public.player_progress
  add column if not exists xp_total integer not null default 0,
  add column if not exists xp_current_level integer not null default 0,
  add column if not exists xp_to_next_level integer not null default 250,
  add column if not exists rank_tier text not null default 'Unranked',
  add column if not exists rank_points integer not null default 0,
  add column if not exists rank_progress_percent numeric(5, 2) not null default 0,
  add column if not exists season_id text;

alter table public.player_stats
  add column if not exists top_3 integer not null default 0,
  add column if not exists top_10 integer not null default 0,
  add column if not exists top_22 integer not null default 0,
  add column if not exists average_placement numeric(8, 2) not null default 0,
  add column if not exists average_score numeric(12, 2) not null default 0,
  add column if not exists average_kills numeric(12, 2) not null default 0,
  add column if not exists average_peak_size numeric(12, 2) not null default 0,
  add column if not exists time_to_peak_avg_seconds numeric(12, 2) not null default 0,
  add column if not exists distance_traveled_total numeric(18, 2) not null default 0,
  add column if not exists damage_dealt_total integer not null default 0,
  add column if not exists damage_taken_total integer not null default 0,
  add column if not exists hits_landed_total integer not null default 0,
  add column if not exists hits_received_total integer not null default 0,
  add column if not exists engulf_uses_total integer not null default 0,
  add column if not exists successful_engulfs_total integer not null default 0,
  add column if not exists failed_engulfs_total integer not null default 0,
  add column if not exists times_became_king integer not null default 0,
  add column if not exists king_time_total_seconds integer not null default 0,
  add column if not exists longest_king_hold_seconds integer not null default 0,
  add column if not exists king_kill_count integer not null default 0,
  add column if not exists king_deaths integer not null default 0,
  add column if not exists bounty_earned_total numeric(18, 2) not null default 0,
  add column if not exists cash_buyins_total_usd numeric(18, 2) not null default 0,
  add column if not exists cash_earnings_total_usd numeric(18, 2) not null default 0,
  add column if not exists cash_profit_total_usd numeric(18, 2) not null default 0,
  add column if not exists longest_win_streak integer not null default 0,
  add column if not exists longest_loss_streak integer not null default 0,
  add column if not exists skins_unlocked_total integer not null default 0,
  add column if not exists inventory_value_usd numeric(18, 2) not null default 0;

create index if not exists player_loadout_user_id_idx on public.player_loadout (user_id);
create index if not exists game_sessions_user_id_idx on public.game_sessions (user_id, created_at desc);
create index if not exists game_sessions_guest_session_id_idx on public.game_sessions (guest_session_id, created_at desc);
create index if not exists game_sessions_status_idx on public.game_sessions (status, created_at desc);
create index if not exists inventory_items_user_type_idx on public.inventory_items (user_id, item_type, item_key);
create unique index if not exists match_history_user_match_mode_uidx on public.match_history (user_id, match_id, mode) where match_id is not null;

create trigger player_loadout_updated_at
before update on public.player_loadout
for each row execute procedure public.set_updated_at();

create trigger game_sessions_updated_at
before update on public.game_sessions
for each row execute procedure public.set_updated_at();

alter table public.player_loadout enable row level security;
alter table public.game_sessions enable row level security;

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

  insert into public.player_loadout (user_id)
  values (new.id);

  return new;
end;
$$;
