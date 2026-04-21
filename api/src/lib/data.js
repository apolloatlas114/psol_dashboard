import crypto from "crypto";
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

const LEVEL_XP_STEP = 250;
const STANDARD_FREE_SKIN_PATHS = Object.freeze([
  "textures/standardskins/playerSkin1.png",
  "textures/standardskins/playerSkin2.png",
  "textures/standardskins/playerSkin3.png",
  "textures/standardskins/playerSkin4.png",
  "textures/standardskins/playerSkin5.png",
  "textures/standardskins/playerSkin6.png",
  "textures/standardskins/playerSkin14.png"
]);

const FINAL_GAME_SESSION_STATUSES = new Set(["completed", "abandoned", "expired"]);
const ALLOWED_GAME_SESSION_TRANSITIONS = Object.freeze({
  created: new Set(["joined", "expired"]),
  joined: new Set(["running"]),
  running: new Set(["completed", "abandoned"]),
  completed: new Set(),
  abandoned: new Set(),
  expired: new Set()
});

function normalizeItemSkinId(item) {
  const catalogItemId = typeof item?.catalog_item_id === "string" ? item.catalog_item_id.trim() : "";
  const itemKey = typeof item?.item_key === "string" ? item.item_key.trim() : "";
  return catalogItemId || itemKey;
}

function hashToIndex(value, modulo) {
  const digest = crypto.createHash("sha256").update(String(value || "guest")).digest();
  return digest.readUInt32BE(0) % modulo;
}

function getDefaultSkinPath(seed) {
  return STANDARD_FREE_SKIN_PATHS[hashToIndex(seed, STANDARD_FREE_SKIN_PATHS.length)];
}

function clampPercent(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Number(numeric.toFixed(2))));
}

function toFixedNumber(value, digits = 2) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Number(numeric.toFixed(digits));
}

function coerceInt(value) {
  return Math.max(0, Math.floor(Number(value || 0)));
}

function computeProgressionValues(xpTotal = 0) {
  const safeXp = coerceInt(xpTotal);
  const level = 1 + Math.floor(safeXp / LEVEL_XP_STEP);
  const xpCurrentLevel = safeXp % LEVEL_XP_STEP;
  const xpToNextLevel = Math.max(0, LEVEL_XP_STEP - xpCurrentLevel);
  const rankProgressPercent = clampPercent((xpCurrentLevel / LEVEL_XP_STEP) * 100);

  return {
    xp: safeXp,
    xp_total: safeXp,
    level,
    xp_current_level: xpCurrentLevel,
    xp_to_next_level: xpToNextLevel,
    rank_progress_percent: rankProgressPercent
  };
}

function buildGameSessionUpdatePayload(currentStatus, nextStatus, fields = {}) {
  if (currentStatus === nextStatus) {
    return {
      ...fields
    };
  }

  if (FINAL_GAME_SESSION_STATUSES.has(currentStatus)) {
    const error = new Error(`Game session is already final (${currentStatus}).`);
    error.status = 409;
    throw error;
  }

  if (!ALLOWED_GAME_SESSION_TRANSITIONS[currentStatus]?.has(nextStatus)) {
    const error = new Error(`Invalid game session transition: ${currentStatus} -> ${nextStatus}`);
    error.status = 409;
    throw error;
  }

  return {
    ...fields,
    status: nextStatus
  };
}

function coerceSessionStatus(status = "") {
  const normalized = String(status || "").trim().toLowerCase();
  if (FINAL_GAME_SESSION_STATUSES.has(normalized) || ALLOWED_GAME_SESSION_TRANSITIONS[normalized]) {
    return normalized;
  }
  return "abandoned";
}

