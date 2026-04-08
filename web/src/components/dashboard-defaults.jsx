import {
  EMPTY_FRIENDS,
  EMPTY_INVENTORY,
  EMPTY_PROGRESS,
  EMPTY_STATS,
  EMPTY_WALLET,
  emptyMatchHistory
} from "@shared/index.js";

export const defaultDashboardState = {
  profile: null,
  stats: {
    progress: EMPTY_PROGRESS,
    stats: EMPTY_STATS,
    highlights: {
      kd_ratio: 0,
      win_rate: 0,
      average_score: 0
    }
  },
  history: emptyMatchHistory(),
  wallet: EMPTY_WALLET,
  inventory: EMPTY_INVENTORY,
  friends: EMPTY_FRIENDS
};
