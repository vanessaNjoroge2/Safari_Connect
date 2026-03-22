import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 3215,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  AI_AGENT_BASE_URL: process.env.AI_AGENT_BASE_URL || "http://localhost:4100",
  AI_AGENT_TIMEOUT_MS: Number(process.env.AI_AGENT_TIMEOUT_MS || 8000),
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
  MPESA_PASSKEY: process.env.MPESA_PASSKEY,
  MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
  MPESA_AUTH_URL: process.env.MPESA_AUTH_URL,
  MPESA_STK_PUSH_URL: process.env.MPESA_STK_PUSH_URL,
  PAYMENT_DEMO_SAFE_STK_ONLY: String(process.env.PAYMENT_DEMO_SAFE_STK_ONLY || "true").toLowerCase() === "true",
  PAYMENT_DEMO_AUTO_SUCCESS: String(process.env.PAYMENT_DEMO_AUTO_SUCCESS || "true").toLowerCase() === "true",
  PAYMENT_DEMO_STK_FALLBACK: String(process.env.PAYMENT_DEMO_STK_FALLBACK || "true").toLowerCase() === "true",
};