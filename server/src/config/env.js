"use strict";

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: toInt(process.env.PORT, 5000),
  mongoUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/socially_approved",
  seedCount: toInt(process.env.SEED_COUNT, 36),
  clientOrigins: (
    process.env.CLIENT_ORIGIN ||
    "https://bridgstone.vercel.app, http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

env.isProduction = env.nodeEnv === "production";
env.isTest = env.nodeEnv === "test";

module.exports = env;
