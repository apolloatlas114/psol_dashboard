import { DEFAULT_PAGE_SIZE } from "./constants.js";

export const EMPTY_PROGRESS = {
  xp: 0,
  level: 1,
  rank: "Unranked",
  season_rank: null
};

export const EMPTY_STATS = {
  games_played: 0,
  wins: 0,
  losses: 0,
  kills: 0,
  deaths: 0,
  highest_score: 0,
  highest_mass: 0,
  time_played_seconds: 0
};

export const EMPTY_WALLET = {
  cash_balance: 0,
  sol_balance: 0,
  pending_withdrawals: 0,
  pending_deposits: 0
};

export const EMPTY_INVENTORY = {
  equipped: [],
  items: [],
  total_items: 0
};

export const EMPTY_FRIENDS = {
  accepted: [],
  incoming: [],
  outgoing: [],
  blocked: []
};

export function emptyMatchHistory(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  return {
    items: [],
    total: 0,
    page,
    page_size: pageSize
  };
}
