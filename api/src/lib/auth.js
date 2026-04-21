import { asyncHandler, sendError } from "./http.js";
import { supabaseAuthClient } from "./supabase.js";

export function parseBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith("Bearer ")) {
    return "";
  }

  return headerValue.slice("Bearer ".length).trim();
}

export async function resolveSupabaseUserFromToken(token) {
  if (!token) {
    return null;
  }

  const {
    data: { user },
    error
  } = await supabaseAuthClient.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

export const requireAuth = asyncHandler(async (request, response, next) => {
  const token = parseBearerToken(request.headers.authorization);

  if (!token) {
    return sendError(response, 401, "Missing bearer token.");
  }

  const user = await resolveSupabaseUserFromToken(token);

  if (!user) {
    return sendError(response, 401, "Invalid or expired Supabase token.");
  }

  request.accessToken = token;
  request.authUser = user;
  next();
});

export const optionalAuth = asyncHandler(async (request, _response, next) => {
  const token = parseBearerToken(request.headers.authorization);
  request.hadAuthToken = Boolean(token);

  if (!token) {
    request.accessToken = "";
    request.authUser = null;
    return next();
  }

  const user = await resolveSupabaseUserFromToken(token);

  if (!user) {
    request.accessToken = "";
    request.authUser = null;
    return next();
  }

  request.accessToken = token;
  request.authUser = user;
  next();
});
