import {
  Activity,
  ArrowRightLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
  Coins,
  Gem,
  Gift,
  Heart,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Swords,
  Trophy,
  Users,
  Wallet
} from "lucide-react";
import { formatCurrency, formatDuration, formatNumber } from "../lib/formatters.js";

function EmptyPanel({ title, copy }) {
  return (
    <div className="empty-panel">
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function Segment({ label, value, helper }) {
  return (
    <div className="flat-segment">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

function SkinTile({ title, status, meta, rarity }) {
  return (
    <article className="showcase-skin-card">
      <div className="showcase-skin-frame" />
      <div className={`showcase-skin-visual rarity-${rarity || "common"}`}>
        <Gem size={42} strokeWidth={1.5} />
      </div>
      <strong className="showcase-skin-title">{title}</strong>
      <span className="showcase-skin-status">{status}</span>
      {meta ? <small className="showcase-skin-meta">{meta}</small> : null}
      <div className="showcase-skin-social">
        <button type="button" className="showcase-icon-button" aria-label="Like skin">
          <Heart size={14} />
        </button>
        <button type="button" className="showcase-icon-button" aria-label="Share skin">
          <Share2 size={14} />
        </button>
        <button type="button" className="showcase-icon-button" aria-label="Send skin">
          <Send size={14} />
        </button>
      </div>
      <button type="button" className="fx-glow-button showcase-cta">
        Equip Skin
      </button>
    </article>
  );
}

function MarketplaceTile({ item }) {
  return (
    <article className="showcase-market-card">
      <div className="showcase-skin-frame" />
      <div className={`showcase-skin-visual showcase-skin-visual-market rarity-${item.rarity || "common"}`}>
        <div className="showcase-skin-stars" />
        <div className="showcase-skin-floater">
          <Gem size={56} strokeWidth={1.35} />
        </div>
      </div>
      <div className="showcase-market-copy">
        <strong className="showcase-skin-title">{item.name}</strong>
        <ul className="showcase-market-bullets">
          {item.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
      <div className="showcase-skin-social">
        <button type="button" className="showcase-icon-button" aria-label="Like market item">
          <Heart size={14} />
        </button>
        <button type="button" className="showcase-icon-button" aria-label="Share market item">
          <Share2 size={14} />
        </button>
        <button type="button" className="showcase-icon-button" aria-label="Send market item">
          <Send size={14} />
        </button>
      </div>
      <div className="showcase-market-footer">
        <div className="showcase-market-price">
          <strong>{item.price}</strong>
          <small>{item.status}</small>
        </div>
        <button type="button" className="fx-glow-button showcase-cta">
          {item.action}
        </button>
      </div>
    </article>
  );
}

function FriendRows({ items, emptyText, actions }) {
  if (!items.length) {
    return <div className="friend-empty">{emptyText}</div>;
  }

  return (
    <div className="friend-rows">
      {items.map((item) => (
        <div key={item.id} className="friend-row-slim">
          <div className="friend-avatar" />
          <div className="friend-row-copy">
            <strong>{item.username || item.email || "Unknown"}</strong>
            <span>{item.email || item.friend_state}</span>
          </div>
          <div className="friend-row-actions">{actions ? actions(item) : null}</div>
        </div>
      ))}
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
  const progress = dashboardState.stats.progress;
  const performance = dashboardState.stats.stats;
  const inventory = dashboardState.inventory;
  const wallet = dashboardState.wallet;

  const inventoryTiles = inventory.items.map((item) => ({
    id: item.id,
    title: item.item_key,
    status: item.item_type,
    meta: `x${item.quantity}`,
    rarity: item.rarity || "common"
  }));

  const marketItems = (inventoryTiles.length ? inventoryTiles : [
    { id: "m1", title: "Alien Donut", status: "Epic", meta: "Tradable", rarity: "epic" },
    { id: "m2", title: "Neon Slime", status: "Rare", meta: "Animated Glow", rarity: "rare" },
    { id: "m3", title: "Void Core", status: "Common", meta: "Browser Wallet", rarity: "common" }
  ])
    .flatMap((item, index) =>
      Array.from({ length: inventoryTiles.length ? 1 : 3 }, (_, duplicateIndex) => ({
        id: `${item.id}-${duplicateIndex}`,
        title: item.title,
        status: item.status,
        meta: item.meta,
        rarity: item.rarity,
        order: index * 3 + duplicateIndex
      }))
    )
    .map((item, index) => ({
    id: item.id,
    name: item.title,
    rarity: item.rarity,
    bullets: [item.status, item.meta || "Tradable", "Browser Wallet"].slice(0, 3),
    price: index === 0 ? "$1.90" : index === 1 ? "$1.25" : "$0.95",
    status: index === 0 ? "Buy" : "Listed",
    action: index === 0 ? "Buy now" : "Buy"
  }));

  if (activeSection === "play") {
    return (
      <section className="page-lower page-lower-play">
        <article className="flat-action-bar">
          <div className="flat-action-copy">
            <span className="flat-kicker">Free Game Action</span>
            <strong>Jump straight into the live browser lobby</strong>
            <small>Opens in a new tab and keeps the dashboard lightweight.</small>
          </div>
          <button type="button" className="fx-glow-button play-launch-button" onClick={onOpenFreeGame}>
            Open Free Game
          </button>
        </article>

        <article className="promo-banner promo-banner-cash">
          <div className="promo-copy">
            <span className="flat-kicker">Cashgame - $1 Buy-in</span>
            <strong>Coming Soon</strong>
            <ul className="compact-point-list">
              <li>50 players per lobby</li>
              <li>20 min match</li>
              <li>Top 22 get $1 back</li>
              <li>Top 3 split the remaining pool by placement</li>
            </ul>
          </div>
          <div className="promo-side">
            <span className="promo-badge">$1 Buy-in</span>
            <div className="promo-prize-box">
              <span>Top 22</span>
              <strong>$1 refund</strong>
              <small>Top 3 split pool</small>
            </div>
          </div>
        </article>
      </section>
    );
  }

  if (activeSection === "inventory") {
    return (
      <section className="page-lower page-lower-inventory">
        <div className="flat-strip flat-strip-three">
          <Segment label="Equipped" value={inventory.equipped.length} helper="active skins" />
          <Segment label="Owned" value={inventory.total_items} helper="total items" />
          <Segment
            label="Rarity"
            value={inventory.items.filter((item) => item.rarity === "rare" || item.rarity === "epic").length}
            helper="rare + epic"
          />
        </div>

        {inventoryTiles.length ? (
          <div className="skin-grid-wrap">
            {inventoryTiles.map((item) => (
              <SkinTile key={item.id} title={item.title} status={item.status} meta={item.meta} rarity={item.rarity} />
            ))}
          </div>
        ) : (
          <EmptyPanel
            title="Noch keine Skins"
            copy="Sobald Free Game Rewards oder Marketplace-Kaeufe geschrieben werden, erscheinen die Visual-Cards hier automatisch."
          />
        )}
      </section>
    );
  }

  if (activeSection === "marketplace") {
    return (
      <section className="page-lower page-lower-marketplace">
        <div className="market-toolbar">
          <label className="market-toolbar-field fx-glass-input">
            <Search size={14} />
            <input placeholder="Search skin" readOnly value="" />
          </label>
          <button type="button" className="market-chip fx-glass-chip">Sort by price</button>
          <button type="button" className="market-chip fx-glass-chip">Filter rarity</button>
          <button type="button" className="market-chip fx-glass-chip">Filter price</button>
          <div className="market-toggle fx-toggle-group">
            <button type="button" className="active">Buy</button>
            <button type="button">Sell</button>
          </div>
        </div>

        <div className="market-grid">
          {marketItems.map((item) => (
            <MarketplaceTile key={item.id} item={item} />
          ))}
        </div>
      </section>
    );
  }

  if (activeSection === "history") {
    return (
      <section className="page-lower page-lower-history">
        {filteredHistoryItems.length ? (
          <div className="history-feed">
            {filteredHistoryItems.map((match) => (
              <div key={match.id} className="history-feed-row">
                <strong>{match.mode || "Unknown"}</strong>
                <span>#{match.placement ?? "-"}</span>
                <span>{formatNumber(match.score)}</span>
                <span>{match.kills ?? 0} kills</span>
                <span>+{match.xp_gained ?? 0} XP</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel
            title="Noch keine Matches"
            copy="Sobald Matchdaten geschrieben werden, tauchen sie hier als kompakter Activity-Feed auf."
          />
        )}
      </section>
    );
  }

  if (activeSection === "stats") {
    const kdRatio = performance.deaths ? (performance.kills / performance.deaths).toFixed(2) : performance.kills.toFixed(2);

    return (
      <section className="page-lower page-lower-stats">
        <article className="metric-block">
          <div className="metric-block-head">
            <Sparkles size={16} />
            <span>Progress</span>
          </div>
          <div className="metric-block-main">
            <div className="mini-ring">
              <div className="mini-ring-center">
                <strong>{progress.level}</strong>
                <span>Level</span>
              </div>
            </div>
            <div className="metric-inline-row">
              <Segment label="XP" value={formatNumber(progress.xp)} />
              <Segment label="Level" value={progress.level} />
              <Segment label="Rank" value={progress.rank} />
            </div>
          </div>
        </article>

        <article className="metric-block">
          <div className="metric-block-head">
            <Trophy size={16} />
            <span>Performance</span>
          </div>
          <div className="metric-inline-row metric-inline-row-four">
            <Segment label="Games" value={performance.games_played} />
            <Segment label="Wins" value={performance.wins} />
            <Segment label="K/D" value={kdRatio} />
            <Segment label="Highscore" value={formatNumber(performance.highest_score)} />
          </div>
        </article>
      </section>
    );
  }

  if (activeSection === "wallet") {
    return (
      <section className="page-lower page-lower-wallet">
        <div className="flat-strip flat-strip-four">
          <Segment label="Cash" value={`${formatCurrency(wallet.cash_balance)} $`} />
          <Segment label="SOL" value={`${formatCurrency(wallet.sol_balance)} SOL`} />
          <Segment label="Pending deposits" value={formatCurrency(wallet.pending_deposits)} />
          <Segment label="Pending withdrawals" value={formatCurrency(wallet.pending_withdrawals)} />
        </div>
      </section>
    );
  }

  if (activeSection === "friends") {
    return (
      <section className="page-lower page-lower-friends">
        <article className="friend-pane">
          <div className="friend-pane-head">
            <div>
              <span className="flat-kicker">Requests</span>
              <strong>Incoming first</strong>
            </div>
            <span className="friend-pane-count">{filteredIncomingFriends.length}</span>
          </div>

          <form className="friend-form friend-form-slim" onSubmit={onFriendRequest}>
            <label>
              <input value={friendRequestName} onChange={(event) => setFriendRequestName(event.target.value)} placeholder="friend_username" />
            </label>
            <button type="submit" className="primary-button" disabled={friendBusy}>
              {friendBusy ? "Senden..." : "Request senden"}
            </button>
          </form>

          <FriendRows
            items={filteredIncomingFriends.slice(0, 6)}
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
        </article>

        <article className="friend-pane">
          <div className="friend-pane-head">
            <div>
              <span className="flat-kicker">Connected</span>
              <strong>Main list</strong>
            </div>
            <span className="friend-pane-count">{filteredAcceptedFriends.length}</span>
          </div>

          <FriendRows items={filteredAcceptedFriends.slice(0, 6)} emptyText="Noch keine Friends." />

          <div className="friend-secondary-meta">
            <span>Outgoing: {filteredOutgoingFriends.length}</span>
            <span>Blocked: {filteredBlockedFriends.length}</span>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-lower page-lower-overview-fallback">
      <EmptyPanel title="Overview bleibt oben" copy="Die Main-Dashboard-Seite nutzt ihre eigene Home-Struktur und wird hier nicht mehr verdoppelt." />
    </section>
  );
}
