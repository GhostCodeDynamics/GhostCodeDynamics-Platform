import dns from "node:dns";
import mongoose from "mongoose";
import env from "./env.js";

const CONNECT_OPTIONS = { serverSelectionTimeoutMS: 10000 };

const FALLBACK_DNS_SERVERS = ["8.8.8.8", "1.1.1.1"];

function sanitizeError(err) {
  const message = err && err.message ? String(err.message) : "unknown error";
  return message.replace(/\/\/[^@\s/]*@/g, "//***@");
}

function safeHost() {
  const { host, name } = mongoose.connection;
  return name ? `${host || "unknown host"}/${name}` : host || "unknown host";
}

function isDnsError(err) {
  const code = err && err.code;
  const message = (err && err.message) || "";
  return (
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEOUT" ||
    code === "ENODATA" ||
    /query(Srv|A)/.test(message)
  );
}

function srvNameFromUri(uri) {
  try {
    const u = new URL(uri);
    return `_mongodb._tcp.${u.hostname}`;
  } catch {
    return null;
  }
}

async function ensureSrvResolution(uri) {
  if (!uri.startsWith("mongodb+srv://") || env.nodeEnv === "production") return;
  const name = srvNameFromUri(uri);
  if (!name) return;

  try {
    await dns.promises.resolveSrv(name);
  } catch (err) {
    if (!isDnsError(err)) return;
    console.warn(
      "[db] default DNS resolution failed; retrying via public resolvers (8.8.8.8, 1.1.1.1)."
    );
    dns.setServers(FALLBACK_DNS_SERVERS);
    await dns.promises.resolveSrv(name);
  }
}

export async function connectDB(retries = 3, delay = 2000) {
  const uri = env.mongoUri;

  if (!uri) {
    console.warn(
      "[db] MONGO_URI is not set. Starting in database-disabled (health-only) mode."
    );
    return false;
  }

  mongoose.connection.on("connected", () => {
    console.log(`[db] connected to ${safeHost()}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error(`[db] connection error: ${sanitizeError(err)}`);
  });

  await ensureSrvResolution(uri);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, CONNECT_OPTIONS);
      return true;
    } catch (err) {
      console.error(
        `[db] MongoDB connection attempt ${attempt}/${retries} failed at ${safeHost()} (${sanitizeError(err)}).`
      );
      if (attempt < retries) {
        console.log(`[db] retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw new Error("Database connection failed after all retries; startup aborted.");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  console.log("[db] disconnected");
}
