import { Router } from "express";
import { asyncHandler, sendOk } from "../lib/http.js";
import { getInventorySummary } from "../lib/data.js";

const router = Router();

router.get(
  "/summary",
  asyncHandler(async (request, response) => {
    const inventory = await getInventorySummary(request.authUser.id);
    sendOk(response, inventory);
  })
);

export default router;
