import app from "./app.js";
import env from "./config/env.js";
import validateEnv from "./config/validateEnv.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { verifySmtpConnection } from "./services/email.service.js";

let server;

async function start() {
  if (!validateEnv().ok) {
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("[server] startup aborted: database connection failed.");
    process.exit(1);
  }

  server = app.listen(env.port, () => {
    console.log(
      `GhostCode Dynamics API listening on http://localhost:${env.port} (${env.nodeEnv})`
    );
  });

  // Non-blocking SMTP verification — logs result but never aborts startup
  verifySmtpConnection().catch(() => {});
}

function shutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  if (!server) {
    process.exit(0);
  }
  server.close(async () => {
    try {
      await disconnectDB();
    } catch (err) {
      console.error(`[db] error during disconnect: ${err && err.message}`);
    }
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
