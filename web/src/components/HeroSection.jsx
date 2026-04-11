import { Coins, Gem, History, ShieldCheck, ShoppingBag, Sparkles, Users, Wallet } from "lucide-react";

function renderVisual(hero) {
  switch (hero.variant) {
    case "play":
      return (
        <div className="section-hero-visual-stack visual-play">
          <div className="visual-play-monitor">
            <span className="visual-dot visual-dot-cyan" />
            <span className="visual-dot visual-dot-pink" />
            <span className="visual-dot visual-dot-gold" />
          </div>
          <div className="visual-play-rows">
            <div>
              <strong>Free Game</strong>
              <span>Live now</span>
            </div>
            <div>
              <strong>Cashgame</strong>
              <span>Coming soon</span>
            </div>
          </div>
        </div>
      );
    case "inventory":
      return (
        <div className="section-hero-visual-stack visual-inventory">
          {["Epic", "Rare", "Owned"].map((label, index) => (
            <div key={label} className={`visual-skin-mini visual-skin-mini-${index + 1}`}>
              <Gem size={18} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      );
    case "marketplace":
      return (
        <div className="section-hero-visual-stack visual-market">
          <div className="visual-market-toolbar">
            <span className="visual-market-pill active">Buy</span>
            <span className="visual-market-pill">Epic</span>
            <span className="visual-market-pill">Low price</span>
          </div>
          <div className="visual-market-card">
            <ShoppingBag size={18} />
            <div>
              <strong>Alien Donut</strong>
              <span>Floor starts at $1.00</span>
            </div>
          </div>
        </div>
      );
    case "history":
      return (
        <div className="section-hero-visual-stack visual-history">
          {["Free Game · #4 · +80 XP", "Coop · #2 · +120 XP", "Team Battle · #9 · +40 XP"].map((row) => (
            <div key={row} className="visual-feed-row">
              <History size={14} />
              <span>{row}</span>
            </div>
          ))}
        </div>
      );
    case "stats":
      return (
        <div className="section-hero-visual-stack visual-stats">
          <div className="visual-mini-ring">
            <div>
              <strong>{hero.visualValue}</strong>
              <span>{hero.visualFooter}</span>
            </div>
          </div>
          <div className="visual-metric-chip">
            <Sparkles size={16} />
            <span>{hero.footerTitle}</span>
          </div>
        </div>
      );
    case "wallet":
      return (
        <div className="section-hero-visual-stack visual-wallet">
          <div className="visual-vial">
            <div className="visual-vial-fluid" />
          </div>
          <div className="visual-wallet-strip">
            <span>Cash</span>
            <span>SOL</span>
            <span>Pending</span>
          </div>
        </div>
      );
    case "profile":
      return (
        <div className="section-hero-visual-stack visual-profile">
          <div className="visual-profile-avatar">
            <span className="profile-face profile-face-gold" />
          </div>
          <div className="visual-profile-meta">
            <div className="visual-mini-ring">
              <div>
                <strong>{hero.visualValue}</strong>
                <span>Level</span>
              </div>
            </div>
            <div className="visual-metric-chip">
              <ShieldCheck size={16} />
              <span>{hero.visualFooter}</span>
            </div>
          </div>
        </div>
      );
    case "friends":
      return (
        <div className="section-hero-visual-stack visual-friends">
          <div className="visual-friend-row">
            <span className="visual-avatar" />
            <div>
              <strong>Requests</strong>
              <span>Prioritized first</span>
            </div>
          </div>
          <div className="visual-friend-row">
            <span className="visual-avatar visual-avatar-alt" />
            <div>
              <strong>Connected</strong>
              <span>Main list stays compact</span>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="section-hero-visual-stack visual-generic">
          <Sparkles size={18} />
          <span>{hero.visualFooter}</span>
        </div>
      );
  }
}

export function HeroSection({ hero, miniCards, onMiniCardAction }) {
  if (hero.variant === "play") {
    return (
      <section className="play-hub-top">
        <article
          className="play-banner play-banner-free"
          style={{ backgroundImage: `url(${hero.visualAsset})` }}
        >
          <div className="play-banner-copy">
            <div className="play-banner-badges">
              <span className="section-hero-badge">Collect XP</span>
              <span className="section-hero-badge">Boss Hunt</span>
              <span className="section-hero-badge">Squad Up</span>
            </div>
            <span className="play-banner-eyebrow">ZERO BUY-IN<br />SURVIVAL MODE</span>
            <div className="play-banner-title-row">
              <h1 className="play-banner-title">PlaySol Free Game</h1>
              <div className="play-banner-cta">
                <strong>Free Run</strong>
                <span>Level 1 stays linked</span>
              </div>
            </div>
            <p className="play-banner-summary">Drop back in, stack XP, hunt bosses and survive the arena.</p>
          </div>
        </article>

        <article className="play-banner play-banner-cash">
          <div className="play-banner-cash-inner">
            <span className="play-banner-placeholder-pill">Coming Soon</span>
            <strong>{hero.secondaryTitle}</strong>
            <p>{hero.secondaryCopy}</p>
          </div>
        </article>
      </section>
    );
  }

  const hasSide = miniCards.length > 0;

  return (
    <section className={`section-hero section-hero-compact ${hasSide ? "section-hero-with-side" : "section-hero-solo"} section-hero-${hero.variant}`}>
      <article className={`section-hero-card section-hero-card-${hero.variant}`}>
        <div className="section-hero-copy">
          <div className="section-hero-badges">
            {hero.badges.slice(0, 3).map((badge) => (
              <span key={badge} className="section-hero-badge">
                {badge}
              </span>
            ))}
          </div>

          <div className="section-hero-copy-stack">
            <span className="section-hero-eyebrow">{hero.eyebrow}</span>
            <h1 className="section-hero-title">{hero.title}</h1>
            <p className="section-hero-summary">{hero.copy}</p>
          </div>

          <div className="section-hero-meta">
            <div className="section-hero-note">
              {hero.variant === "wallet" ? <Wallet size={14} /> : hero.variant === "inventory" || hero.variant === "marketplace" ? <ShoppingBag size={14} /> : hero.variant === "friends" ? <Users size={14} /> : hero.variant === "play" ? <ShieldCheck size={14} /> : <Coins size={14} />}
              <div>
                <strong>{hero.footerTitle}</strong>
                <span>{hero.footerCopy}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`section-hero-visual section-hero-visual-${hero.variant}`}>{renderVisual(hero)}</div>
      </article>

      {hasSide ? (
        <aside className="section-hero-side">
          {miniCards.map((card) => (
            <button key={card.id} type="button" className="section-side-card" onClick={() => onMiniCardAction(card)}>
              <span className={`section-side-dot ${card.accent}`} />
              <div className="section-side-copy">
                <strong>{card.title}</strong>
                <span>{card.subtitle}</span>
              </div>
            </button>
          ))}
        </aside>
      ) : null}
    </section>
  );
}
