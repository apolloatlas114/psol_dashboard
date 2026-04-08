import { BriefcaseBusiness, ChevronRight, Coins, Gift, PieChart, ShieldCheck, Sparkles, Swords, Trophy, Users, Wallet } from "lucide-react";
import { GAME_MODE_CARDS, OVERVIEW_FEATURES } from "@shared/index.js";
import { formatCurrency, formatDuration, formatNumber } from "../lib/formatters.js";

function EmptyPanel({ title, copy }) {
  return (
    <div className="empty-panel">
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function FriendColumn({ title, items, emptyText, actions }) {
  return (
    <div className="friend-column">
      <div className="friend-column-head">
        <strong>{title}</strong>
        <span>{items.length}</span>
      </div>
      {items.length ? (
        <div className="friend-column-list">
          {items.map((item) => (
            <div key={item.id} className="friend-item">
              <div className="friend-avatar" />
              <div className="friend-copy">
                <strong>{item.username || item.email || "Unknown"}</strong>
                <span>{item.email || item.friend_state}</span>
              </div>
              <div className="friend-actions">{actions ? actions(item) : null}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="friend-empty">{emptyText}</div>
      )}
    </div>
  );
}

export function LoadingCard() {
  return (
    <article className="large-panel loading-card">
      <ShieldCheck className="spin" size={22} />
      <div>
        <h3>Dashboard wird synchronisiert</h3>
        <p>Profile, Stats, Wallet, Inventory und Friends werden gerade geladen.</p>
      </div>
    </article>
  );
}

export function GuardCard({ onLogin }) {
  return (
    <article className="large-panel guard-card">
      <div className="guard-copy">
        <span className="eyebrow">Member Area</span>
        <h3>Dieser Bereich braucht einen Account</h3>
        <p>
          Free Game bleibt sofort verfuegbar. Fuer Match-History, Friends, Inventory, Wallet und gespeicherten Progress
          bitte mit Email oder Google anmelden.
        </p>
      </div>
      <div className="guard-actions">
        <button type="button" className="primary-button" onClick={onLogin}>
          Login / Register
        </button>
      </div>
    </article>
  );
}

export function SectionContent({
  activeSection,
  dashboardState,
  filteredHistoryItems,
  filteredAcceptedFriends,
  filteredIncomingFriends,
  filteredOutgoingFriends,
  filteredBlockedFriends,
  friendRequestName,
  setFriendRequestName,
  onFriendRequest,
  onFriendAction,
  friendBusy,
  onOpenAuth,
  onOpenFreeGame
}) {
  if (activeSection === "play") {
    return (
      <>
        <article className="card mode-card">
          <div className="card-header-inline">
            <h3 className="card-title">Game Modes</h3>
            <span className="pill ghost">Free first</span>
          </div>
          <div className="mode-list">
            {GAME_MODE_CARDS.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`mode-list-item ${mode.locked ? "locked" : ""}`}
                onClick={() => {
                  if (mode.id === "free") {
                    onOpenFreeGame();
                    return;
                  }
                  onOpenAuth();
                }}
              >
                <div className={`cover ${mode.accent}`} />
                <div className="mode-list-copy">
                  <strong>{mode.title}</strong>
                  <span>{mode.description}</span>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </article>

        <article className="card hub-card">
          <div className="card-header-inline">
            <h3 className="card-title">Launch Rules</h3>
            <span className="pill ghost">V1</span>
          </div>
          <ul className="plain-list">
            <li>Free Game startet direkt in neuem Tab.</li>
            <li>Cash Modes bleiben vorbereitet, bis Wallet und Queue-Logik live sind.</li>
            <li>Gast-User sehen das Dashboard, aber nur Member speichern Progress und Stats.</li>
          </ul>
        </article>

        <article className="wallet-banner">
          <div className="wallet-icon">
            <Swords size={24} />
          </div>
          <div>
            <div className="wallet-title">Instant Play</div>
            <span className="wallet-tag">No API needed for Free Game link</span>
          </div>
          <div className="wallet-values">
            Free Game ist direkt clientseitig konfiguriert.
            <span>Wenn spaeter Region oder Maintenance-Logik kommt, kann daraus ein API-Case werden.</span>
          </div>
          <div className="wallet-actions">
            <button type="button" className="action-button play" onClick={onOpenFreeGame}>
              <ChevronRight size={16} />
            </button>
          </div>
        </article>
      </>
    );
  }

  if (activeSection === "inventory") {
    return (
      <>
        <article className="card stat-card">
          <div className="card-header-inline">
            <h3 className="card-title">Inventory Summary</h3>
            <span className="pill">{dashboardState.inventory.total_items} items</span>
          </div>
          {dashboardState.inventory.items.length ? (
            <div className="token-grid">
              {dashboardState.inventory.items.map((item) => (
                <div key={item.id} className="token-card">
                  <span className={`token-swatch rarity-${item.rarity || "common"}`} />
                  <strong>{item.item_key}</strong>
                  <span>
                    {item.item_type} x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Noch keine Items"
              copy="Inventory ist bereits als API vorbereitet. Sobald das Spiel Items oder Skins nach Supabase schreibt, erscheinen sie hier."
            />
          )}
        </article>

        <article className="card hub-card">
          <div className="card-header-inline">
            <h3 className="card-title">Equipped Slots</h3>
            <span className="pill ghost">Read-only</span>
          </div>
          {dashboardState.inventory.equipped.length ? (
            <div className="token-grid compact">
              {dashboardState.inventory.equipped.map((item) => (
                <div key={item.id} className="token-card compact">
                  <span className={`token-swatch rarity-${item.rarity || "common"}`} />
                  <strong>{item.item_key}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="Keine aktiven Cosmetics"
              copy="Ausruestung bleibt in V1 bewusst schlank, damit spaeter keine Gameplay-Logik am Dashboard haengt."
            />
          )}
        </article>

        <article className="wallet-banner">
          <div className="wallet-icon">
            <Gift size={24} />
          </div>
          <div>
            <div className="wallet-title">Rewards / Battle Pass spaeter</div>
            <span className="wallet-tag">Bestehender Sidebar-Slot sinnvoll genutzt</span>
          </div>
          <div className="wallet-values">
            Inventory und Rewards teilen sich V1 einen kompakten Bereich statt zwei aufgeblasene Menues.
            <span>Das spart Platz und haelt die Navigation nahe am Mockup.</span>
          </div>
        </article>
      </>
    );
  }

  if (activeSection === "history") {
    return (
      <article className="large-panel history-panel">
        <div className="card-header-inline">
          <h3 className="card-title">Match History</h3>
          <span className="pill">
            {dashboardState.history.total} total / page {dashboardState.history.page}
          </span>
        </div>
        {filteredHistoryItems.length ? (
          <div className="history-list">
            {filteredHistoryItems.map((match) => (
              <div key={match.id} className="history-row">
                <div>
                  <strong>{match.mode || "Unknown mode"}</strong>
                  <span>{new Date(match.played_at).toLocaleString("de-DE")}</span>
                </div>
                <div>
                  <strong>#{match.placement ?? "-"}</strong>
                  <span>Placement</span>
                </div>
                <div>
                  <strong>{formatNumber(match.score)}</strong>
                  <span>Score</span>
                </div>
                <div>
                  <strong>{match.kills ?? 0}</strong>
                  <span>Kills</span>
                </div>
                <div>
                  <strong>+{match.xp_gained ?? 0} XP</strong>
                  <span>{match.reward_label || "No reward"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel
            title="Noch keine Matches"
            copy="Die Response ist bereits empty-state-faehig. Sobald das Spiel Matchdaten schreibt, kann hier ohne Frontend-Umbau paginiert werden."
          />
        )}
      </article>
    );
  }

  if (activeSection === "stats") {
    const performance = dashboardState.stats.stats;
    const progress = dashboardState.stats.progress;
    const kdRatio = performance.deaths ? (performance.kills / performance.deaths).toFixed(2) : performance.kills.toFixed(2);

    return (
      <>
        <div className="cards-grid">
          <article className="card stat-card">
            <div className="mini-icon">
              <Trophy size={18} />
            </div>
            <h3 className="card-title">Performance</h3>
            <div className="metric-pair">
              <span>Games</span>
              <strong>{performance.games_played}</strong>
            </div>
            <div className="metric-pair">
              <span>Wins</span>
              <strong>{performance.wins}</strong>
            </div>
            <div className="metric-pair">
              <span>K/D</span>
              <strong>{kdRatio}</strong>
            </div>
          </article>

          <article className="card hub-card">
            <div className="mini-icon">
              <Sparkles size={18} />
            </div>
            <h3 className="card-title">Progress</h3>
            <div className="metric-pair">
              <span>XP</span>
              <strong>{formatNumber(progress.xp)}</strong>
            </div>
            <div className="metric-pair">
              <span>Level</span>
              <strong>{progress.level}</strong>
            </div>
            <div className="metric-pair">
              <span>Rank</span>
              <strong>{progress.rank}</strong>
            </div>
          </article>
        </div>

        <article className="wallet-banner">
          <div className="wallet-icon">
            <PieChart size={24} />
          </div>
          <div>
            <div className="wallet-title">Stats vs Progress bleibt getrennt</div>
            <span className="wallet-tag">Growth und Performance laufen bewusst ueber eigene Datenbereiche</span>
          </div>
          <div className="wallet-values">
            Highest Score: {formatNumber(performance.highest_score)}
            <span>
              Highest Mass: {formatNumber(performance.highest_mass)} / Time Played: {formatDuration(performance.time_played_seconds)}
            </span>
          </div>
        </article>
      </>
    );
  }

  if (activeSection === "wallet") {
    return (
      <>
        <div className="cards-grid">
          <article className="card stat-card">
            <div className="mini-icon">
              <Wallet size={18} />
            </div>
            <h3 className="card-title">Cash Balance</h3>
            <div className="money-value">{formatCurrency(dashboardState.wallet.cash_balance)} $</div>
            <p className="card-text">Read-only in V1, damit spaeter echte Deposit- und Withdraw-Logik sauber andocken kann.</p>
          </article>

          <article className="card hub-card">
            <div className="mini-icon">
              <Coins size={18} />
            </div>
            <h3 className="card-title">SOL Balance</h3>
            <div className="money-value">{formatCurrency(dashboardState.wallet.sol_balance)} SOL</div>
            <p className="card-text">Pending Deposits und Pending Withdrawals sind als Datenform schon vorbereitet.</p>
          </article>
        </div>

        <article className="wallet-banner">
          <div className="wallet-icon">
            <BriefcaseBusiness size={24} />
          </div>
          <div>
            <div className="wallet-title">Pending Flow</div>
            <span className="wallet-tag">Wallet V1 ist absichtlich read-only</span>
          </div>
          <div className="wallet-values">
            Pending deposits: {formatCurrency(dashboardState.wallet.pending_deposits)}
            <span>Pending withdrawals: {formatCurrency(dashboardState.wallet.pending_withdrawals)}</span>
          </div>
        </article>
      </>
    );
  }

  if (activeSection === "friends") {
    return (
      <article className="large-panel friends-panel">
        <div className="card-header-inline">
          <h3 className="card-title">Friend Requests</h3>
          <span className="pill ghost">ohne Realtime</span>
        </div>

        <form className="friend-form" onSubmit={onFriendRequest}>
          <label>
            Username
            <input value={friendRequestName} onChange={(event) => setFriendRequestName(event.target.value)} placeholder="friend_username" />
          </label>
          <button type="submit" className="primary-button" disabled={friendBusy}>
            {friendBusy ? "Senden..." : "Request senden"}
          </button>
        </form>

        <div className="friends-columns">
          <FriendColumn title="Accepted" items={filteredAcceptedFriends} emptyText="Noch keine Friends." />
          <FriendColumn
            title="Incoming"
            items={filteredIncomingFriends}
            emptyText="Keine eingehenden Requests."
            actions={(item) => (
              <>
                <button type="button" className="mini-action accept" onClick={() => onFriendAction(item.id, "accept")}>
                  Accept
                </button>
                <button type="button" className="mini-action decline" onClick={() => onFriendAction(item.id, "decline")}>
                  Decline
                </button>
              </>
            )}
          />
          <FriendColumn
            title="Outgoing"
            items={filteredOutgoingFriends}
            emptyText="Keine offenen Requests."
            actions={(item) => (
              <button type="button" className="mini-action block" onClick={() => onFriendAction(item.id, "block")}>
                Block
              </button>
            )}
          />
          <FriendColumn title="Blocked" items={filteredBlockedFriends} emptyText="Niemand blockiert." />
        </div>
      </article>
    );
  }

  return (
    <>
      <div className="cards-grid">
        <article className="card stat-card">
          <div className="mini-icon">
            <Sparkles size={18} />
          </div>
          <h3 className="card-title">Progress</h3>
          <div className="metric-pair">
            <span>XP</span>
            <strong>{formatNumber(dashboardState.stats.progress.xp)}</strong>
          </div>
          <div className="metric-pair">
            <span>Level</span>
            <strong>{dashboardState.stats.progress.level}</strong>
          </div>
          <div className="metric-pair">
            <span>Rank</span>
            <strong>{dashboardState.stats.progress.rank}</strong>
          </div>
        </article>

        <article className="card hub-card">
          <h3 className="card-title">Dashboard V1</h3>
          <div className="feature-list">
            {OVERVIEW_FEATURES.map((feature) => (
              <div key={feature.title} className="feature-item">
                <strong>{feature.title}</strong>
                <span>{feature.description}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="wallet-banner">
        <div className="wallet-icon">
          <Wallet size={24} />
        </div>
        <div>
          <div className="wallet-title">Account / Wallet</div>
          <span className="wallet-tag">Read-only V1</span>
        </div>
        <div className="wallet-values">
          Cash balance: {formatCurrency(dashboardState.wallet.cash_balance)} $
          <span>SOL balance: {formatCurrency(dashboardState.wallet.sol_balance)} SOL</span>
        </div>
      </article>
    </>
  );
}