function buildHistoryRow(userId, payload) {
  return {
    user_id: userId,
    match_id: payload.match_id,
    mode: payload.mode || "free",
    placement: payload.placement ?? null,
    score: coerceInt(payload.score),
    kills: coerceInt(payload.kills),
    deaths: coerceInt(payload.deaths),
    duration_seconds: coerceInt(payload.duration_seconds),
    xp_gained: coerceInt(payload.xp_gained),
    reward_label: payload.reward_label || null,
    played_at: payload.ended_at || new Date().toISOString(),
    started_at: payload.started_at || null,
    ended_at: payload.ended_at || null,
    did_win: Boolean(payload.did_win),
    top_3: Boolean(payload.top_3),
    top_10: Boolean(payload.top_10),
    top_22: Boolean(payload.top_22),
    highest_mass: coerceInt(payload.highest_mass),
    time_to_peak_size_seconds: coerceInt(payload.time_to_peak_size_seconds),
    became_king: Boolean(payload.became_king),
    king_time_seconds: coerceInt(payload.king_time_seconds),
    king_kills: coerceInt(payload.king_kills),
    engulf_uses: coerceInt(payload.engulf_uses),
    successful_engulfs: coerceInt(payload.successful_engulfs),
    failed_engulfs: coerceInt(payload.failed_engulfs),
    distance_traveled: toFixedNumber(payload.distance_traveled),
    damage_dealt: coerceInt(payload.damage_dealt),
    damage_taken: coerceInt(payload.damage_taken),
    hits_landed: coerceInt(payload.hits_landed),
    hits_received: coerceInt(payload.hits_received),
    event_participation: Boolean(payload.event_participation),
    pods_captured: coerceInt(payload.pods_captured),
    boss_damage: coerceInt(payload.boss_damage),
    boss_kills: coerceInt(payload.boss_kills),
    buy_in_usd: toFixedNumber(payload.buy_in_usd),
    cash_payout_usd: toFixedNumber(payload.cash_payout_usd),
    profit_usd: toFixedNumber(payload.profit_usd)
  };
}

