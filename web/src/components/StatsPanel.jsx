import { Coins, Trophy, Users, Wallet } from "lucide-react";
import { formatCurrency, formatNumber } from "../lib/formatters.js";

const metricIcons = [Wallet, Users, Trophy, Coins];
const metricClasses = ["red", "yellow", "blue", "red"];

function formatMetricValue(label, value) {
  const normalizedLabel = String(label || "").toLowerCase();

  if (normalizedLabel.includes("cash")) {
    return `${formatCurrency(value)} $`;
  }

  if (normalizedLabel === "sol") {
    return `${value} SOL`;
  }

  return formatNumber(value);
}

export function StatsPanel({ presentation }) {
  const showNote = presentation.variant !== "overview";
  const isOverview = presentation.variant === "overview";

  return (
    <aside className={`stats-panel stats-panel-${presentation.variant}`}>
      {isOverview ? (
        <div className="stats-panel-head">
          <span className="overview-label">Live Snapshot</span>
          <strong>{presentation.meta}</strong>
        </div>
      ) : null}

      <div className="ring">
        <div className="ring-center">
          <div className="ring-label">{presentation.label}</div>
          <div className="ring-value">{formatMetricValue(presentation.label, presentation.value)}</div>
          <div className="ring-meta">{presentation.meta}</div>
        </div>
      </div>

      <div className="stats-row">
        {presentation.metrics.map((metric, index) => {
          const Icon = metricIcons[index % metricIcons.length];
          const tone = metricClasses[index % metricClasses.length];

          return (
            <div key={metric.label} className="stat-mini">
              <div className={`stat-icon ${tone}`}>
                <Icon size={16} />
              </div>
              <div className="stat-value">{formatMetricValue(metric.label, metric.value)}</div>
              <div className="stat-label">{metric.label}</div>
            </div>
          );
        })}
      </div>

      {showNote ? (
        <div className="panel-note">
          <span>{presentation.meta}</span>
        </div>
      ) : null}
    </aside>
  );
}
