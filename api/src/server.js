import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { optionalAuth, requireAuth } from "./lib/auth.js";
import { sendError } from "./lib/http.js";
import authRoutes from "./routes/auth.js";
import friendsRoutes from "./routes/friends.js";
import gameSessionsRoutes from "./routes/gameSessions.js";
import internalRoutes from "./routes/internal.js";
import inventoryRoutes from "./routes/inventory.js";
import loadoutRoutes from "./routes/loadout.js";
import profileRoutes from "./routes/profile.js";
import statsRoutes from "./routes/stats.js";
import walletRoutes from "./routes/wallet.js";

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: false
  })
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/game-sessions", optionalAuth, gameSessionsRoutes);
app.use("/api/internal", internalRoutes);
app.use("/api/auth", requireAuth, authRoutes);
app.use("/api/profile", requireAuth, profileRoutes);
app.use("/api/stats", requireAuth, statsRoutes);
app.use("/api/wallet", requireAuth, walletRoutes);
app.use("/api/inventory", requireAuth, inventoryRoutes);
app.use("/api/loadout", requireAuth, loadoutRoutes);
app.use("/api/friends", requireAuth, friendsRoutes);

app.use((_request, response) => {
  sendError(response, 404, "Route not found.");
});

app.use((error, _request, response, _next) => {
  const status = error.status || 500;
  const message = error.message || "Internal server error.";
  console.error(error);
  sendError(response, status, message);
});

app.listen(config.port, () => {
  console.log(`PlaySol dashboard API listening on http://localhost:${config.port}`);
});
