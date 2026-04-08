export function formatNumber(value) {
  return new Intl.NumberFormat("de-DE").format(Number(value || 0));
}

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatDuration(totalSeconds) {
  const seconds = Number(totalSeconds || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (!hours && !minutes) {
    return "< 1m";
  }

  if (!hours) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}