function buildStatsSnapshotFromHistory(rows, currentStats = {}) {
  const history = Array.isArray(rows) ? rows : [];
  const gamesPlayed = history.length;
  const wins = history.filter((entry) => entry.did_win).length;
  const losses = Math.max(0, gamesPlayed - wins);
  const kills = history.reduce((sum, entry) => sum + coerceInt(entry.kills), 0);
  const deaths = history.reduce((sum, entry) => sum + coerceInt(entry.deaths), 0);
  const top3 = history.filter((entry) => entry.top_3).length;
  const top10 = history.filter((entry) => entry.top_10).length;
  const top22 = history.filter((entry) => entry.top_22).length;
  const highestScore = history.reduce((max, entry) => Math.max(max, coerceInt(entry.score)), 0);
  const highestMass = history.reduce((max, entry) => Math.max(max, coerceInt(entry.highest_mass)), 0);
  const timePlayedSeconds = history.reduce((sum, entry) => sum + coerceInt(entry.duration_seconds), 0);
  const averagePlacement = gamesPlayed
    ? toFixedNumber(history.reduce((sum, entry) => sum + Number(entry.placement || 0), 0) / gamesPlayed)
    : 0;
  const averageScore = gamesPlayed
    ? toFixedNumber(history.reduce((sum, entry) => sum + coerceInt(entry.score), 0) / gamesPlayed)
    : 0;
  const averageKills = gamesPlayed
    ? toFixedNumber(history.reduce((sum, entry) => sum + coerceInt(entry.kills), 0) / gamesPlayed)
    : 0;
  const averagePeakSize = gamesPlayed
    ? toFixedNumber(history.reduce((sum, entry) => sum + coerceInt(entry.highest_mass), 0) / gamesPlayed)
    : 0;
  const timeToPeakAvgSeconds = gamesPlayed
    ? toFixedNumber(history.reduce((sum, entry) => sum + coerceInt(entry.time_to_peak_size_seconds), 0) / gamesPlayed)
    : 0;

  return {
    games_played: gamesPlayed,
    wins,
    losses,
    kills,
    deaths,
    highest_score: highestScore,
    highest_mass: highestMass,
    time_played_seconds: timePlayedSeconds,
    top_3: top3,
    top_10: top10,
    top_22: top22,
    average_placement: averagePlacement,
    average_score: averageScore,
    average_kills: averageKills,
    average_peak_size: averagePeakSize,
    time_to_peak_avg_seconds: timeToPeakAvgSeconds,
    distance_traveled_total: toFixedNumber(history.reduce((sum, entry) => sum + Number(entry.distance_traveled || 0), 0)),
    damage_dealt_total: history.reduce((sum, entry) => sum + coerceInt(entry.damage_dealt), 0),
    damage_taken_total: history.reduce((sum, entry) => sum + coerceInt(entry.damage_taken), 0),
    hits_landed_total: history.reduce((sum, entry) => sum + coerceInt(entry.hits_landed), 0),
    hits_received_total: history.reduce((sum, entry) => sum + coerceInt(entry.hits_received), 0),
    engulf_uses_total: history.reduce((sum, entry) => sum + coerceInt(entry.engulf_uses), 0),
    successful_engulfs_total: history.reduce((sum, entry) => sum + coerceInt(entry.successful_engulfs), 0),
    failed_engulfs_total: history.reduce((sum, entry) => sum + coerceInt(entry.failed_engulfs), 0),
    times_became_king: history.filter((entry) => entry.became_king).length,
    king_time_total_seconds: history.reduce((sum, entry) => sum + coerceInt(entry.king_time_seconds), 0),
    longest_king_hold_seconds: history.reduce((max, entry) => Math.max(max, coerceInt(entry.king_time_seconds)), 0),
    king_kill_count: history.reduce((sum, entry) => sum + coerceInt(entry.king_kills), 0),
    king_deaths: history.filter((entry) => entry.became_king && !entry.did_win).length,
    bounty_earned_total: toFixedNumber(Number(currentStats.bounty_earned_total || 0)),
    cash_buyins_total_usd: toFixedNumber(history.reduce((sum, entry) => sum + Number(entry.buy_in_usd || 0), 0)),
    cash_earnings_total_usd: toFixedNumber(history.reduce((sum, entry) => sum + Number(entry.cash_payout_usd || 0), 0)),
    cash_profit_total_usd: toFixedNumber(history.reduce((sum, entry) => sum + Number(entry.profit_usd || 0), 0)),
    longest_win_streak: Math.max(coerceInt(currentStats.longest_win_streak), wins > 0 ? 1 : 0),
    longest_loss_streak: Math.max(coerceInt(currentStats.longest_loss_streak), losses > 0 ? 1 : 0),
    skins_unlocked_total: coerceInt(currentStats.skins_unlocked_total),
    inventory_value_usd: toFixedNumber(Number(currentStats.inventory_value_usd || 0))
  };
}

