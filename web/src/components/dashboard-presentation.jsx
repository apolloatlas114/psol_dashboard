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
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "play",
        eyebrow: "PLAY HUB",
        title: "Choose Your Entry",
        copy: "Free Game bleibt dein direkter Einstieg. Cashgame wird darunter als kompakte Vorschau vorbereitet.",
        badges: ["Play", "Direct", guestChip],
        footerTitle: "Free Game live",
        footerCopy: "opens in a new tab",
        visualKicker: "PLAY",
        visualValue: "LIVE",
        visualFooter: "queue ready"
      },
      miniCards: [],
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
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "inventory",
        eyebrow: "INVENTORY HUB",
        title: "Skins and Rewards",
        copy: "Deine gewonnenen und gekauften Skins bleiben sichtbar, kompakt und schnell scanbar statt in schweren Datenboxen.",
        badges: ["Owned", "Rewards", guestChip],
        footerTitle: `${inventory.total_items} skins`,
        footerCopy: "equipped and owned",
        visualKicker: "LOADOUT",
        visualValue: "OWNED",
        visualFooter: "equipped | rarity"
      },
      miniCards: [],
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
    marketplace: {
      title: "Marketplace",
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "marketplace",
        eyebrow: "TRADING FLOOR",
        title: "Skin Marketplace",
        copy: "Buy bleibt der Standard. Filter, Sortierung und Skin-Karten stehen direkt im Fokus statt unter großen Platzhaltern.",
        badges: ["Buy", "Filter", guestChip],
        footerTitle: "Buy default",
        footerCopy: "sell stays secondary",
        visualKicker: "MARKET",
        visualValue: "LISTED",
        visualFooter: "buy | sell | floor"
      },
      miniCards: [],
      stats: {
        label: "Market volume",
        value: inventory.total_items || 12,
        meta: "buy state",
        metrics: [
          asMetric("Listed", inventory.items.length || 12),
          asMetric("Owned", inventory.total_items),
          asMetric("Floor", 1)
        ],
        variant: "marketplace"
      }
    },
    history: {
      title: "Match-History",
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "history",
        eyebrow: "RECENT ACTIVITY",
        title: "Match Activity",
        copy: "Letzte Sessions, Placements und Rewards laufen hier als ruhiger Feed statt als Tabellen- oder Card-Chaos.",
        badges: ["History", "Feed", guestChip],
        footerTitle: `${history.total} rows`,
        footerCopy: "recent sessions",
        visualKicker: "MATCH",
        visualValue: "LOG",
        visualFooter: "recent | score | rewards"
      },
      miniCards: [],
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
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "stats",
        eyebrow: "PROGRESSION",
        title: "Rank and Progress",
        copy: "Growth und Performance bleiben getrennt, dicht und schnell lesbar, ohne wieder in drei konkurrierende Module zu kippen.",
        badges: ["Progress", "Performance", guestChip],
        footerTitle: `Lvl ${progress.level}`,
        footerCopy: `${progress.rank} rank`,
        visualKicker: "RANK",
        visualValue: progress.level,
        visualFooter: "level"
      },
      miniCards: [],
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
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "wallet",
        eyebrow: "WALLET OVERVIEW",
        title: "Balances and Pending States",
        copy: "Read-only bleibt klar sichtbar. Die vier Kernwerte sitzen darunter in einem einzigen flachen Finance-Strip.",
        badges: ["Wallet", "Read-only", guestChip],
        footerTitle: `${wallet.cash_balance} $`,
        footerCopy: "cash balance",
        visualKicker: "FUNDS",
        visualValue: "SAFE",
        visualFooter: "cash | sol | pending"
      },
      miniCards: [],
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
      rightTitle: "",
      quickLabel: "",
      hero: {
        variant: "friends",
        eyebrow: "SOCIAL HUB",
        title: "Friends and Requests",
        copy: "Requests bekommen Vorrang. Connected bleibt die Hauptliste. Blocked ist nur noch sekundär statt ein eigener großer Bereich.",
        badges: ["Requests", "Connected", guestChip],
        footerTitle: `${acceptedFriends.length}`,
        footerCopy: "accepted friends",
        visualKicker: "SQUAD",
        visualValue: username,
        visualFooter: "accepted | incoming | blocked"
      },
      miniCards: [],
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
