import { ChevronRight, ShieldCheck } from "lucide-react";

export function HeroSection({ hero, miniCards, onMiniCardAction }) {
  return (
    <section className={`hero-grid hero-grid-${hero.variant}`}>
      <article className={`hero-card hero-card-${hero.variant}`}>
        <div className="hero-backdrop hero-backdrop-a" />
        <div className="hero-backdrop hero-backdrop-b" />
        <div className="hero-backdrop hero-backdrop-c" />

        <div className="hero-content">
          <div className="hero-copy">
            <div className="chips">
              {hero.badges.map((badge) => (
                <span key={badge} className={`chip ${badge === "Popular" ? "popular" : "small"}`}>
                  {badge === "Popular" ? <span className="chip-ring" /> : null}
                  {badge}
                </span>
              ))}
            </div>

            <div className="hero-logo hero-logo-dynamic">
              <span>{hero.title}</span>
              <span className="hero-logo-sub">{hero.eyebrow}</span>
            </div>

            <div className="hero-text">{hero.copy}</div>
          </div>

          <div className="hero-footer">
            <div className="bubbles">
              <span className="bubble bubble-blue" />
              <span className="bubble bubble-pink" />
              <span className="bubble bubble-green" />
            </div>

            <div className="reviews">
              <ShieldCheck size={16} />
              <div>
                <strong>{hero.footerTitle}</strong>
                <span>{hero.footerCopy}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`hero-visual hero-visual-${hero.variant}`}>
          <div className="hero-visual-poster" />
          <div className="hero-visual-orbit hero-visual-orbit-main" />
          <div className="hero-visual-orbit hero-visual-orbit-sub" />
          <div className="hero-visual-card">
            <span className="hero-visual-kicker">{hero.visualKicker}</span>
            <strong>{hero.visualValue}</strong>
            <span className="hero-visual-footer">{hero.visualFooter}</span>
          </div>
        </div>
      </article>

      <aside className={`hero-side hero-side-${hero.variant}`}>
        <div className="dots">
          <span />
          <span />
          <span />
        </div>

        {miniCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`side-card side-card-${card.id}`}
            onClick={() => onMiniCardAction(card)}
          >
            <div className={`cover ${card.accent}`} />
            <div className="side-copy">
              <div className="side-title">{card.title}</div>
              <div className="side-sub">{card.subtitle}</div>
            </div>
            <ChevronRight size={18} />
          </button>
        ))}
      </aside>
    </section>
  );
}
