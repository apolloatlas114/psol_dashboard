export const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Home", icon: "home", protected: false },
  { id: "play", label: "Play", icon: "gamepad", protected: false },
  { id: "profile", label: "Profile", icon: "user", protected: true },
  { id: "inventory", label: "Inventory", icon: "gift", protected: true },
  { id: "marketplace", label: "Marketplace", icon: "store", protected: true },
  { id: "history", label: "History", icon: "tv", protected: true },
  { id: "wallet", label: "Wallet", icon: "briefcase", protected: true },
  { id: "friends", label: "Friends", icon: "chat", protected: true }
];

export const GAME_MODE_CARDS = [
  {
    id: "free",
    title: "Free Game",
    subtitle: "No buy-in + survive & dominate",
    description: "Direkter Einstieg fuer jeden Spieler. Progress-Tracking kommt automatisch dazu, sobald ein Account verbunden ist.",
    accent: "free",
    locked: false
  },
  {
    id: "team-cash",
    title: "Team Battle Cashgame",
    subtitle: "Winning team splits the prize",
    description: "Spaeterer Echtgeld-Modus. In V1 als geschuetzte Kachel und Vorbereitung fuer Wallet- und Team-Logik.",
    accent: "team",
    locked: true
  },
  {
    id: "coop-cash",
    title: "Coop Cashgame",
    subtitle: "Top teams share the win pool",
    description: "Bleibt in V1 read-only vorbereitet, damit spaeter Buy-in und Queue-Regeln sauber andocken koennen.",
    accent: "coop",
    locked: true
  }
];

export const OVERVIEW_FEATURES = [
  {
    title: "Progress und Match-History",
    description: "Nach Login werden XP, Rank, letzte Matches und Statistiken dauerhaft gespeichert."
  },
  {
    title: "Wallet und Cash-Modi",
    description: "Wallet bleibt in V1 read-only vorbereitet und ist die Basis fuer spaetere Echtgeld-Flows."
  },
  {
    title: "Friends ohne Realtime",
    description: "Friend Requests, Accept, Decline und Block sind vorbereitet. Live-Status folgt spaeter."
  }
];

export const NOTIFICATION_ITEMS = [
  {
    id: "progress",
    title: "Progress sync",
    copy: "Neue Accounts starten mit leeren Stats und Progression, damit das Dashboard sauber auf Supabase aufsetzt."
  },
  {
    id: "friends",
    title: "Friends V1",
    copy: "Requests, Accept, Decline und Block funktionieren ohne Realtime."
  },
  {
    id: "wallet",
    title: "Wallet ready",
    copy: "Read-only in V1. Deposits und Withdrawals werden spaeter an echte Zahlungslogik angebunden."
  }
];

export const FRIEND_STATES = ["pending", "accepted", "blocked", "declined"];

export const DEFAULT_PAGE_SIZE = 8;
export const MAX_PAGE_SIZE = 25;

export const FREE_GAME_WINDOW_FEATURES = "noopener,noreferrer";