export async function getProfileById(userId) {
  const { data, error } = await supabaseAdminClient
    .from("profiles")
    .select("id, email, username, display_name, avatar_url, created_at, updated_at, last_login_at, last_seen_at")
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
    .select("id, email, username, display_name, avatar_url")
    .eq("username", normalized)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function touchProfileSeen(userId) {
  const { error } = await supabaseAdminClient
    .from("profiles")
    .update({
      last_seen_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function getPlayerLoadout(userId) {
  const { data, error } = await supabaseAdminClient
    .from("player_loadout")
    .select("user_id, active_skin_id, active_trail_id, active_aura_id, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await supabaseAdminClient
    .from("player_loadout")
    .upsert({
      user_id: userId
    }, { onConflict: "user_id" })
    .select("user_id, active_skin_id, active_trail_id, active_aura_id, updated_at")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
}

export async function getOwnedSkinInventory(userId) {
  const { data, error } = await supabaseAdminClient
    .from("inventory_items")
    .select("id, item_type, item_key, catalog_item_id, rarity, quantity, tradable, source_type, ownership_state, unlocked_at, last_used_at")
    .eq("user_id", userId)
    .eq("item_type", "skin")
    .order("unlocked_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getStatsOverview(userId) {
  const [progressResult, statsResult] = await Promise.all([
    supabaseAdminClient
      .from("player_progress")
      .select("xp, level, rank, season_rank, xp_total, xp_current_level, xp_to_next_level, rank_tier, rank_points, rank_progress_percent, season_id")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdminClient
      .from("player_stats")
      .select("games_played, wins, losses, kills, deaths, highest_score, highest_mass, time_played_seconds, top_3, top_10, top_22, average_placement, average_score, average_kills, average_peak_size, time_to_peak_avg_seconds, distance_traveled_total, damage_dealt_total, damage_taken_total, hits_landed_total, hits_received_total, engulf_uses_total, successful_engulfs_total, failed_engulfs_total, times_became_king, king_time_total_seconds, longest_king_hold_seconds, king_kill_count, king_deaths, bounty_earned_total, cash_buyins_total_usd, cash_earnings_total_usd, cash_profit_total_usd, longest_win_streak, longest_loss_streak, skins_unlocked_total, inventory_value_usd")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (progressResult.error) {
    throw progressResult.error;
  }
  if (statsResult.error) {
    throw statsResult.error;
  }

  const progress = {
    ...EMPTY_PROGRESS,
    ...computeProgressionValues(progressResult.data?.xp_total ?? progressResult.data?.xp ?? 0),
    ...progressResult.data
  };
  const stats = {
    ...EMPTY_STATS,
    ...statsResult.data
  };
  const kd_ratio = stats.deaths ? Number((stats.kills / stats.deaths).toFixed(2)) : Number(stats.kills || 0);
  const win_rate = stats.games_played ? Number(((stats.wins / stats.games_played) * 100).toFixed(2)) : 0;

  return {
    progress,
    stats,
    highlights: {
      kd_ratio,
      win_rate,
      average_score: Number(stats.average_score || 0)
    }
  };
}

export async function getMatchHistory(userId, query) {
  const page = clampPage(query.page);
  const pageSize = clampPageSize(query.page_size);
  const offset = (page - 1) * pageSize;

  let builder = supabaseAdminClient
    .from("match_history")
    .select("id, match_id, mode, placement, score, kills, deaths, duration_seconds, xp_gained, reward_label, played_at, did_win, top_3, top_10, top_22, highest_mass, king_time_seconds, distance_traveled, damage_dealt, damage_taken", {
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
  const [itemsResult, loadout] = await Promise.all([
    supabaseAdminClient
      .from("inventory_items")
      .select("id, item_type, item_key, catalog_item_id, rarity, quantity, equipped, tradable, source_type, ownership_state, unlocked_at, last_used_at")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false }),
    getPlayerLoadout(userId)
  ]);

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  const items = itemsResult.data || [];
  const activeSkinId = loadout?.active_skin_id || null;
  const equipped = activeSkinId
    ? items.filter((item) => normalizeItemSkinId(item) === activeSkinId)
    : [];

  return {
    items,
    equipped,
    total_items: items.length,
    active_skin_id: activeSkinId,
    loadout
  };
}

export async function getInventorySkins(userId) {
  const [skins, loadout] = await Promise.all([
    getOwnedSkinInventory(userId),
    getPlayerLoadout(userId)
  ]);

  return {
    items: skins,
    active_skin_id: loadout?.active_skin_id || null
  };
}

export async function setActiveSkinForUser(userId, skinId) {
  const normalizedSkinId = typeof skinId === "string" ? skinId.trim() : "";

  if (!normalizedSkinId) {
    const { data, error } = await supabaseAdminClient
      .from("player_loadout")
      .upsert({
        user_id: userId,
        active_skin_id: null
      }, { onConflict: "user_id" })
      .select("user_id, active_skin_id, active_trail_id, active_aura_id, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const skins = await getOwnedSkinInventory(userId);
  const ownsSkin = skins.some((item) => normalizeItemSkinId(item) === normalizedSkinId);
  if (!ownsSkin) {
    const error = new Error("Diese Skin gehoert dem User nicht.");
    error.status = 403;
    throw error;
  }

  const { data, error } = await supabaseAdminClient
    .from("player_loadout")
    .upsert({
      user_id: userId,
      active_skin_id: normalizedSkinId
    }, { onConflict: "user_id" })
    .select("user_id, active_skin_id, active_trail_id, active_aura_id, updated_at")
    .single();

  if (error) {
    throw error;
  }

  await supabaseAdminClient
    .from("inventory_items")
    .update({
      last_used_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .or(`catalog_item_id.eq.${normalizedSkinId},item_key.eq.${normalizedSkinId}`);

  return data;
}

export async function resolveLaunchSkinForUser(userId, seed = userId) {
  if (!userId) {
    return {
      resolved_skin_id: getDefaultSkinPath(seed),
      is_default_skin: true,
      loadout: null
    };
  }

  const [loadout, skins] = await Promise.all([
    getPlayerLoadout(userId),
    getOwnedSkinInventory(userId)
  ]);

  const activeSkinId = loadout?.active_skin_id || "";
  const ownsActiveSkin = skins.some((item) => normalizeItemSkinId(item) === activeSkinId);

  if (activeSkinId && ownsActiveSkin) {
    return {
      resolved_skin_id: activeSkinId,
      is_default_skin: false,
      loadout
    };
  }

  return {
    resolved_skin_id: getDefaultSkinPath(seed),
    is_default_skin: true,
    loadout
  };
}

export async function createGameSession({ userId = null, guestSessionId = null, mode = "free", resolvedSkinId = null }) {
  const insertPayload = {
    user_id: userId,
    guest_session_id: guestSessionId,
    mode,
    resolved_skin_id: resolvedSkinId,
    status: "created"
  };

  const { data, error } = await supabaseAdminClient
    .from("game_sessions")
    .insert(insertPayload)
    .select("id, user_id, guest_session_id, mode, resolved_skin_id, status, match_id, started_at, ended_at, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getGameSessionById(launchId) {
  const { data, error } = await supabaseAdminClient
    .from("game_sessions")
    .select("id, user_id, guest_session_id, mode, resolved_skin_id, status, match_id, started_at, ended_at, created_at, updated_at")
    .eq("id", launchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateGameSessionStatus({ launchId, nextStatus, matchId = null, startedAt = null, endedAt = null }) {
  const session = await getGameSessionById(launchId);
  if (!session) {
    const error = new Error("Game session nicht gefunden.");
    error.status = 404;
    throw error;
  }

  const payload = buildGameSessionUpdatePayload(session.status, nextStatus, {
    ...(matchId ? { match_id: matchId } : {}),
    ...(startedAt ? { started_at: startedAt } : {}),
    ...(endedAt ? { ended_at: endedAt } : {})
  });

  if (!payload.status && Object.keys(payload).length === 0) {
    return session;
  }

  const { data, error } = await supabaseAdminClient
    .from("game_sessions")
    .update(payload)
    .eq("id", launchId)
    .select("id, user_id, guest_session_id, mode, resolved_skin_id, status, match_id, started_at, ended_at, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function ingestFreeMatchResult(result) {
  const launchId = String(result?.launch_id || "").trim();
  const matchId = String(result?.match_id || "").trim();
  if (!launchId || !matchId) {
    const error = new Error("launch_id und match_id sind erforderlich.");
    error.status = 400;
    throw error;
  }

  const session = await getGameSessionById(launchId);
  if (!session) {
    const error = new Error("Game session nicht gefunden.");
    error.status = 404;
    throw error;
  }

  const finalStatus = coerceSessionStatus(result?.final_status || "completed");

  if (FINAL_GAME_SESSION_STATUSES.has(session.status)) {
    return {
      duplicate: true,
      session
    };
  }

  if (!session.user_id) {
    const guestSession = await updateGameSessionStatus({
      launchId,
      nextStatus: finalStatus,
      matchId,
      startedAt: result.started_at || null,
      endedAt: result.ended_at || new Date().toISOString()
    });

    return {
      duplicate: false,
      session: guestSession,
      history: null
    };
  }

  const historyRow = buildHistoryRow(session.user_id, {
    ...result,
    mode: session.mode,
    match_id: matchId
  });

  const { data: insertedHistory, error: insertHistoryError } = await supabaseAdminClient
    .from("match_history")
    .upsert(historyRow, {
      onConflict: "user_id,match_id,mode"
    })
    .select("id, match_id, mode, placement, score, kills, deaths, duration_seconds, xp_gained, played_at")
    .single();

  if (insertHistoryError) {
    throw insertHistoryError;
  }

  const [currentProgressResult, currentStatsResult] = await Promise.all([
    supabaseAdminClient
      .from("player_progress")
      .select("user_id, xp, xp_total, level, rank, season_rank, xp_current_level, xp_to_next_level, rank_tier, rank_points, rank_progress_percent, season_id")
      .eq("user_id", session.user_id)
      .maybeSingle(),
    supabaseAdminClient
      .from("player_stats")
      .select("user_id, games_played, wins, losses, kills, deaths, highest_score, highest_mass, time_played_seconds, top_3, top_10, top_22, average_placement, average_score, average_kills, average_peak_size, time_to_peak_avg_seconds, distance_traveled_total, damage_dealt_total, damage_taken_total, hits_landed_total, hits_received_total, engulf_uses_total, successful_engulfs_total, failed_engulfs_total, times_became_king, king_time_total_seconds, longest_king_hold_seconds, king_kill_count, king_deaths, bounty_earned_total, cash_buyins_total_usd, cash_earnings_total_usd, cash_profit_total_usd, longest_win_streak, longest_loss_streak, skins_unlocked_total, inventory_value_usd")
      .eq("user_id", session.user_id)
      .maybeSingle()
  ]);

  if (currentProgressResult.error) {
    throw currentProgressResult.error;
  }
  if (currentStatsResult.error) {
    throw currentStatsResult.error;
  }

  const currentProgress = currentProgressResult.data || { user_id: session.user_id, xp_total: 0, rank: "Unranked", rank_tier: "Unranked" };
  const currentStats = currentStatsResult.data || { user_id: session.user_id };
  const { data: allHistoryRows, error: allHistoryRowsError } = await supabaseAdminClient
    .from("match_history")
    .select("match_id, mode, placement, score, kills, deaths, duration_seconds, xp_gained, did_win, top_3, top_10, top_22, highest_mass, time_to_peak_size_seconds, became_king, king_time_seconds, king_kills, engulf_uses, successful_engulfs, failed_engulfs, distance_traveled, damage_dealt, damage_taken, hits_landed, hits_received, buy_in_usd, cash_payout_usd, profit_usd")
    .eq("user_id", session.user_id);

  if (allHistoryRowsError) {
    throw allHistoryRowsError;
  }

  const totalXpFromHistory = (allHistoryRows || []).reduce((sum, entry) => sum + coerceInt(entry.xp_gained), 0);
  const nextProgress = {
    ...computeProgressionValues(totalXpFromHistory),
    rank: currentProgress.rank || "Unranked",
    season_rank: currentProgress.season_rank || null,
    rank_tier: currentProgress.rank_tier || currentProgress.rank || "Unranked",
    rank_points: coerceInt(currentProgress.rank_points),
    season_id: currentProgress.season_id || null
  };
  const nextStats = buildStatsSnapshotFromHistory(allHistoryRows || [], currentStats);

  const { error: progressUpdateError } = await supabaseAdminClient
    .from("player_progress")
    .upsert({
      user_id: session.user_id,
      ...nextProgress
    }, { onConflict: "user_id" });

  if (progressUpdateError) {
    throw progressUpdateError;
  }

  const { error: statsUpdateError } = await supabaseAdminClient
    .from("player_stats")
    .upsert({
      user_id: session.user_id,
      ...nextStats
    }, { onConflict: "user_id" });

  if (statsUpdateError) {
    throw statsUpdateError;
  }

  const completedSession = await updateGameSessionStatus({
    launchId,
    nextStatus: finalStatus,
    matchId,
    startedAt: result.started_at || null,
    endedAt: result.ended_at || new Date().toISOString()
  });

  await touchProfileSeen(session.user_id);

  return {
    duplicate: false,
    session: completedSession,
    history: insertedHistory
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
      .select("id, email, username, display_name, avatar_url")
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
      display_name: profile?.display_name || null,
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
