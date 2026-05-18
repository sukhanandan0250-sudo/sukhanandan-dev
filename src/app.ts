// src/app.ts - Node.js compatible with Hono + @hono/node-server
// Load env FIRST before any other imports that use process.env
import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

// Import middleware
import { authMiddleware } from "./middleware/auth";

// Import routes
import authRoutes from "./routes/auth";
import sendRoutes from "./routes/send";
import reportRoutes from "./routes/report";
import configRoutes from "./routes/config";
import dashboardRoutes from "./routes/dashboard";

const app = new Hono();

// CORS - allow React frontend
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3001",
      "http://localhost:3000",
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", logger());

// Auth middleware for protected routes
app.use("*", async (c, next) => {
  const path = c.req.path;
  const publicPaths = ["/auth/", "/health"];
  if (publicPaths.some((p) => path.startsWith(p))) {
    return await next();
  }
  return await authMiddleware(c, next);
});

// Initialize directories
async function initializeDirectories() {
  const dirs = ["./uploads", "./logs", "./data"];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Routes
app.route("/", authRoutes);
app.route("/", sendRoutes);
app.route("/", reportRoutes);
app.route("/", configRoutes);
app.route("/", dashboardRoutes);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

// User info endpoint
app.get("/user/info", async (c) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "") ||
      c.req.header("cookie")?.match(/session_token=([^;]+)/)?.[1];
    if (!token) {
      return c.json({ success: false, message: "Not authenticated" }, 401);
    }
    const { userDatabase } = await import("./services/userDatabase");
    const user = userDatabase.validateSession(token);
    if (!user) {
      return c.json({ success: false, message: "Session expired" }, 401);
    }
    return c.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch {
    return c.json({ success: false, message: "Error fetching user info" }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ message: "Endpoint not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Application error:", err);
  return c.json(
    {
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500
  );
});

const port = parseInt(process.env.PORT || "3000");

async function main() {
  console.log("🚀 Initializing Bulk Email Sender...");
  await initializeDirectories();

  console.log("\n📋 Configuration Status:");
  if (process.env.SMTP_HOST) {
    console.log("✅ Global SMTP configuration found");
  } else {
    console.log("⚠️  No global SMTP configuration - users configure their own");
  }

  console.log("\n🔐 Authentication: Argon2 + Session tokens");
  console.log(`\n🌐 Server starting on port ${port}`);
  console.log(`   API: http://localhost:${port}`);

  setTimeout(async () => {
    try {
      const { userDatabase } = await import("./services/userDatabase");
      userDatabase.cleanExpiredSessions();
    } catch {}
  }, 1000);

  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`✅ Server running at http://localhost:${info.port}`);
  });
}

main().catch(console.error);

export default app;
