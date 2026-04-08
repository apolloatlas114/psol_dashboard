import { Router } from "express";
import { asyncHandler, sendOk } from "../lib/http.js";
import { getWalletOverview } from "../lib/data.js";

const router = Router();

router.get(
  "/overview",
  asyncHandler(async (request, response) => {
    const wallet = await getWalletOverview(request.authUser.id);
    sendOk(response, wallet);
  })
);

export default router;
