import { Router } from "express";
import { normalizeUsername } from "../../../shared/src/index.js";
import { asyncHandler, sendError, sendOk } from "../lib/http.js";
import { createOrRefreshFriendRequest, getFriendsSummary, getProfileByUsername } from "../lib/data.js";
import { supabaseAdminClient } from "../lib/supabase.js";

const router = Router();

async function getRelationshipForUser(relationId, currentUserId) {
  const { data, error } = await supabaseAdminClient
    .from("friends")
    .select("id, user_a, user_b, requested_by, friend_state")
    .eq("id", relationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const notFound = new Error("Friend relationship nicht gefunden.");
    notFound.status = 404;
    throw notFound;
  }

  if (data.user_a !== currentUserId && data.user_b !== currentUserId) {
    const forbidden = new Error("Keine Berechtigung fuer diese Friend-Relation.");
    forbidden.status = 403;
    throw forbidden;
  }

  return data;
}

async function updateRelationshipState(relationId, state) {
  const { error } = await supabaseAdminClient
    .from("friends")
    .update({
      friend_state: state
    })
    .eq("id", relationId);

  if (error) {
    throw error;
  }
}

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const summary = await getFriendsSummary(request.authUser.id);
    sendOk(response, summary);
  })
);

router.post(
  "/request",
  asyncHandler(async (request, response) => {
    const username = normalizeUsername(request.body?.username);
    if (!username) {
      return sendError(response, 400, "Username ist erforderlich.");
    }

    const targetProfile = await getProfileByUsername(username);
    if (!targetProfile) {
      return sendError(response, 404, "User mit diesem Username wurde nicht gefunden.");
    }

    if (targetProfile.id === request.authUser.id) {
      return sendError(response, 400, "Du kannst dich nicht selbst adden.");
    }

    const relation = await createOrRefreshFriendRequest(request.authUser.id, targetProfile.id);
    sendOk(response, {
      relation_id: relation.id
    });
  })
);

router.post(
  "/:id/accept",
  asyncHandler(async (request, response) => {
    const relation = await getRelationshipForUser(request.params.id, request.authUser.id);
    if (relation.friend_state !== "pending" || relation.requested_by === request.authUser.id) {
      return sendError(response, 409, "Diese Anfrage kann nicht akzeptiert werden.");
    }

    await updateRelationshipState(relation.id, "accepted");
    sendOk(response, { id: relation.id, friend_state: "accepted" });
  })
);

router.post(
  "/:id/decline",
  asyncHandler(async (request, response) => {
    const relation = await getRelationshipForUser(request.params.id, request.authUser.id);
    if (relation.friend_state !== "pending" || relation.requested_by === request.authUser.id) {
      return sendError(response, 409, "Diese Anfrage kann nicht abgelehnt werden.");
    }

    await updateRelationshipState(relation.id, "declined");
    sendOk(response, { id: relation.id, friend_state: "declined" });
  })
);

router.post(
  "/:id/block",
  asyncHandler(async (request, response) => {
    const relation = await getRelationshipForUser(request.params.id, request.authUser.id);
    await updateRelationshipState(relation.id, "blocked");
    sendOk(response, { id: relation.id, friend_state: "blocked" });
  })
);

export default router;
