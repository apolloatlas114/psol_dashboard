import { Router } from "express";
import { asyncHandler, sendOk } from "../lib/http.js";
import { getPlayerLoadout, setActiveSkinForUser } from "../lib/data.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const loadout = await getPlayerLoadout(request.authUser.id);
    sendOk(response, loadout);
  })
);

router.patch(
  "/skin",
  asyncHandler(async (request, response) => {
    const loadout = await setActiveSkinForUser(request.authUser.id, request.body?.skin_id || null);
    sendOk(response, loadout);
  })
);

export default router;
