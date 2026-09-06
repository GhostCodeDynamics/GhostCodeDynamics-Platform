import { Router } from "express";
import mongoose from "mongoose";
import smtpEnv from "../config/smtpEnv.js";

const router = Router();

function databaseState() {
  const state = mongoose.connection.readyState;
  const labels = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    enabled: Boolean(process.env.MONGO_URI),
    connected: state === 1,
    state: labels[state] ?? "unknown",
  };
}

router.get("/health", (req, res) => {
  const database = databaseState();
  res.json({
    status: database.enabled && !database.connected ? "degraded" : "ok",
    service: "GhostCode Dynamics API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database,
    smtp: smtpEnv.status(),
  });
});

export default router;