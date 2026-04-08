import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants.js";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function isValidUsername(value) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function usernameError(value) {
  const normalized = normalizeUsername(value);
  if (!normalized) {
    return "Username ist erforderlich.";
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Username muss 3-20 Zeichen lang sein und darf nur a-z, 0-9 und _ enthalten.";
  }
  return "";
}

export function canonicalizeFriendPair(firstUserId, secondUserId) {
  const [user_a, user_b] = [String(firstUserId), String(secondUserId)].sort();
  return { user_a, user_b };
}

export function clampPageSize(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.max(1, Math.min(MAX_PAGE_SIZE, parsed));
}

export function clampPage(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.max(1, parsed);
}
