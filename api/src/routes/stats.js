import { Router } from "express";
import { asyncHandler, sendOk } from "../lib/http.js";
import { getMatchHistory, getStatsOverview } from "../lib/data.js";

const router = Router();

router.get(
  "/overview",
  asyncHandler(async (request, response) => {
    const overview = await getStatsOverview(request.authUser.id);
    sendOk(response, overview);
  })
);

router.get(
  "/match-history",
  asyncHandler(async (request, response) => {
    const history = await getMatchHistory(request.authUser.id, request.query);
    sendOk(response, history);
  })
);

export default router;
