import crypto from "crypto";
import { Router } from "express";
import { config } from "../config.js";
import { asyncHandler, sendError, sendOk } from "../lib/http.js";
import { createGameSession, getProfileById, resolveLaunchSkinForUser, touchProfileSeen } from "../lib/data.js";
import { signLaunchToken } from "../lib/gameLaunchToken.js";

const router = Router();
const LAUNCH_TOKEN_TTL_SECONDS = 5 * 60;

function sanitizeDisplayName(value, fallback = "Guest") {
  const normalized = typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, 22)
    : "";
  return normalized || fallback;
}

function buildLaunchUrl(launchToken, launchId) {
  const url = new URL(config.freeGameUrl);
  url.searchParams.set("launchToken", launchToken);
  url.searchParams.set("launchId", launchId);
  return url.toString();
}

router.post(
  "/free/start",
  asyncHandler(async (request, response) => {
    if (request.hadAuthToken && !request.authUser) {
      return sendError(response, 401, "Invalid or expired Supabase token.");
    }

    const isGuest = !request.authUser || request.body?.guest === true;
    const now = Math.floor(Date.now() / 1000);
    const exp = now + LAUNCH_TOKEN_TTL_SECONDS;

    if (!isGuest && !request.authUser) {
      return sendError(response, 401, "Auth oder expliziter Gast-Start erforderlich.");
    }

    if (isGuest) {
      const guestSessionId = crypto.randomUUID();
      const guestDisplayName = sanitizeDisplayName(request.body?.guest_display_name, "Guest");
      const resolvedSkin = await resolveLaunchSkinForUser(null, guestSessionId);
      const session = await createGameSession({
        userId: null,
        guestSessionId,
        mode: "free",
        resolvedSkinId: resolvedSkin.resolved_skin_id
      });
      const payload = {
        launch_id: session.id,
        user_id: null,
        username: null,
        display_name: guestDisplayName,
        resolved_skin_id: resolvedSkin.resolved_skin_id,
        mode: "free",
        guest_session_id: guestSessionId,
        iat: now,
        exp
      };
      const launchToken = signLaunchToken(payload, config.gameLaunchTokenSecret);

      return sendOk(response, {
        launch_url: buildLaunchUrl(launchToken, session.id),
        launch_token: launchToken,
        launch_id: session.id,
        resolved_skin_id: resolvedSkin.resolved_skin_id,
        is_default_skin: true,
        expires_at: new Date(exp * 1000).toISOString()
      });
    }

    const profile = await getProfileById(request.authUser.id);
    const resolvedIdentityUsername = profile?.username || null;
    if (!resolvedIdentityUsername) {
      return sendError(response, 409, "Username muss vor dem Spielstart gesetzt sein.");
    }

    const displayName = sanitizeDisplayName(profile?.display_name || resolvedIdentityUsername, resolvedIdentityUsername);
    const resolvedSkin = await resolveLaunchSkinForUser(request.authUser.id, request.authUser.id);
    const session = await createGameSession({
      userId: request.authUser.id,
      guestSessionId: null,
      mode: "free",
      resolvedSkinId: resolvedSkin.resolved_skin_id
    });

    await touchProfileSeen(request.authUser.id);

    const payload = {
      launch_id: session.id,
      user_id: request.authUser.id,
      username: resolvedIdentityUsername,
      display_name: displayName,
      resolved_skin_id: resolvedSkin.resolved_skin_id,
      mode: "free",
      iat: now,
      exp
    };
    const launchToken = signLaunchToken(payload, config.gameLaunchTokenSecret);

    sendOk(response, {
      launch_url: buildLaunchUrl(launchToken, session.id),
      launch_token: launchToken,
      launch_id: session.id,
      resolved_skin_id: resolvedSkin.resolved_skin_id,
      is_default_skin: resolvedSkin.is_default_skin,
      expires_at: new Date(exp * 1000).toISOString()
    });
  })
);

export default router;
