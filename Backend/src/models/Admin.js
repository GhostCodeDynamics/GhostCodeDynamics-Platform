import mongoose from "mongoose";
import crypto from "node:crypto";

const MAX_SESSIONS = 10;

/**
 * Admin account. No public registration exists — accounts are provisioned
 * exclusively via scripts/create-admin.mjs using environment variables.
 */
const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    name: { type: String, default: "Administrator", trim: true, maxlength: 80 },
    role: { type: String, enum: ["admin"], default: "admin" },
    passwordHash: { type: String, required: true },
    /**
     * Active refresh sessions. Only SHA-256 hashes of opaque tokens are
     * stored; deleting an entry instantly invalidates that session.
     */
    sessions: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true }
);

adminSchema.index({ "sessions.expiresAt": 1 });

/** Drop expired sessions; returns number removed. */
adminSchema.methods.pruneExpiredSessions = function pruneExpiredSessions() {
  const now = Date.now();
  const before = this.sessions.length;
  this.sessions = this.sessions.filter(
    (s) => s.expiresAt && s.expiresAt.getTime() > now
  );
  return before - this.sessions.length;
};

/** Register a new refresh session (hash only), enforcing a session cap. */
adminSchema.methods.addSession = function addSession(tokenHash, expiresAt) {
  this.pruneExpiredSessions();
  this.sessions.push({ tokenHash, expiresAt });
  while (this.sessions.length > MAX_SESSIONS) {
    this.sessions.shift(); // oldest session wins eviction
  }
};

/** Remove one session by refresh token hash. */
adminSchema.methods.revokeSession = function revokeSession(tokenHash) {
  const before = this.sessions.length;
  this.sessions = this.sessions.filter((s) => s.tokenHash !== tokenHash);
  return before !== this.sessions.length;
};

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Opaque refresh token: 48 random bytes, URL-safe. */
export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
