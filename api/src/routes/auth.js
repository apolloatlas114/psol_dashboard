import { Router } from "express";
import { asyncHandler, sendOk } from "../lib/http.js";
import { getProfileById } from "../lib/data.js";

const router = Router();

router.get(
  "/me",
  asyncHandler(async (request, response) => {
    const profile = await getProfileById(request.authUser.id);

    sendOk(response, {
      user: {
        id: request.authUser.id,
        email: profile?.email || request.authUser.email || null,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null,
        created_at: profile?.created_at || null,
        last_login_at: profile?.last_login_at || null
      },
      needs_username_completion: !profile?.username
    });
  })
);

export default router;
