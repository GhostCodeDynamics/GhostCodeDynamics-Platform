import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 5000,
  corsOrigin: process.env.CORS_ORIGIN ?? "https://ghostcodedynamics.github.io",
  frontendUrl: process.env.FRONTEND_URL ?? "https://ghostcodedynamics.github.io",
  mongoUri: process.env.MONGO_URI || null,
  // Business email for admin notifications (contact form, etc.)
  adminEmail: process.env.ADMIN_EMAIL || null,
};

export default env;
