import { Activity, ChevronRight, Sparkles, Wallet } from "lucide-react";
import { formatCurrency, formatNumber } from "../lib/formatters.js";

export function OverviewHome({ presentation, dashboardState, onMiniCardAction, onQuickAction }) {
  const progress = dashboardState.stats.progress;
  const wallet = dashboardState.wallet;
  const lastMatch = dashboardState.history.items[0];

  return (
    <section className="ovhome-grid">
      <article
        className="ovhome-hero"
      >
        <img className="ovhome-hero-art" src={presentation.hero.visualAsset} alt={presentation.hero.visualAlt} />
        <div className="ovhome-copy">
          <div className="ovhome-pills">
            {presentation.hero.badges.map((badge, index) => (
              <span key={badge} className={`ovhome-pill ${index === 0 ? "ovhome-pill-primary" : ""}`}>
                {badge}
              </span>
            ))}
          </div>

          <div className="ovhome-copy-block">
            <span className="ovhome-kicker">{presentation.hero.eyebrow}</span>
            <div className="ovhome-title-row">
              <h1 className="ovhome-title">{presentation.hero.title}</h1>
              <button type="button" className="ovhome-cta" onClick={onQuickAction}>
                <div>
                  <strong>{presentation.hero.footerTitle}</strong>
                  <span>{presentation.hero.footerCopy}</span>
                </div>
              </button>
            </div>
            <p className="ovhome-copy-text">{presentation.hero.copy}</p>
          </div>
        </div>
      </article>

      <aside className="ovhome-minis">
        {presentation.miniCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`ovhome-mini ovhome-mini-${card.id}`}
            onClick={() => onMiniCardAction(card)}
          >
            <div className={`ovhome-mini-cover ${card.accent}`} />
            <div className="ovhome-mini-copy">
              <strong>{card.title}</strong>
              <span>{card.subtitle}</span>
            </div>
            <ChevronRight size={20} />
          </button>
        ))}
      </aside>

      <section className="ovhome-strip" aria-label="Overview details">
        <article className="ovhome-strip-group">
          <div className="ovhome-strip-head">
            <Sparkles size={16} />
            <span>Player Progress</span>
          </div>
          <div className="ovhome-strip-metrics">
            <div className="ovhome-strip-metric">
              <span>XP</span>
              <strong>{formatNumber(progress.xp)}</strong>
            </div>
            <div className="ovhome-strip-metric">
              <span>Level</span>
              <strong>{progress.level}</strong>
            </div>
            <div className="ovhome-strip-metric">
              <span>Rank</span>
              <strong>{progress.rank}</strong>
            </div>
          </div>
        </article>

        <article className="ovhome-strip-group">
          <div className="ovhome-strip-head">
            <Activity size={16} />
            <span>Activity</span>
          </div>
          <div className="ovhome-strip-metrics">
            <div className="ovhome-strip-metric">
              <span>Last Match</span>
              <strong>{lastMatch?.mode || "No matches"}</strong>
            </div>
            <div className="ovhome-strip-metric">
              <span>Last Score</span>
              <strong>{formatNumber(lastMatch?.score || 0)}</strong>
            </div>
            <div className="ovhome-strip-metric">
              <span>History</span>
              <strong>{formatNumber(dashboardState.history.total)}</strong>
            </div>
          </div>
        </article>

        <article className="ovhome-strip-group ovhome-strip-group-wallet">
          <div className="ovhome-strip-head">
            <Wallet size={16} />
            <span>Wallet</span>
          </div>
          <div className="ovhome-strip-metrics">
            <div className="ovhome-strip-metric">
              <span>Cash</span>
              <strong>{formatCurrency(wallet.cash_balance)} $</strong>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
