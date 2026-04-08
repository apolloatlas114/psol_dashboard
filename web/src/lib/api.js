const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function apiRequest(pathname, { method = "GET", token, body } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  return parseResponse(response);
}

export async function getDashboardBootstrap(token) {
  const [profile, stats, history, wallet, inventory, friends] = await Promise.all([
    apiRequest("/api/profile", { token }),
    apiRequest("/api/stats/overview", { token }),
    apiRequest("/api/stats/match-history", { token }),
    apiRequest("/api/wallet/overview", { token }),
    apiRequest("/api/inventory/summary", { token }),
    apiRequest("/api/friends", { token })
  ]);

  return {
    profile: profile.data,
    stats: stats.data,
    history: history.data,
    wallet: wallet.data,
    inventory: inventory.data,
    friends: friends.data
  };
}

export { API_BASE_URL };
