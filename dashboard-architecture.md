# PlaySol Dashboard Architektur

## Scope und Guardrails

- Dieses Workspace ist nur fuer das Dashboard vorgesehen.
- Keine Aenderungen am eigentlichen Spielordner, Match-Client oder Spiel-Assets.
- Free Game wird extern gehostet; das Dashboard verlinkt oder startet den Flow nur.
- Ziel fuer Phase 1: Architektur festziehen und ein starkes Dashboard-Frontend als Produktbasis aufbauen.

## Produktbild

Das Dashboard ist die zentrale Account-, Progress- und Match-Hub-Oberflaeche fuer PlaySol.

Zielgruppen:

- Gastspieler, die sofort `Free Game` starten wollen.
- Registrierte Spieler, die Progress, Freunde, Wallet und Historie sehen wollen.
- Spaeter Cash- und Social-Spieler mit Party-, Referral- und Wallet-Bedarf.

Kernversprechen:

- `Play now` ohne Reibung fuer Free Game.
- Sauberer Upgrade-Pfad zu Login / Register mit Email und Google.
- Persistenter Spielerfortschritt fuer eingeloggte Nutzer.
- Eine Oberfläche fuer Spielstart, Progress, Stats, Social und Wallet.

## Priorisierte Hauptbereiche

1. Overview
2. Play Hub
3. Auth / Profil
4. Progression
5. Stats / Match-History
6. Friends / Party / Referral
7. Wallet / SOL / Echtgeld
8. Skins / Inventar
9. Quests / Rewards
10. Settings / Security

## Seitenstruktur

Empfohlene Routen:

- `/dashboard`
- `/dashboard/play`
- `/dashboard/profile`
- `/dashboard/progression`
- `/dashboard/stats`
- `/dashboard/friends`
- `/dashboard/wallet`
- `/dashboard/inventory`
- `/dashboard/settings`

UI-Aufteilung:

- Echte Seiten: `play`, `profile`, `stats`, `friends`, `wallet`, `inventory`, `settings`
- Dashboard-Startseite: modulare Panels innerhalb von `/dashboard`
- Modals: Login, Register, Deposit, Withdraw, Skin-Preview, Invite-Friend
- Popups / Toasts: Erfolg, Fehler, Queue-Status, Friend-Invite, Reward-Claim

## User-Flows

### Gastflow

1. Landing / Dashboard wird geoeffnet
2. Spieler klickt `Free Game direkt starten`
3. Dashboard oeffnet extern gehostetes Free Game
4. Gast kann spaeter aus dem Dashboard zu Register oder Login wechseln

### Authflow

1. Spieler waehlt `Registrieren` oder `Login`
2. Methoden: Email oder Google
3. Erfolgreicher Auth -> `/dashboard`
4. `GET /api/auth/me` hydratisiert Profil, Progress, Wallet und Quick Stats

### Free-Game-mit-Account

1. Eingeloggter User klickt `Free Game`
2. Dashboard speichert Kontext / Session-Metadaten
3. Externes Free Game startet
4. Nach Match-Rueckkehr werden Progress, Stats und Match-History aktualisiert

### Cash-Game-Flow

1. User oeffnet `Cash Game`
2. Buy-in, Balance, Limits und Eligibility werden geprueft
3. Queue oder Lobby-Beitritt
4. Match
5. Rueckkehr ins Dashboard mit Wallet- und Stats-Refresh

### Social-Flow

1. User sucht Freund per Username / Player-ID
2. Friend Request senden
3. Annahme
4. Party vorbereiten / Invite senden
5. Gemeinsam `Free` oder spaeter `Cash` starten

### Skin-Flow

1. User oeffnet Inventar
2. Filtert nach Owned / Equipped / Locked
3. Preview
4. `Equip` speichern
5. Aktiver Skin wird im naechsten Match verwendet

## Datenmodell

### User

```ts
type User = {
  id: string;
  username: string;
  email?: string;
  authProviders: ("email" | "google")[];
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isOnline: boolean;
  selectedSkinId?: string;
  xp: number;
  level: number;
  rank: string;
  referralCode?: string;
  stats: PlayerStats;
  wallet: WalletSummary;
  progression: ProgressionSummary;
  inventory: InventorySummary;
  settings: UserSettings;
};
```

### PlayerStats

```ts
type PlayerStats = {
  gamesPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  highestScore: number;
  highestMass: number;
  timePlayedSeconds: number;
  bestPlacement: number;
  bestKillstreak: number;
  laserDamageDealt: number;
  laserDamageTaken: number;
  shotsFired: number;
  shotsHit: number;
  engulfCount: number;
};
```

### WalletSummary

```ts
type WalletSummary = {
  solBalance: number;
  cashBalance: number;
  bonusBalance: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  lifetimeDeposited: number;
  lifetimeWithdrawn: number;
};
```

### ProgressionSummary

```ts
type ProgressionSummary = {
  currentTier: string;
  xpToNextLevel: number;
  seasonLevel?: number;
  battlePassTier?: number;
  dailyRewardReady: boolean;
  questCountOpen: number;
};
```

### Skin und Inventory

