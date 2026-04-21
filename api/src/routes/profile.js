import { Router } from "express";
import { isValidUsername, normalizeUsername } from "../../../shared/src/index.js";
import { asyncHandler, sendError, sendOk } from "../lib/http.js";
import { ensureUsernameAvailable, getProfileById } from "../lib/data.js";
import { supabaseAdminClient } from "../lib/supabase.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const profile = await getProfileById(request.authUser.id);
    sendOk(response, profile);
  })
);

router.patch(
  "/username",
  asyncHandler(async (request, response) => {
    const currentProfile = await getProfileById(request.authUser.id);
    const username = normalizeUsername(request.body?.username);

    if (!isValidUsername(username)) {
      return sendError(response, 400, "Username muss 3-20 Zeichen lang sein und darf nur a-z, 0-9 und _ enthalten.");
    }

    if (currentProfile?.username && currentProfile.username !== username) {
      return sendError(response, 409, "Username-Aenderung ist in V1 deaktiviert.");
    }

    const isAvailable = await ensureUsernameAvailable(username, request.authUser.id);
    if (!isAvailable) {
      return sendError(response, 409, "Username ist bereits vergeben.");
    }

    const { data, error } = await supabaseAdminClient
      .from("profiles")
      .update({
        username
      })
      .eq("id", request.authUser.id)
      .select("id, email, username, display_name, avatar_url, created_at, updated_at, last_login_at, last_seen_at")
      .single();

    if (error) {
      throw error;
    }

    sendOk(response, {
      user: data
    });
  })
);

export default router;
