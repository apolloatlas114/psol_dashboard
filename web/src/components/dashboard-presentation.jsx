import { GAME_MODE_CARDS } from "@shared/index.js";

function asMetric(label, value) {
  return { label, value };
}

export function getSectionPresentation({
  activeSection,
  dashboardState,
  isAuthenticated,
  currentUser,
  acceptedFriends,
  incomingFriends,
  blockedFriends
}) {
  const progress = dashboardState.stats.progress;
  const stats = dashboardState.stats.stats;
  const inventory = dashboardState.inventory;
  const wallet = dashboardState.wallet;
  const history = dashboardState.history;

  const guestChip = isAuthenticated ? "LIVE" : "GUEST";
  const username = currentUser?.username || dashboardState.profile?.username || "PLAYER";

  const sharedMiniCards = GAME_MODE_CARDS.map((mode) => ({
    id: mode.id,
    title: mode.title,
    subtitle: mode.subtitle,
    accent: mode.accent,
    action: mode.id === "free" ? "launch-free" : "protected"
  }));

  const map = {
    overview: {
      title: "Overview",
      rightTitle: isAuthenticated ? "Your Statistic" : "Member Dashboard",
      quickLabel: "Quick Action",
      hero: {
        variant: "overview",
        eyebrow: "ZERO BUY-IN\nSURVIVAL MODE",
        title: "PlaySol Free Game",
        copy: "Drop back in, stack XP, hunt bosses and survive the arena.",
        badges: ["Collect XP", "Boss Hunt", "Squad Up"],
        points: [],
        footerTitle: "Continue Free Run",
        footerCopy: `Level ${Math.max(progress.level || 1, 1)} stays linked`,
        visualKicker: "FREE GAME",
        visualValue: "DROP IN",
        visualFooter: "zero buy-in | xp | boss hunts",
        visualAsset: "/overview-free-game-alien-neon-latest.png?v=hero6",
        visualAlt: "PlaySol Free Game banner with mutated donut creature"
      },
      miniCards: sharedMiniCards,
      stats: {
        label: isAuthenticated ? "XP to next level" : "Players online",
        value: isAuthenticated ? progress.xp : 230486,
        meta: isAuthenticated ? `Level ${progress.level}` : "Live population preview",
        metrics: [
          asMetric("Cash", wallet.cash_balance),
          asMetric("Friends", acceptedFriends.length),
          asMetric("Highscore", stats.highest_score)
        ],
        variant: "overview"
      }
    },
    play: {
      title: "Play",
      rightTitle: "Mode Snapshot",
      quickLabel: "Launch",
      hero: {
        variant: "play",
        eyebrow: "Play hub",
        title: "Choose Your Entry",
        copy: "Starte direkt ins Free Game oder nutze die vorbereiteten Cash-Mode-Einstiege als sauberen Play Hub.",
        badges: ["Play", "Direct", guestChip],
        footerTitle: "Free Game",
        footerCopy: "immer sofort im neuen Tab",
        visualKicker: "PLAY",
        visualValue: "QUEUE",
        visualFooter: "quick launch"
      },
      miniCards: sharedMiniCards,
      stats: {
        label: "Ready modes",
        value: 3,
        meta: isAuthenticated ? "Free + Cash stubs" : "Free live / cash locked",
        metrics: [
          asMetric("Free", 1),
          asMetric("Cash", isAuthenticated ? 2 : 0),
          asMetric("Matches", history.total)
        ],
        variant: "play"
      }
    },
    inventory: {
      title: "Inventory / Rewards",
      rightTitle: "Inventory Stats",
      quickLabel: "Collection",
      hero: {
        variant: "inventory",
        eyebrow: "Inventory hub",
        title: "Skins and Rewards",
        copy: "Behalte ausgeruestete Items, Belohnungen und Besitzstaende in einem klar getrennten Inventory-Bereich.",
        badges: ["Inventory", "Rewards", guestChip],
        footerTitle: `${inventory.total_items}`,
        footerCopy: "owned items in V1",
        visualKicker: "LOADOUT",
        visualValue: "DROP",
        visualFooter: "owned | equipped | rewards"
      },
      miniCards: [
        { id: "equipped", title: "Equipped", subtitle: `${inventory.equipped.length} active items`, accent: "free", action: "noop" },
        { id: "owned", title: "Owned Items", subtitle: `${inventory.total_items} in inventory`, accent: "team", action: "noop" },
        { id: "rewards", title: "Rewards", subtitle: "battle pass ready later", accent: "coop", action: "noop" }
      ],
      stats: {
        label: "Owned items",
        value: inventory.total_items,
        meta: "inventory snapshot",
        metrics: [
          asMetric("Equipped", inventory.equipped.length),
          asMetric("Rare", inventory.items.filter((item) => item.rarity === "rare" || item.rarity === "epic").length),
          asMetric("Total", inventory.total_items)
        ],
        variant: "inventory"
      }
    },
    history: {
      title: "Match-History",
      rightTitle: "Activity Totals",
      quickLabel: "Activity",
      hero: {
        variant: "history",
        eyebrow: "Recent activity",
        title: "Match Activity",
        copy: "Deine letzten Sessions, Scores und Rewards laufen hier sauber getrennt als Activity-Ansicht zusammen.",
        badges: ["History", "Timeline", guestChip],
        footerTitle: `${history.total}`,
        footerCopy: "logged matches",
        visualKicker: "MATCH",
        visualValue: "LOG",
        visualFooter: "recent | score | rewards"
      },
      miniCards: [
        { id: "last-match", title: "Last Match", subtitle: history.items[0]?.mode || "Noch kein Match", accent: "free", action: "noop" },
        { id: "best-score", title: "Best Score", subtitle: `${stats.highest_score || 0} peak score`, accent: "team", action: "noop" },
        { id: "xp-flow", title: "XP Flow", subtitle: `${progress.xp || 0} total xp`, accent: "coop", action: "noop" }
      ],
      stats: {
        label: "Matches logged",
        value: history.total,
        meta: "activity snapshot",
        metrics: [
          asMetric("Wins", stats.wins),
          asMetric("Kills", stats.kills),
          asMetric("Best", stats.highest_score)
        ],
        variant: "history"
      }
    },
    stats: {
      title: "Stats / Progress",
      rightTitle: "Progress Snapshot",
      quickLabel: "Breakdown",
      hero: {
        variant: "stats",
        eyebrow: "Progression",
        title: "Rank and Progress",
        copy: "Growth, XP, Rank und Performance sind hier bewusst getrennt aufbereitet und nicht mehr in dieselbe Ecke gequetscht.",
        badges: ["Stats", "XP", guestChip],
        footerTitle: `Lvl ${progress.level}`,
        footerCopy: `${progress.rank} rank`,
        visualKicker: "RANK",
        visualValue: "UP",
        visualFooter: "xp | rank | best"
      },
      miniCards: [
        { id: "xp", title: "XP", subtitle: `${progress.xp} total`, accent: "free", action: "noop" },
        { id: "level", title: "Level", subtitle: `${progress.level} current`, accent: "team", action: "noop" },
        { id: "rank", title: "Rank", subtitle: `${progress.rank}`, accent: "coop", action: "noop" }
      ],
      stats: {
        label: "Total XP",
        value: progress.xp,
        meta: `Level ${progress.level}`,
        metrics: [
          asMetric("Wins", stats.wins),
          asMetric("K/D", stats.deaths ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2)),
          asMetric("Mass", stats.highest_mass)
        ],
        variant: "stats"
      }
    },
    wallet: {
      title: "Wallet",
      rightTitle: "Finance Summary",
      quickLabel: "Read-only",
      hero: {
        variant: "wallet",
        eyebrow: "Wallet overview",
        title: "Balances and Pending States",
        copy: "Die Wallet bleibt in V1 read-only, bekommt aber eine klare eigene Flaeche statt wie vorher nur ein Restbanner zu sein.",
        badges: ["Wallet", "V1", "Read-only"],
        footerTitle: `${wallet.cash_balance}`,
        footerCopy: "cash balance",
        visualKicker: "FUNDS",
        visualValue: "SAFE",
        visualFooter: "cash | sol | pending"
      },
      miniCards: [
        { id: "cash", title: "Cash", subtitle: `${wallet.cash_balance} $ available`, accent: "free", action: "noop" },
        { id: "sol", title: "SOL", subtitle: `${wallet.sol_balance} SOL`, accent: "team", action: "noop" },
        { id: "pending", title: "Pending", subtitle: `${wallet.pending_deposits + wallet.pending_withdrawals} total`, accent: "coop", action: "noop" }
      ],
      stats: {
        label: "Wallet total",
        value: wallet.cash_balance,
        meta: "read-only snapshot",
        metrics: [
          asMetric("Cash", wallet.cash_balance),
          asMetric("SOL", wallet.sol_balance),
          asMetric("Pending", wallet.pending_withdrawals + wallet.pending_deposits)
        ],
        variant: "wallet"
      }
    },
    friends: {
      title: "Friends",
      rightTitle: "Social Snapshot",
      quickLabel: "Requests",
      hero: {
        variant: "friends",
        eyebrow: "Social hub",
        title: "Friends and Requests",
        copy: "Friend Requests, Annahmen und Block-Status laufen hier als eigener Social-Bereich statt als Restpanel.",
        badges: ["Friends", "Social", guestChip],
        footerTitle: `${acceptedFriends.length}`,
        footerCopy: "accepted friends",
        visualKicker: "SQUAD",
        visualValue: username,
        visualFooter: "accepted | incoming | blocked"
      },
      miniCards: [
        { id: "accepted", title: "Accepted", subtitle: `${acceptedFriends.length} connected`, accent: "free", action: "noop" },
        { id: "incoming", title: "Incoming", subtitle: `${incomingFriends.length} requests`, accent: "team", action: "noop" },
        { id: "blocked", title: "Blocked", subtitle: `${blockedFriends.length} blocked`, accent: "coop", action: "noop" }
      ],
      stats: {
        label: "Network",
        value: acceptedFriends.length,
        meta: "social overview",
        metrics: [
          asMetric("Incoming", incomingFriends.length),
          asMetric("Accepted", acceptedFriends.length),
          asMetric("Blocked", blockedFriends.length)
        ],
        variant: "friends"
      }
    }
  };

  return map[activeSection] || map.overview;
}