```ts
type Skin = {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  previewUrl: string;
  assetType: "skin" | "trail" | "aura" | "ring";
  owned: boolean;
  equipped: boolean;
  unlockType: "default" | "shop" | "reward" | "event";
};

type InventorySummary = {
  selectedSkinId?: string;
  ownedSkinIds: string[];
  currencies: {
    shards: number;
    tickets: number;
  };
};
```

### Social

```ts
type Friend = {
  userId: string;
  username: string;
  avatarUrl?: string;
  status: "online" | "offline" | "in_game" | "queueing";
  partyInviteState: "none" | "sent" | "received";
  lastSeen?: string;
};

type MatchHistoryEntry = {
  matchId: string;
  mode: "free" | "cash" | "coop" | "team";
  placement: number;
  score: number;
  kills: number;
  durationSeconds: number;
  xpGained: number;
  reward: number;
  playedAt: string;
};
```

## API-Liste fuer Phase 1

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### User / Profile

- `GET /api/user/profile`
- `PATCH /api/user/profile`
- `GET /api/user/progression`
- `GET /api/user/stats`
- `GET /api/user/match-history`

### Play

- `GET /api/game/modes`
- `POST /api/game/join/free`
- `POST /api/game/join/cash`
- `GET /api/game/queue-status`

### Wallet

- `GET /api/wallet/balance`
- `GET /api/wallet/transactions`
- `POST /api/wallet/deposit`
- `POST /api/wallet/withdraw`

### Social

- `GET /api/friends`
- `GET /api/friends/requests`
- `POST /api/friends/request`
- `POST /api/friends/accept`
- `POST /api/friends/remove`
- `POST /api/party/invite`

### Inventory / Skins

- `GET /api/skins`
- `GET /api/user/inventory`
- `POST /api/user/skins/equip`

### Referral / Rewards

- `GET /api/referral`
- `POST /api/referral/generate`
- `GET /api/rewards/daily`
- `POST /api/rewards/daily/claim`

## API-Response-Grundform

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
```

## Echtzeit-Funktionen

Empfohlen fuer spaeter:

- `friend.status.updated`
- `party.invite.received`
- `party.member.updated`
- `queue.status.updated`
- `wallet.balance.updated`
- `notification.created`

Live im Dashboard:

- Freunde online / offline
- Queue-Status
- Party-Status
- Balance-Refresh nach Match oder Reward
- Globale Player-Counts / Lobbystatus

## Auth-Regeln

- Gast darf Dashboard sehen und Free Game starten.
- Cash, Wallet, Progress-Sync, Inventar und Social benoetigen Auth.
- Methoden in Phase 1: Email + Google.
- Empfohlen: Access Token + Refresh Flow, spaeter auf sichere Cookie-Strategie ziehen.
- Bei Token-Ablauf: stiller Refresh, sonst Redirect in Auth-Modal.

## Wallet-Produktlogik

- Phantom oder andere Wallet-Provider spaeter optional, nicht Pflicht fuer Phase 1.
- Dashboard trennt klar zwischen `Free Play`, `Cash Balance` und `SOL Balance`.
- Withdraw nur fuer verifizierte und eingeloggte Accounts.
- Pending-Zahlungen und letzte Transaktionen sichtbar.
- Cash Game Join prueft Balance, Limits, Pending-Status und Sperren.

## Spielmodi

- `Free Game`
  - fuer Gaeste sofort verfuegbar
  - kein Buy-in
  - klarer CTA im Dashboard
- `Cash FFA`
  - nur eingeloggt
  - Buy-in Pflicht
  - Queue- / Lobby-Status notwendig
- `Team Cash`
  - nur eingeloggt
  - Party / Teamlogik vorbereiten
- `Coop Cash`
  - nur eingeloggt
  - Teamgroesse und Reward-Logik spaeter definieren

## UX-Regeln

- Desktop first, responsive bis Tablet / Mobile.
- Stil: sci-fi premium, dunkel, klarer Fokus auf Play-CTA.
- Dashboard darf nicht wie ein generisches SaaS-Adminpanel wirken.
- `Free Game` ist die dominanteste Aktion.
- Auth-Nutzen muss direkt daneben sichtbar sein: Progress, XP, Friends, Wallet.
- Immer definierte Loading-, Error- und Empty-States mit Skeletons oder leichten Platzhaltern.

## Technische Leitplanken

- Der aktuelle Dashboard-Workspace ist vorerst statisches Frontend.
- Dashboard darf neu strukturiert werden, auch wenn bestehende Prototyp-Dateien ersetzt oder aufgeraeumt werden.
- Keine Annahme, dass bestehende Backend-Routen bereits fertig oder stabil sind.
- Frontend sollte so gebaut sein, dass spaeter API-Hydration einfach anschliessbar ist.

## Phase-1-Deliverables

1. Saubere Dashboard-Informationsarchitektur
2. Starkes Frontend-Prototype mit klaren Sections und Flows
3. API- und Datenmodell-Basis fuer spaetere Integration
4. Harte Scope-Grenze: nur Dashboard, keine Eingriffe ins eigentliche Spiel
