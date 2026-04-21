import { Router } from "express";
import { config } from "../config.js";
import { ingestFreeMatchResult, updateGameSessionStatus } from "../lib/data.js";
import { asyncHandler, sendError, sendOk } from "../lib/http.js";

const router = Router();

function requireInternalSecret(request, response) {
  const provided = request.headers["x-game-server-secret"];
  if (provided !== config.gameServerWritebackSecret) {
    sendError(response, 401, "Invalid internal secret.");
    return false;
  }
  return true;
}

router.post(
  "/game-sessions/:launchId/status",
  asyncHandler(async (request, response) => {
    if (!requireInternalSecret(request, response)) {
      return;
    }
    if (!request.body?.status) {
      return sendError(response, 400, "status ist erforderlich.");
    }

    const session = await updateGameSessionStatus({
      launchId: request.params.launchId,
      nextStatus: request.body?.status,
      matchId: request.body?.match_id || null,
      startedAt: request.body?.started_at || null,
      endedAt: request.body?.ended_at || null
    });

    sendOk(response, session);
  })
);

router.post(
  "/game-results/free",
  asyncHandler(async (request, response) => {
    if (!requireInternalSecret(request, response)) {
      return;
    }

    const result = await ingestFreeMatchResult(request.body || {});
    sendOk(response, result);
  })
);

export default router;
