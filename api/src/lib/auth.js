import { asyncHandler, sendError } from "./http.js";
import { supabaseAuthClient } from "./supabase.js";

function parseBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith("Bearer ")) {
    return "";
  }

  return headerValue.slice("Bearer ".length).trim();
}

export const requireAuth = asyncHandler(async (request, response, next) => {
  const token = parseBearerToken(request.headers.authorization);

  if (!token) {
    return sendError(response, 401, "Missing bearer token.");
  }

  const {
    data: { user },
    error
  } = await supabaseAuthClient.auth.getUser(token);

  if (error || !user) {
    return sendError(response, 401, "Invalid or expired Supabase token.");
  }

  request.accessToken = token;
  request.authUser = user;
  next();
});
