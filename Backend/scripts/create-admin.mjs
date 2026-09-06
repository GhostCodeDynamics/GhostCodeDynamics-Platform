/**
 * Admin account provisioning.
 *
 * Usage (values come from environment variables — never hard-coded):
 *   ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='long-random-password' npm run create-admin
 *
 * Behavior:
 *   - Creates the first admin account in the `admins` collection.
 *   - Refuses to run if the email already exists unless --reset is passed
 *     (--reset rotates the password and revokes all active sessions).
 *   - Prints only the account email/id. Never echoes the password or hash.
 */
import { connectDB, disconnectDB } from "../src/config/db.js";
import adminEnv from "../src/config/adminEnv.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const RESET = process.argv.includes("--reset");

function fail(message) {
  console.error(`[create-admin] ${message}`);
  process.exit(1);
}

const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const email = (adminEnv.adminEmail || "").trim().toLowerCase();
  const password = adminEnv.adminPassword || "";

  if (!email) {
    fail("ADMIN_EMAIL is not set. Provide it via the environment.");
  }
  if (!password) {
    fail("ADMIN_PASSWORD is not set. Provide it via the environment.");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (/^\$2[aby]\$/.test(password)) {
    // Guard against someone pasting a bcrypt hash as the password by mistake.
    fail("ADMIN_PASSWORD looks like a hash; provide the plaintext password.");
  }

  await connectDB();

  const Admin = (await import("../src/models/Admin.js")).default;
  const existing = await Admin.findOne({ email });

  if (existing && !RESET) {
    fail(
      `An admin with email "${email}" already exists. Re-run with --reset to rotate its password (all sessions will be revoked).`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let admin;
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.sessions = [];
    admin = await existing.save();
    console.log(
      `[create-admin] Password rotated for admin ${admin.email} (${admin._id}). All sessions revoked.`
    );
  } else {
    admin = await Admin.create({
      email,
      name: adminEnv.adminName,
      role: "admin",
      passwordHash,
      sessions: [],
    });
    console.log(
      `[create-admin] Admin created: ${admin.email} (${admin._id}) in collection "${Admin.collection.name}".`
    );
  }

  await disconnectDB();
}

main().catch((err) => {
  if (err instanceof mongoose.Error) {
    fail(`Database error: ${err.message}`);
  }
  fail(err && err.message ? err.message : String(err));
});
