import { Router } from "express";
import { asyncHandler, sendOk } from "../lib/http.js";
import { getInventorySkins, getInventorySummary } from "../lib/data.js";

const router = Router();

router.get(
  "/summary",
  asyncHandler(async (request, response) => {
    const inventory = await getInventorySummary(request.authUser.id);
    sendOk(response, inventory);
  })
);

router.get(
  "/skins",
  asyncHandler(async (request, response) => {
    const inventory = await getInventorySkins(request.authUser.id);
    sendOk(response, inventory);
  })
);

export default router;
