import {
  EMPTY_PROGRESS,
  EMPTY_STATS,
  EMPTY_WALLET,
  emptyMatchHistory,
  normalizeUsername,
  canonicalizeFriendPair,
  clampPage,
  clampPageSize
} from "../../../shared/src/index.js";
import { supabaseAdminClient } from "./supabase.js";

export async function getProfileById(userId) {
  const { data, error } = await supabaseAdminClient
    .from("profiles")
    .select("id, email, username, avatar_url, created_at, updated_at, last_login_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getProfileByUsername(username) {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabaseAdminClient
    .from("profiles")
    .select("id, email, username, avatar_url")
    .eq("username", normalized)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStatsOverview(userId) {
  const [progressResult, statsResult] = await Promise.all([
    supabaseAdminClient.from("player_progress").select("xp, level, rank, season_rank").eq("user_id", userId).maybeSingle(),
    supabaseAdminClient
      .from("player_stats")
      .select("games_played, wins, losses, kills, deaths, highest_score, highest_mass, time_played_seconds")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (progressResult.error) {
    throw progressResult.error;
  }
  if (statsResult.error) {
    throw statsResult.error;
  }

  const progress = progressResult.data || EMPTY_PROGRESS;
  const stats = statsResult.data || EMPTY_STATS;
  const kd_ratio = stats.deaths ? Number((stats.kills / stats.deaths).toFixed(2)) : Number(stats.kills || 0);
  const win_rate = stats.games_played ? Number(((stats.wins / stats.games_played) * 100).toFixed(2)) : 0;
  const average_score = stats.games_played ? Number((stats.highest_score / stats.games_played).toFixed(2)) : 0;

  return {
    progress,
    stats,
    highlights: {
      kd_ratio,
      win_rate,
      average_score
    }
  };
}

export async function getMatchHistory(userId, query) {
  const page = clampPage(query.page);
  const pageSize = clampPageSize(query.page_size);
  const offset = (page - 1) * pageSize;

  let builder = supabaseAdminClient
    .from("match_history")
    .select("id, mode, placement, score, kills, duration_seconds, xp_gained, reward_label, played_at", {
      count: "exact"
    })
    .eq("user_id", userId)
    .order("played_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (query.mode) {
    builder = builder.eq("mode", String(query.mode));
  }

  const { data, error, count } = await builder;

  if (error) {
    throw error;
  }

  return {
    ...emptyMatchHistory(page, pageSize),
    items: data || [],
    total: count || 0
  };
}

export async function getWalletOverview(userId) {
  const { data, error } = await supabaseAdminClient
    .from("wallet_accounts")
    .select("cash_balance, sol_balance, pending_withdrawals, pending_deposits")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || EMPTY_WALLET;
}

export async function getInventorySummary(userId) {
  const { data, error } = await supabaseAdminClient
    .from("inventory_items")
    .select("id, item_type, item_key, rarity, quantity, equipped, unlocked_at")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (error) {
    throw error;
  }

  const items = data || [];

  return {
    items,
    equipped: items.filter((item) => item.equipped),
    total_items: items.length
  };
}

export async function getFriendsSummary(userId) {
  const { data, error } = await supabaseAdminClient
    .from("friends")
    .select("id, user_a, user_b, requested_by, friend_state, created_at, updated_at")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const relationships = data || [];
  const otherIds = [...new Set(relationships.map((entry) => (entry.user_a === userId ? entry.user_b : entry.user_a)).filter(Boolean))];

  const profilesById = new Map();
  if (otherIds.length) {
    const { data: profiles, error: profilesError } = await supabaseAdminClient
      .from("profiles")
      .select("id, email, username, avatar_url")
      .in("id", otherIds);

    if (profilesError) {
      throw profilesError;
    }

    for (const profile of profiles || []) {
      profilesById.set(profile.id, profile);
    }
  }

  const summary = {
    accepted: [],
    incoming: [],
    outgoing: [],
    blocked: []
  };

  for (const relationship of relationships) {
    const otherUserId = relationship.user_a === userId ? relationship.user_b : relationship.user_a;
    const profile = profilesById.get(otherUserId);
    const payload = {
      id: relationship.id,
      user_id: otherUserId,
      username: profile?.username || null,
      email: profile?.email || null,
      avatar_url: profile?.avatar_url || null,
      friend_state: relationship.friend_state,
      requested_by: relationship.requested_by
    };

    if (relationship.friend_state === "accepted") {
      summary.accepted.push(payload);
    } else if (relationship.friend_state === "blocked") {
      summary.blocked.push(payload);
    } else if (relationship.friend_state === "pending") {
      if (relationship.requested_by === userId) {
        summary.outgoing.push(payload);
      } else {
        summary.incoming.push(payload);
      }
    }
  }

  return summary;
}

export async function ensureUsernameAvailable(username, currentUserId) {
  const normalized = normalizeUsername(username);
  const { data, error } = await supabaseAdminClient
    .from("profiles")
    .select("id")
    .eq("username", normalized)
    .limit(1);

  if (error) {
    throw error;
  }

  return !(data || []).some((entry) => entry.id !== currentUserId);
}

export async function createOrRefreshFriendRequest(currentUserId, targetUserId) {
  const pair = canonicalizeFriendPair(currentUserId, targetUserId);
  const { data: existing, error: existingError } = await supabaseAdminClient
    .from("friends")
    .select("id, friend_state")
    .match(pair)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    const { data, error } = await supabaseAdminClient
      .from("friends")
      .insert({
        ...pair,
        requested_by: currentUserId,
        friend_state: "pending"
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  if (existing.friend_state === "accepted") {
    const conflict = new Error("Dieser User ist bereits in deiner Friends-Liste.");
    conflict.status = 409;
    throw conflict;
  }

  if (existing.friend_state === "blocked") {
    const blocked = new Error("Diese Beziehung ist blockiert.");
    blocked.status = 403;
    throw blocked;
  }

  const { data, error } = await supabaseAdminClient
    .from("friends")
    .update({
      requested_by: currentUserId,
      friend_state: "pending"
    })
    .eq("id", existing.id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
