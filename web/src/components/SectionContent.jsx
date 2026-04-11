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

function clampChartValue(value, max) {
  if (!max || max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, value / max));
}

function EmptyAnalytics({ title, copy }) {
  return (
    <div className="analytics-empty">
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

function LineAnalytics({ title, kicker, points, metricKey }) {
  if (!points.length) {
    return <EmptyAnalytics title={title} copy="Noch keine Match-History fuer diese Auswertung vorhanden." />;
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 100;
  const path = points
    .map((point, index) => {
      const x = index * stepX;
      const y = 90 - clampChartValue(point.value, max) * 74;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const area = `${path} L 100 96 L 0 96 Z`;

  return (
    <article className="analytics-panel analytics-panel-line">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <svg className="analytics-svg analytics-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`profile-fill-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(156,114,255,0.55)" />
            <stop offset="100%" stopColor="rgba(156,114,255,0.02)" />
          </linearGradient>
        </defs>
        <path className="analytics-grid-line" d="M 0 24 L 100 24" />
        <path className="analytics-grid-line" d="M 0 48 L 100 48" />
        <path className="analytics-grid-line" d="M 0 72 L 100 72" />
        <path d={area} fill={`url(#profile-fill-${metricKey})`} />
        <path d={path} className="analytics-line-path" />
        {points.map((point, index) => {
          const x = index * stepX;
          const y = 90 - clampChartValue(point.value, max) * 74;
          return <circle key={point.label} cx={x} cy={y} r="1.8" className="analytics-line-dot" />;
        })}
      </svg>
      <div className="analytics-axis">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </article>
  );
}

function BarAnalytics({ title, kicker, points }) {
  if (!points.length) {
    return <EmptyAnalytics title={title} copy="Sobald mehrere Matches vorhanden sind, erscheint hier der Vergleich von Score und XP." />;
  }

  const max = Math.max(...points.flatMap((point) => [point.primary, point.secondary]), 1);

  return (
    <article className="analytics-panel analytics-panel-bars">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="analytics-bars">
        {points.map((point) => (
          <div key={point.label} className="analytics-bar-group">
            <div className="analytics-bar-stack">
              <span className="analytics-bar analytics-bar-primary" style={{ height: `${18 + clampChartValue(point.primary, max) * 74}%` }} />
              <span className="analytics-bar analytics-bar-secondary" style={{ height: `${18 + clampChartValue(point.secondary, max) * 74}%` }} />
            </div>
            <small>{point.label}</small>
          </div>
        ))}
      </div>
      <div className="analytics-legend">
        <span><i className="analytics-dot analytics-dot-primary" /> Score</span>
        <span><i className="analytics-dot analytics-dot-secondary" /> XP</span>
      </div>
    </article>
  );
}

function RadialAnalytics({ title, kicker, value, helper }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (safeValue / 100) * circumference;

  return (
    <article className="analytics-panel analytics-panel-radial">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="analytics-radial-wrap">
        <svg className="analytics-radial" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="42" className="analytics-radial-track" />
          <circle cx="60" cy="60" r="42" className="analytics-radial-value" style={{ strokeDasharray: circumference, strokeDashoffset: dashOffset }} />
        </svg>
        <div className="analytics-radial-center">
          <strong>{safeValue}%</strong>
          <span>{helper}</span>
        </div>
      </div>
    </article>
  );
}

function RadarAnalytics({ title, kicker, metrics }) {
  const center = 50;
  const radius = 34;
  const points = metrics.map((metric, index) => {
    const angle = (-90 + index * (360 / metrics.length)) * (Math.PI / 180);
    const valueRadius = radius * Math.max(0.12, Math.min(1, metric.value));
    return {
      labelX: center + Math.cos(angle) * 44,
      labelY: center + Math.sin(angle) * 44,
      x: center + Math.cos(angle) * valueRadius,
      y: center + Math.sin(angle) * valueRadius,
      outerX: center + Math.cos(angle) * radius,
      outerY: center + Math.sin(angle) * radius,
      label: metric.label
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <article className="analytics-panel analytics-panel-radar">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <svg className="analytics-svg analytics-svg-radar" viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" className="analytics-radar-grid" />
        <polygon points="50,24 72,37 72,63 50,76 28,63 28,37" className="analytics-radar-grid inner" />
        {points.map((point) => (
          <line key={`${point.label}-line`} x1="50" y1="50" x2={point.outerX} y2={point.outerY} className="analytics-radar-line" />
        ))}
        <polygon points={polygon} className="analytics-radar-shape" />
        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="1.8" className="analytics-line-dot" />
        ))}
        {points.map((point) => (
          <text key={`${point.label}-text`} x={point.labelX} y={point.labelY} className="analytics-radar-label">
            {point.label}
          </text>
        ))}
      </svg>
    </article>
  );
}

function AreaDualAnalytics({ title, kicker, points }) {
  if (!points.length) {
    return <EmptyAnalytics title={title} copy="Noch keine Match-History fuer die kombinierte Score-/XP-Kurve vorhanden." />;
  }

  const max = Math.max(...points.flatMap((point) => [point.primary, point.secondary]), 1);
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 100;
  const buildPath = (key) =>
    points
      .map((point, index) => {
        const x = index * stepX;
        const y = 90 - clampChartValue(point[key], max) * 74;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const primaryPath = buildPath("primary");
  const secondaryPath = buildPath("secondary");
  const primaryArea = `${primaryPath} L 100 96 L 0 96 Z`;
  const secondaryArea = `${secondaryPath} L 100 96 L 0 96 Z`;

  return (
    <article className="analytics-panel analytics-panel-line">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <svg className="analytics-svg analytics-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="profile-fill-primary-dual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(156,114,255,0.36)" />
            <stop offset="100%" stopColor="rgba(156,114,255,0.02)" />
          </linearGradient>
          <linearGradient id="profile-fill-secondary-dual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(111,216,255,0.3)" />
            <stop offset="100%" stopColor="rgba(111,216,255,0.02)" />
          </linearGradient>
        </defs>
        <path className="analytics-grid-line" d="M 0 24 L 100 24" />
        <path className="analytics-grid-line" d="M 0 48 L 100 48" />
        <path className="analytics-grid-line" d="M 0 72 L 100 72" />
        <path d={primaryArea} fill="url(#profile-fill-primary-dual)" />
        <path d={secondaryArea} fill="url(#profile-fill-secondary-dual)" />
        <path d={primaryPath} className="analytics-line-path" />
        <path d={secondaryPath} className="analytics-line-path analytics-line-path-secondary" />
      </svg>
      <div className="analytics-legend">
        <span><i className="analytics-dot analytics-dot-primary" /> Score</span>
        <span><i className="analytics-dot analytics-dot-secondary" /> XP</span>
      </div>
    </article>
  );
}

function AreaSingleAnalytics({ title, kicker, points, tone = "secondary" }) {
  if (!points.length) {
    return <EmptyAnalytics title={title} copy="Noch keine Match-History fuer diese Verlaufskurve vorhanden." />;
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 100;
  const path = points
    .map((point, index) => {
      const x = index * stepX;
      const y = 90 - clampChartValue(point.value, max) * 74;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const area = `${path} L 100 96 L 0 96 Z`;

  return (
    <article className="analytics-panel analytics-panel-line">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <svg className="analytics-svg analytics-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`profile-fill-${tone}-single`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone === "secondary" ? "rgba(111,216,255,0.38)" : "rgba(255,174,120,0.36)"} />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>
        <path className="analytics-grid-line" d="M 0 24 L 100 24" />
        <path className="analytics-grid-line" d="M 0 48 L 100 48" />
        <path className="analytics-grid-line" d="M 0 72 L 100 72" />
        <path d={area} fill={`url(#profile-fill-${tone}-single)`} />
        <path d={path} className={`analytics-line-path ${tone === "secondary" ? "analytics-line-path-secondary" : "analytics-line-path-warm"}`} />
      </svg>
      <div className="analytics-axis">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </article>
  );
}

function TotalsBarAnalytics({ title, kicker, totals }) {
  const max = Math.max(...totals.map((item) => item.value), 1);

  return (
    <article className="analytics-panel analytics-panel-bars">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="analytics-total-bars">
        {totals.map((item) => (
          <div key={item.label} className="analytics-total-row">
            <span>{item.label}</span>
            <div className="analytics-total-track">
              <div className="analytics-total-fill" style={{ width: `${8 + clampChartValue(item.value, max) * 92}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function PieAnalytics({ title, kicker, slices }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let offset = 0;
  const safeSlices = slices.length
    ? slices
    : [{ label: "Empty", value: 0, color: "rgba(255,255,255,0.25)" }];
  const segments = safeSlices.map((slice) => {
    const dash = total ? (slice.value / total) * 314 : 0;
    const current = { ...slice, dash, offset };
    offset += dash;
    return current;
  });

  return (
    <article className="analytics-panel analytics-panel-pie">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="analytics-pie-wrap">
        <svg className="analytics-pie" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="50" className="analytics-pie-track" />
          {segments.map((slice) => (
            <circle
              key={slice.label}
              cx="60"
              cy="60"
              r="50"
              className="analytics-pie-segment"
              style={{ stroke: slice.color, strokeDasharray: `${slice.dash} 314`, strokeDashoffset: -slice.offset }}
            />
          ))}
        </svg>
        <div className="analytics-pie-center">
          <strong>{total}</strong>
          <span>{total ? "matches" : "no data yet"}</span>
        </div>
      </div>
      <div className="analytics-pie-legend">
        {safeSlices.map((slice) => (
          <span key={slice.label}><i className="analytics-dot" style={{ background: slice.color }} /> {slice.label}</span>
        ))}
      </div>
    </article>
  );
}

function LineMultiAnalytics({ title, kicker, points }) {
  if (!points.length) {
    return <EmptyAnalytics title={title} copy="Sobald mehr Matchdaten vorliegen, erscheinen hier mehrere Verlaufslinien." />;
  }

  const max = Math.max(...points.flatMap((point) => [point.primary, point.secondary, point.tertiary]), 1);
  const stepX = points.length > 1 ? 100 / (points.length - 1) : 100;
  const buildPath = (key) =>
    points
      .map((point, index) => {
        const x = index * stepX;
        const y = 90 - clampChartValue(point[key], max) * 74;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  return (
    <article className="analytics-panel analytics-panel-line">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <svg className="analytics-svg analytics-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="analytics-grid-line" d="M 0 24 L 100 24" />
        <path className="analytics-grid-line" d="M 0 48 L 100 48" />
        <path className="analytics-grid-line" d="M 0 72 L 100 72" />
        <path d={buildPath("primary")} className="analytics-line-path" />
        <path d={buildPath("secondary")} className="analytics-line-path analytics-line-path-secondary" />
        <path d={buildPath("tertiary")} className="analytics-line-path analytics-line-path-warm" />
      </svg>
      <div className="analytics-legend analytics-legend-wrap">
        <span><i className="analytics-dot analytics-dot-primary" /> Score</span>
        <span><i className="analytics-dot analytics-dot-secondary" /> XP</span>
        <span><i className="analytics-dot analytics-dot-warm" /> Kills</span>
      </div>
    </article>
  );
}

function StepAnalytics({ title, kicker, points }) {
  if (!points.length) {
    return <EmptyAnalytics title={title} copy="Rank-Fortschritt wird sichtbar, sobald Fortschrittspunkte gespeichert werden." />;
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? 100 / points.length : 100;
  const commands = [];

  points.forEach((point, index) => {
    const x = index * stepX;
    const nextX = (index + 1) * stepX;
    const y = 90 - clampChartValue(point.value, max) * 74;

    if (index === 0) {
      commands.push(`M ${x} ${y}`);
    } else {
      commands.push(`L ${x} ${commands.length ? y : y}`);
    }
    commands.push(`L ${nextX} ${y}`);
  });

  return (
    <article className="analytics-panel analytics-panel-line">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <svg className="analytics-svg analytics-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="analytics-grid-line" d="M 0 24 L 100 24" />
        <path className="analytics-grid-line" d="M 0 48 L 100 48" />
        <path className="analytics-grid-line" d="M 0 72 L 100 72" />
        <path d={commands.join(" ")} className="analytics-line-path analytics-line-path-step" />
      </svg>
      <div className="analytics-axis">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </article>
  );
}

function NegativeBarAnalytics({ title, kicker, points }) {
  const max = Math.max(...points.map((point) => Math.abs(point.value)), 1);

  return (
    <article className="analytics-panel analytics-panel-bars">
      <div className="analytics-head">
        <span className="flat-kicker">{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="analytics-negative-bars">
        {points.map((point) => (
          <div key={point.label} className="analytics-negative-row">
            <span>{point.label}</span>
            <div className="analytics-negative-track">
              <div
                className={`analytics-negative-fill ${point.value >= 0 ? "is-positive" : "is-negative"}`}
                style={{ width: `${clampChartValue(Math.abs(point.value), max) * 100}%` }}
              />
            </div>
            <strong>{point.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function EmptyPanel({ title, copy }) {
  const isInventory = title.includes("Skins");

  if (!isInventory) {
    return (
      <div className="empty-panel">
        <strong>{title}</strong>
        <span>{copy}</span>
      </div>
    );
  }

  return (
    <div className="empty-panel empty-panel-inventory">
      <div className="empty-panel-inventory-visual">
        <div className="inventory-crate-wrapper">
          <svg className="inventory-crate-svg" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Crate body */}
            <rect x="20" y="60" width="120" height="70" rx="8" fill="url(#crateBody)" stroke="rgba(99,232,255,0.2)" strokeWidth="1.5"/>
            {/* Crate lid */}
            <rect x="22" y="48" width="116" height="20" rx="6" fill="url(#crateLid)" stroke="rgba(99,232,255,0.25)" strokeWidth="1.5"/>
            {/* Corner accents */}
            <rect x="30" y="68" width="12" height="3" rx="1.5" fill="rgba(99,232,255,0.5)"/>
            <rect x="118" y="68" width="12" height="3" rx="1.5" fill="rgba(99,232,255,0.5)"/>
            <rect x="30" y="108" width="12" height="3" rx="1.5" fill="rgba(99,232,255,0.5)"/>
            <rect x="118" y="108" width="12" height="3" rx="1.5" fill="rgba(99,232,255,0.5)"/>
            {/* Lock */}
            <rect x="70" y="64" width="20" height="16" rx="4" fill="url(#lockGrad)" stroke="rgba(255,215,0,0.6)" strokeWidth="1"/>
            <circle cx="80" cy="72" r="3" fill="#ffd700"/>
            {/* Glow under crate */}
            <ellipse cx="80" cy="135" rx="70" ry="8" fill="url(#crateGlow)" opacity="0.7"/>
            {/* Question mark inside */}
            <text x="80" y="100" textAnchor="middle" fill="rgba(99,232,255,0.6)" fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">?</text>
            <defs>
              <linearGradient id="crateBody" x1="20" y1="60" x2="140" y2="130">
                <stop offset="0%" stopColor="rgba(30,15,60,0.95)"/>
                <stop offset="100%" stopColor="rgba(15,8,35,0.98)"/>
              </linearGradient>
              <linearGradient id="crateLid" x1="22" y1="48" x2="138" y2="68">
                <stop offset="0%" stopColor="rgba(40,20,80,0.95)"/>
                <stop offset="100%" stopColor="rgba(22,12,50,0.98)"/>
              </linearGradient>
              <linearGradient id="lockGrad" x1="70" y1="64" x2="90" y2="80">
                <stop offset="0%" stopColor="rgba(255,215,0,0.9)"/>
                <stop offset="100%" stopColor="rgba(245,158,11,0.85)"/>
              </linearGradient>
              <radialGradient id="crateGlow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="rgba(99,232,255,0.35)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
          </svg>
          <div className="inventory-crate-particles">
            <span className="inventory-particle inventory-particle-1"/>
            <span className="inventory-particle inventory-particle-2"/>
            <span className="inventory-particle inventory-particle-3"/>
            <span className="inventory-particle inventory-particle-4"/>
            <span className="inventory-particle inventory-particle-5"/>
          </div>
        </div>
      </div>
      <strong className="empty-panel-inventory-title">Your Inventory is Empty</strong>
      <span className="empty-panel-inventory-copy">
        No skins yet — but that's about to change! Play Free Game, earn rewards and unlock rare cosmetics.
      </span>
      <div className="empty-panel-steps">
        <div className="empty-panel-step">
          <div className="empty-panel-step-number">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><polygon points="6,3 17,10 6,17" fill="currentColor"/></svg>
          </div>
          <div className="empty-panel-step-text">Play Free Game</div>
        </div>
        <div className="empty-panel-step">
          <div className="empty-panel-step-number">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/><polyline points="7,10 9,13 14,7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="empty-panel-step-text">Unlock Skins</div>
        </div>
        <div className="empty-panel-step">
          <div className="empty-panel-step-number">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L10 14.2 5.2 16.6l.9-5.3L2.3 7.6l5.3-.8z" fill="currentColor"/></svg>
          </div>
          <div className="empty-panel-step-text">Collect Rarities</div>
        </div>
      </div>
      <button type="button" className="empty-panel-cta">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="4,2 16,9 4,16" fill="currentColor"/></svg>
        <span>Unlock Your First Skin</span>
        <span className="empty-panel-cta-arrow">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>
    </div>
  );
}

function Segment({ label, value, helper }) {
  const isInventorySegment = ["Equipped", "Owned", "Rarity"].includes(label);

  if (!isInventorySegment) {
    return (
      <div className="flat-segment">
        <span>{label}</span>
        <strong>{value}</strong>
        {helper ? <small>{helper}</small> : null}
      </div>
    );
  }

  const iconPaths = {
    Equipped: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="11" cy="11" r="3" fill="currentColor"/>
      </svg>
    ),
    Owned: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="8" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M8 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    ),
    Rarity: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2l2.5 5 5.5.8-4 3.9.9 5.5L11 14.7 6.1 17.2l.9-5.5-4-3.9L8.5 7.8z" fill="currentColor"/>
      </svg>
    )
  };

  return (
    <div className="flat-segment flat-segment-inventory">
      <div className="flat-segment-inventory-icon">
        <div className="flat-segment-ring">
          <svg viewBox="0 0 60 60" className="flat-segment-ring-svg">
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(99,232,255,0.12)" strokeWidth="3.5"/>
            <circle
              cx="30" cy="30" r="26"
              fill="none"
              stroke="rgba(99,232,255,0.35)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flat-segment-icon-center">{iconPaths[label]}</div>
      </div>
      <div className="flat-segment-inventory-content">
        <span className="flat-segment-label">{label}</span>
        <strong className="flat-segment-value">{value}</strong>
        {helper ? <small className="flat-segment-helper">{helper}</small> : null}
      </div>
    </div>
  );
}

function SkinTile({ title, status, meta, rarity }) {
  return (
    <article className="showcase-skin-card">
      <div className="showcase-skin-frame" />
      <div className={`showcase-skin-visual rarity-${rarity || "common"}`}>
        <div className="showcase-skin-stars" />
        <div className="showcase-skin-floater showcase-skin-floater-small">
          <Gem size={52} strokeWidth={1.4} />
        </div>
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
      <div className="market-skin-border" />
      <div className={`market-skin-stage rarity-${item.rarity || "common"}`}>
        <img className="market-skin-image image" src={item.image} alt={item.name} />
      </div>
      <div className="showcase-market-copy market-skin-copy">
        <strong className="showcase-skin-title market-skin-heading">{item.name}</strong>
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
  currentUser,
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
  onOpenFreeGame,
  onLogout
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

  const marketFallbackItems = [
    {
      id: "m1",
      name: "Alien Donut",
      rarity: "epic",
      bullets: ["Epic", "Tradable", "Hover SFX"],
      price: "$2.40",
      status: "Listed",
      action: "Buy now",
      image: "/skins/alien-donut.svg"
    },
    {
      id: "m2",
      name: "Slime Orb",
      rarity: "rare",
      bullets: ["Rare", "Animated Glow", "Loop ambience"],
      price: "$1.85",
      status: "Listed",
      action: "Buy now",
      image: "/skins/slime-orb.svg"
    },
    {
      id: "m3",
      name: "Void Core",
      rarity: "rare",
      bullets: ["Rare", "Tradable", "Low supply"],
      price: "$1.65",
      status: "Listed",
      action: "Buy now",
      image: "/skins/void-core.svg"
    },
    {
      id: "m4",
      name: "Neon Horn",
      rarity: "epic",
      bullets: ["Epic", "Animated Idle", "Hit ping"],
      price: "$2.10",
      status: "Listed",
      action: "Buy now",
      image: "/skins/neon-horn.svg"
    },
    {
      id: "m5",
      name: "Donut Prime",
      rarity: "epic",
      bullets: ["Epic", "Tradable", "Portal hum"],
      price: "$2.95",
      status: "Listed",
      action: "Buy now",
      image: "/skins/alien-donut.svg"
    },
    {
      id: "m6",
      name: "Orb Flux",
      rarity: "rare",
      bullets: ["Rare", "Animated Glow", "Soft spark"],
      price: "$1.55",
      status: "Listed",
      action: "Buy now",
      image: "/skins/slime-orb.svg"
    },
    {
      id: "m7",
      name: "Core Rift",
      rarity: "common",
      bullets: ["Common", "Tradable", "Clean idle"],
      price: "$0.95",
      status: "Listed",
      action: "Buy now",
      image: "/skins/void-core.svg"
    },
    {
      id: "m8",
      name: "Horn Nova",
      rarity: "rare",
      bullets: ["Rare", "Impact SFX", "Browser Wallet"],
      price: "$1.35",
      status: "Listed",
      action: "Buy now",
      image: "/skins/neon-horn.svg"
    },
    {
      id: "m9",
      name: "Alien Bloom",
      rarity: "epic",
      bullets: ["Epic", "Tradable", "Glow pulse"],
      price: "$2.70",
      status: "Listed",
      action: "Buy now",
      image: "/skins/alien-donut.svg"
    }
  ];

  const marketImages = ["/skins/alien-donut.svg", "/skins/slime-orb.svg", "/skins/void-core.svg", "/skins/neon-horn.svg"];
  const marketItems = inventoryTiles.length
    ? inventoryTiles.map((item, index) => ({
        id: `owned-market-${item.id}`,
        name: item.title,
        rarity: item.rarity,
        bullets: [item.status, item.meta || "Owned", index % 2 === 0 ? "Tradable" : "Equip-ready"],
        price: ["$1.15", "$1.40", "$1.75", "$2.10"][index % 4],
        status: "Listed",
        action: "Buy now",
        image: marketImages[index % marketImages.length]
      }))
    : marketFallbackItems;

  if (activeSection === "play") {
    return (
      <section className="page-lower page-lower-play">
        <article className="play-detail-strip">
          <div className="play-detail-segment">
            <div className="play-detail-head">
              <span className="flat-kicker">Free Game</span>
              <div className="play-detail-chips">
                <span className="fx-glass-chip">Live</span>
                <span className="fx-glass-chip">Zero buy-in</span>
                <span className="fx-glass-chip">Browser tab</span>
              </div>
            </div>
            <div className="play-detail-copy">
              <strong>Jump straight into the live browser lobby</strong>
              <p>Free Game bleibt dein direkter Einstieg. Progress, XP und Match-History koennen danach sauber an den Account gebunden werden.</p>
            </div>
            <ul className="play-bullet-list">
              <li><ShieldCheck size={14} /> No buy-in, instant start</li>
              <li><Coins size={14} /> XP progress stays relevant</li>
              <li><ArrowUpRight size={14} /> Opens in a separate browser tab</li>
            </ul>
            <div className="play-segment-footer">
              <button type="button" className="fx-glow-button play-launch-button" onClick={onOpenFreeGame}>
                Open Free Game
              </button>
            </div>
          </div>

          <div className="play-detail-divider" />

          <div className="play-detail-segment">
            <div className="play-detail-head">
              <span className="flat-kicker">Cashgame</span>
              <div className="play-detail-chips">
                <span className="fx-glass-chip">$1 Buy-in</span>
                <span className="fx-glass-chip">50 Players</span>
                <span className="fx-glass-chip">20 Min</span>
              </div>
            </div>
            <div className="play-detail-copy">
              <strong>Competitive round with structured payouts</strong>
              <p>Cashgame bleibt vorbereitet, aber wird bewusst kompakt erklaert statt in einer schweren zweiten Overview-Flaeche verschwendet.</p>
            </div>
            <ul className="play-bullet-list">
              <li><Clock3 size={14} /> 20 minute match window</li>
              <li><Users size={14} /> 50 players per lobby</li>
              <li><Trophy size={14} /> Top 22 refund, Top 3 split pool</li>
            </ul>
            <div className="play-segment-footer">
              <div className="play-cash-badge fx-glass-panel">
                <strong>Coming Soon</strong>
                <span>Top 22 - $1 back</span>
                <small>Top 3 split remaining pool</small>
              </div>
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

  if (activeSection === "profile") {
    const kdRatio = performance.deaths ? (performance.kills / performance.deaths).toFixed(2) : performance.kills.toFixed(2);
    const winRate = performance.games_played ? Math.round((performance.wins / performance.games_played) * 100) : 0;
    const avgKills = performance.games_played ? (performance.kills / performance.games_played).toFixed(1) : "0.0";
    const avgMatchMinutes = performance.games_played ? Math.round(performance.time_played_seconds / 60 / performance.games_played) : 0;
    const avgScore = filteredHistoryItems.length
      ? Math.round(filteredHistoryItems.reduce((sum, match) => sum + (Number(match.score) || 0), 0) / filteredHistoryItems.length)
      : 0;
    const avgXp = filteredHistoryItems.length
      ? Math.round(filteredHistoryItems.reduce((sum, match) => sum + (Number(match.xp_gained) || 0), 0) / filteredHistoryItems.length)
      : 0;
    const recentMatches = filteredHistoryItems.slice(0, 6).reverse();
    const chartMatches = recentMatches.length
      ? recentMatches
      : Array.from({ length: 6 }, (_, index) => ({
          mode: "free",
          placement: 0,
          score: 0,
          kills: 0,
          xp_gained: 0,
          label: `M${index + 1}`
        }));
    const avgPlacement = recentMatches.length
      ? (recentMatches.reduce((sum, match) => sum + (match.placement || 0), 0) / recentMatches.length).toFixed(1)
      : "-";
    const topThreeCount = filteredHistoryItems.filter((match) => typeof match.placement === "number" && match.placement <= 3).length;
    const topTenCount = filteredHistoryItems.filter((match) => typeof match.placement === "number" && match.placement <= 10).length;
    const topTwentyTwoCount = filteredHistoryItems.filter((match) => typeof match.placement === "number" && match.placement <= 22).length;
    const rankProgress = 0;
    const bestKillStreak = 0;
    const currentStreak = 0;
    const avgSizePeak = 0;
    const timeToPeakSize = 0;
    const totalHitsLanded = 0;
    const totalHitsReceived = 0;
    const damageDealt = 0;
    const damageTaken = 0;
    const avgFightDuration = 0;
    const fightsWon = 0;
    const fightsLost = 0;
    const firstHitWinrate = 0;
    const avgLifetime = avgMatchMinutes;
    const timeAliveTotal = performance.time_played_seconds;
    const earlyDeathRate = 0;
    const lateGameRate = 0;
    const distanceTraveled = 0;
    const avgSpeed = 0;
    const timeAtMaxSpeed = 0;
    const escapeSuccessRate = 0;
    const suctionUses = 0;
    const successfulEngulfs = 0;
    const failedEngulfs = 0;
    const engulfSuccessRate = 0;
    const kingTimes = 0;
    const totalKingTime = 0;
    const longestKingHold = 0;
    const averageKingHold = 0;
    const kingKills = 0;
    const kingDeaths = 0;
    const bountyEarned = 0;
    const avgBountyPerCrown = 0;
    const kingMatchRate = 0;
    const kingRetentionRate = 0;
    const totalBuyIns = 0;
    const totalEarnings = 0;
    const netProfit = 0;
    const roi = 0;
    const cashAvgPlacement = 0;
    const cashTop22Rate = 0;
    const cashTop3Rate = 0;
    const cashWinRate = 0;
    const longestLosingStreak = 0;
    const longestWinningStreak = 0;
    const avgProfitPerMatch = 0;
    const podsCaptured = 0;
    const nestDamage = 0;
    const bossDamage = 0;
    const bossKills = 0;
    const bossAssists = 0;
    const eventParticipationRate = 0;
    const eventMatchRate = 0;
    const rewardCapsulesOpened = 0;
    const objectivesCompleted = 0;
    const aggressiveScore = Math.round(Math.min(100, (Number(avgKills) || 0) * 16 + winRate * 0.25));
    const passiveScore = Math.round(Math.min(100, avgMatchMinutes * 6));
    const objectiveScore = 0;
    const kingHunterScore = 0;
    const archetypes = [
      { label: "Aggressor", value: aggressiveScore },
      { label: "Survivor", value: passiveScore },
      { label: "Opportunist", value: objectiveScore },
      { label: "King Hunter", value: kingHunterScore }
    ];
    const dominantArchetype = archetypes.reduce((best, current) => (current.value > best.value ? current : best), archetypes[0]).label;
    const totalSkinsUnlocked = inventory.items.length;
    const rewardsPerMatch = filteredHistoryItems.length
      ? (filteredHistoryItems.filter((match) => Boolean(match.reward_label)).length / filteredHistoryItems.length).toFixed(2)
      : "0.00";
    const longestProgressionSession = 0;
    const matchesPerSession = 0;
    const avgSessionLength = 0;
    const longestSession = 0;
    const dailyReturnRate = 0;
    const weeklyReturnRate = 0;
    const timeBetweenMatches = 0;
    const elo = 0;
    const overallScoreAverage = filteredHistoryItems.length
      ? filteredHistoryItems.reduce((sum, match) => sum + (Number(match.score) || 0), 0) / filteredHistoryItems.length
      : 0;
    const lastTenMatches = filteredHistoryItems.slice(0, 10);
    const lastTenScoreAverage = lastTenMatches.length
      ? lastTenMatches.reduce((sum, match) => sum + (Number(match.score) || 0), 0) / lastTenMatches.length
      : 0;
    const skillTrend = Math.round(lastTenScoreAverage - overallScoreAverage);
    const performanceDelta = Math.round((lastTenScoreAverage || 0) - (overallScoreAverage || 0));
    const consistencyScore = 0;
    const biggestWin = 0;
    const bestMatch = filteredHistoryItems.reduce(
      (best, match) => ((Number(match.score) || 0) > (Number(best.score) || 0) ? match : best),
      filteredHistoryItems[0] || { score: 0, placement: "-" }
    );
    const totalInventoryValue = 0;
    const rarestSkinOwned = inventory.items[0]?.item_key || "None";
    const mostUsedSkin = "None";
    const skinsSold = 0;
    const skinsBought = 0;
    const tradingProfit = 0;
    const linePoints = chartMatches.map((match, index) => ({ label: match.label || `M${index + 1}`, value: Number(match.score) || 0 }));
    const areaPoints = chartMatches.map((match, index) => ({
      label: `M${index + 1}`,
      primary: Number(match.score) || 0,
      secondary: Number(match.xp_gained) || 0
    }));
    const killsPoints = chartMatches.map((match, index) => ({ label: `M${index + 1}`, value: Number(match.kills) || 0 }));
    const barPoints = areaPoints;
    const modeCounts = filteredHistoryItems.reduce((acc, match) => {
      const key = match.mode || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const pieSlices = [
      { label: "Free", value: modeCounts["free"] || modeCounts["Free Game"] || 0, color: "rgba(156,114,255,0.96)" },
      { label: "Team", value: modeCounts["team-cash"] || modeCounts["Team Battle Cashgame"] || 0, color: "rgba(111,216,255,0.96)" },
      { label: "Coop", value: modeCounts["coop-cash"] || modeCounts["Coop Cashgame"] || 0, color: "rgba(255,175,122,0.96)" },
      {
        label: "Other",
        value:
          filteredHistoryItems.length -
          ((modeCounts["free"] || modeCounts["Free Game"] || 0) +
            (modeCounts["team-cash"] || modeCounts["Team Battle Cashgame"] || 0) +
            (modeCounts["coop-cash"] || modeCounts["Coop Cashgame"] || 0)),
        color: "rgba(255,255,255,0.5)"
      }
    ];
    const radarMetrics = [
      { label: "Win", value: performance.games_played ? performance.wins / performance.games_played : 0 },
      { label: "K/D", value: Math.min(1, Number(kdRatio) / 3 || 0) },
      { label: "Mass", value: Math.min(1, performance.highest_mass / 10000 || 0) },
      { label: "Score", value: Math.min(1, performance.highest_score / 10000 || 0) },
      { label: "XP", value: Math.min(1, progress.xp / 5000 || 0) },
      { label: "Time", value: Math.min(1, performance.time_played_seconds / (12 * 3600) || 0) }
    ];
    const totalBars = [
      { label: "Games", value: performance.games_played },
      { label: "Wins", value: performance.wins },
      { label: "Kills", value: performance.kills },
      { label: "Deaths", value: performance.deaths }
    ];
    const multiLinePoints = chartMatches.map((match, index) => ({
      label: `M${index + 1}`,
      primary: Number(match.score) || 0,
      secondary: Number(match.xp_gained) || 0,
      tertiary: Number(match.kills) || 0
    }));
    const stepPoints = [
      { label: "Bronze", value: 0 },
      { label: "Silver", value: 0 },
      { label: "Gold", value: 0 },
      { label: "Elite", value: rankProgress }
    ];
    const placementBarPoints = [
      { label: "Top 3", primary: topThreeCount, secondary: 0 },
      { label: "Top 10", primary: topTenCount, secondary: 0 },
      { label: "Top 22", primary: topTwentyTwoCount, secondary: 0 }
    ];
    const economyDeltaPoints = [
      { label: "Net P/L", value: netProfit },
      { label: "ROI", value: roi },
      { label: "Avg P/L", value: avgProfitPerMatch }
    ];
    const playstyleSlices = [
      { label: "Agg", value: aggressiveScore, color: "rgba(156,114,255,0.96)" },
      { label: "Surv", value: passiveScore, color: "rgba(111,216,255,0.96)" },
      { label: "Obj", value: objectiveScore, color: "rgba(255,175,122,0.96)" },
      { label: "King", value: kingHunterScore, color: "rgba(244,232,179,0.96)" }
    ];
    const rarityCounts = inventory.items.reduce((acc, item) => {
      const rarity = item.rarity || item.tier || "Common";
      acc[rarity] = (acc[rarity] || 0) + 1;
      return acc;
    }, {});
    const raritySlices = [
      { label: "Common", value: rarityCounts.Common || 0, color: "rgba(255,255,255,0.75)" },
      { label: "Rare", value: rarityCounts.Rare || 0, color: "rgba(111,216,255,0.96)" },
      { label: "Epic", value: rarityCounts.Epic || 0, color: "rgba(156,114,255,0.96)" },
      { label: "Exotic", value: rarityCounts.Exotic || 0, color: "rgba(255,175,122,0.96)" }
    ];

    return (
      <section className="page-lower page-lower-profile">
        <article className="profile-topline">
          <div className="profile-topline-main">
            <div className="profile-avatar-large">
              <span className="profile-face profile-face-gold" />
            </div>
            <div className="profile-topline-copy">
              <strong>{dashboardState.profile?.username || currentUser?.username || "No username yet"}</strong>
              <small>{currentUser?.email || "Keine Email"}</small>
            </div>
          </div>
          <div className="profile-topline-meta">
            <span>Rank {progress.rank}</span>
            <span>Level {progress.level}</span>
            <span>{formatDuration(performance.time_played_seconds)} total</span>
          </div>
          <button type="button" className="profile-logout-link" onClick={onLogout}>
            Logout
          </button>
        </article>

        <div className="flat-strip flat-strip-profile">
          <Segment label="XP" value={formatNumber(progress.xp)} />
          <Segment label="Level" value={progress.level} />
          <Segment label="Rank" value={progress.rank} />
          <Segment label="Cash" value={`${formatCurrency(wallet.cash_balance)} $`} />
          <Segment label="SOL" value={`${formatCurrency(wallet.sol_balance)} SOL`} />
          <Segment label="Games" value={performance.games_played} />
          <Segment label="Wins" value={performance.wins} />
          <Segment label="Losses" value={performance.losses} />
          <Segment label="K/D" value={kdRatio} />
          <Segment label="Avg place" value={avgPlacement} />
          <Segment label="Avg kills" value={avgKills} />
          <Segment label="Highscore" value={formatNumber(performance.highest_score)} />
        </div>

        <div className="profile-mini-strip">
          <div className="profile-mini-item">
            <span className="flat-kicker">Aggressor</span>
            <strong>{aggressiveScore}%</strong>
            <small>damage & kills pressure</small>
          </div>
          <div className="profile-mini-item">
            <span className="flat-kicker">Survivor</span>
            <strong>{passiveScore}%</strong>
            <small>lifetime & stability</small>
          </div>
          <div className="profile-mini-item">
            <span className="flat-kicker">Objective</span>
            <strong>{objectiveScore}%</strong>
            <small>event participation</small>
          </div>
          <div className="profile-mini-item">
            <span className="flat-kicker">King hunter</span>
            <strong>{kingHunterScore}%</strong>
            <small>crown pressure</small>
          </div>
          <div className="profile-mini-item">
            <span className="flat-kicker">Primary label</span>
            <strong>{dominantArchetype}</strong>
            <small>current playstyle read</small>
          </div>
          <div className="profile-mini-item">
            <span className="flat-kicker">Rank progress</span>
            <strong>{rankProgress}%</strong>
            <small>towards next tier</small>
          </div>
        </div>

        <section className="profile-group">
          <div className="profile-group-head">
            <span className="flat-kicker">Core performance</span>
            <strong>Progress, rank, placement and growth</strong>
          </div>
          <div className="profile-group-visuals">
            <StepAnalytics title="Rank climb" kicker="tier progression" points={stepPoints} />
            <LineMultiAnalytics title="Score, XP and kills" kicker="recent flow" points={multiLinePoints} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Top 3" value={topThreeCount} />
            <Segment label="Top 10" value={topTenCount} />
            <Segment label="Top 22" value={topTwentyTwoCount} />
            <Segment label="Winrate" value={`${winRate}%`} />
            <Segment label="Avg score" value={formatNumber(avgScore)} />
            <Segment label="Avg size peak" value={formatNumber(avgSizePeak)} />
            <Segment label="Highest score" value={formatNumber(performance.highest_score)} />
            <Segment label="Avg XP" value={formatNumber(avgXp)} />
            <Segment label="Rank progress" value={`${rankProgress}%`} />
            <Segment label="Best streak" value={bestKillStreak} />
            <Segment label="Current streak" value={currentStreak} />
            <Segment label="Time to peak" value={timeToPeakSize} helper="sec" />
          </div>
        </section>

        <section className="profile-group">
          <div className="profile-group-head">
            <span className="flat-kicker">Combat deep dive</span>
            <strong>Weapon pressure, hits and engagements</strong>
          </div>
          <div className="profile-group-visuals">
            <TotalsBarAnalytics
              title="Hits and damage totals"
              kicker="combat totals"
              totals={[
                { label: "Landed", value: totalHitsLanded },
                { label: "Taken", value: totalHitsReceived },
                { label: "Dealt", value: damageDealt },
                { label: "Taken", value: damageTaken }
              ]}
            />
            <BarAnalytics
              title="Weapon output"
              kicker="core weapon split"
              points={[
                { label: "W1", primary: 0, secondary: 0 },
                { label: "W2", primary: 0, secondary: 0 },
                { label: "W3", primary: 0, secondary: 0 }
              ]}
            />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Weapon uses" value={0} />
            <Segment label="Weapon kills" value={0} />
            <Segment label="Accuracy" value="0%" />
            <Segment label="Damage dealt" value={damageDealt} />
            <Segment label="Damage / match" value={0} />
            <Segment label="Kill efficiency" value="0%" />
            <Segment label="Hits landed" value={totalHitsLanded} />
            <Segment label="Hits received" value={totalHitsReceived} />
            <Segment label="Dmg ratio" value={0} />
            <Segment label="Biggest hit" value={0} />
            <Segment label="Biggest hit taken" value={0} />
            <Segment label="First hit WR" value={`${firstHitWinrate}%`} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-four">
            <Segment label="Avg fight duration" value={avgFightDuration} helper="sec" />
            <Segment label="Fights won" value={fightsWon} />
            <Segment label="Fights lost" value={fightsLost} />
            <Segment label="Damage taken" value={damageTaken} />
          </div>
        </section>

        <section className="profile-group">
          <div className="profile-group-head">
            <span className="flat-kicker">Survival and movement</span>
            <strong>Lifetime, travel and engulf performance</strong>
          </div>
          <div className="profile-group-visuals">
            <AreaSingleAnalytics title="Survival curve" kicker="lifetime trend" points={killsPoints.map((point) => ({ ...point, value: 0 }))} tone="warm" />
            <RadialAnalytics title="Escape success" kicker="survival conversion" value={escapeSuccessRate} helper="escapes / attempts" />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Avg lifetime" value={avgLifetime} helper="min" />
            <Segment label="Time alive" value={formatDuration(timeAliveTotal)} />
            <Segment label="Early death" value={`${earlyDeathRate}%`} />
            <Segment label="Late game" value={`${lateGameRate}%`} />
            <Segment label="Distance" value={distanceTraveled} />
            <Segment label="Avg speed" value={avgSpeed} />
            <Segment label="Max speed time" value={timeAtMaxSpeed} helper="sec" />
            <Segment label="Escape rate" value={`${escapeSuccessRate}%`} />
            <Segment label="Suction uses" value={suctionUses} />
            <Segment label="Engulfs" value={successfulEngulfs} />
            <Segment label="Failed engulfs" value={failedEngulfs} />
            <Segment label="Engulf rate" value={`${engulfSuccessRate}%`} />
          </div>
        </section>

        <section className="profile-group">
          <div className="profile-group-head">
            <span className="flat-kicker">King and economy</span>
            <strong>Crown control and cashgame monetization</strong>
          </div>
          <div className="profile-group-visuals">
            <RadialAnalytics title="King retention" kicker="crown stability" value={kingRetentionRate} helper="retained crown" />
            <NegativeBarAnalytics title="Cashgame delta" kicker="economy trend" points={economyDeltaPoints} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Times king" value={kingTimes} />
            <Segment label="King time" value={totalKingTime} helper="sec" />
            <Segment label="Longest hold" value={longestKingHold} helper="sec" />
            <Segment label="Avg hold" value={averageKingHold} helper="sec" />
            <Segment label="King kills" value={kingKills} />
            <Segment label="King deaths" value={kingDeaths} />
            <Segment label="Bounty earned" value={bountyEarned} />
            <Segment label="Avg bounty" value={avgBountyPerCrown} />
            <Segment label="King match %" value={`${kingMatchRate}%`} />
            <Segment label="Retention %" value={`${kingRetentionRate}%`} />
            <Segment label="Buy-ins" value={totalBuyIns} />
            <Segment label="Earnings" value={totalEarnings} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Net P/L" value={netProfit} />
            <Segment label="ROI" value={`${roi}%`} />
            <Segment label="Cash avg place" value={cashAvgPlacement} />
            <Segment label="Cash top 22" value={`${cashTop22Rate}%`} />
            <Segment label="Cash top 3" value={`${cashTop3Rate}%`} />
            <Segment label="Cash winrate" value={`${cashWinRate}%`} />
            <Segment label="Lose streak" value={longestLosingStreak} />
            <Segment label="Win streak" value={longestWinningStreak} />
            <Segment label="Avg profit" value={avgProfitPerMatch} />
          </div>
        </section>

        <section className="profile-group">
          <div className="profile-group-head">
            <span className="flat-kicker">Objectives and progression</span>
            <strong>Event usage, rewards and unlock momentum</strong>
          </div>
          <div className="profile-group-visuals">
            <TotalsBarAnalytics
              title="Objective totals"
              kicker="events and bosses"
              totals={[
                { label: "Pods", value: podsCaptured },
                { label: "Nest", value: nestDamage },
                { label: "Boss", value: bossDamage },
                { label: "Obj", value: objectivesCompleted }
              ]}
            />
            <PieAnalytics title="Rarity spread" kicker="inventory progression" slices={raritySlices} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Pods captured" value={podsCaptured} />
            <Segment label="Nest damage" value={nestDamage} />
            <Segment label="Boss damage" value={bossDamage} />
            <Segment label="Boss kills" value={bossKills} />
            <Segment label="Boss assists" value={bossAssists} />
            <Segment label="Event rate" value={`${eventParticipationRate}%`} />
            <Segment label="Match objective %" value={`${eventMatchRate}%`} />
            <Segment label="Capsules opened" value={rewardCapsulesOpened} />
            <Segment label="Objectives done" value={objectivesCompleted} />
            <Segment label="Skins unlocked" value={totalSkinsUnlocked} />
            <Segment label="Rewards / match" value={rewardsPerMatch} />
            <Segment label="Longest prog. session" value={longestProgressionSession} helper="min" />
          </div>
        </section>

        <section className="profile-group">
          <div className="profile-group-head">
            <span className="flat-kicker">Sessions, competitive and highlights</span>
            <strong>Retention, rating and headline stats</strong>
          </div>
          <div className="profile-group-visuals">
            <LineAnalytics title="Recent score curve" kicker="last 6 matches" points={linePoints} metricKey="score" />
            <RadarAnalytics title="Competitive profile" kicker="current shape" metrics={radarMetrics} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-six">
            <Segment label="Matches / session" value={matchesPerSession} />
            <Segment label="Avg session" value={avgSessionLength} helper="min" />
            <Segment label="Longest session" value={longestSession} helper="min" />
            <Segment label="Daily return" value={`${dailyReturnRate}%`} />
            <Segment label="Weekly return" value={`${weeklyReturnRate}%`} />
            <Segment label="Between matches" value={timeBetweenMatches} helper="min" />
            <Segment label="ELO" value={elo} />
            <Segment label="Skill trend" value={skillTrend} />
            <Segment label="Delta" value={performanceDelta} />
            <Segment label="Consistency" value={consistencyScore} />
            <Segment label="Biggest win" value={biggestWin} />
            <Segment label="Best match" value={`${formatNumber(bestMatch.score || 0)} / #${bestMatch.placement ?? "-"}`} />
          </div>
          <div className="flat-strip profile-group-strip profile-group-strip-five">
            <Segment label="Inventory value" value={totalInventoryValue} />
            <Segment label="Rarest skin" value={rarestSkinOwned} />
            <Segment label="Most used skin" value={mostUsedSkin} />
            <Segment label="Skins sold / bought" value={`${skinsSold} / ${skinsBought}`} />
            <Segment label="Trading profit" value={tradingProfit} />
          </div>
        </section>

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
