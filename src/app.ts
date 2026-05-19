// src/app.ts

import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

// Middleware
import { authMiddleware } from "./middleware/auth";

// Routes
import authRoutes from "./routes/auth";
import sendRoutes from "./routes/send";
import reportRoutes from "./routes/report";
import configRoutes from "./routes/config";
import dashboardRoutes from "./routes/dashboard";

const app = new Hono();

// ======================
// Initialize directories
// ======================

async function initializeDirectories() {
  const dirs = ["./uploads", "./logs", "./data"];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

// Initialize once
initializeDirectories().catch((err) => {
  console.error("Directory initialization failed:", err);
});

// ======================
// Middleware
// ======================

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("*", logger());

// ======================
// Auth Protection
// ======================

app.use("*", async (c, next) => {
  const path = c.req.path;

  const publicPaths = [
    "/health",
    "/auth/login",
    "/auth/register",
  ];

  const isPublic = publicPaths.some((p) =>
    path.startsWith(p)
  );

  if (isPublic) {
    return await next();
  }

  return await authMiddleware(c, next);
});

// Routes
// ======================

app.route("/auth", authRoutes);

app.route("/", sendRoutes);
app.route("/", reportRoutes);
app.route("/", configRoutes);
app.route("/", dashboardRoutes);

// ======================
// Health Route
// ======================

app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "Backend working",
    timestamp: new Date().toISOString(),
  });
});

// ======================
// User Info
// ======================

app.get("/user/info", async (c) => {
  try {
    const token =
      c.req.header("Authorization")?.replace("Bearer ", "") ||
      c.req.header("cookie")?.match(
        /session_token=([^;]+)/
      )?.[1];

    if (!token) {
      return c.json(
        {
          success: false,
          message: "Not authenticated",
        },
        401
      );
    }

    const { userDatabase } = await import(
      "./services/userDatabase"
    );

    const user = userDatabase.validateSession(token);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Session expired",
        },
        401
      );
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("User info error:", error);

    return c.json(
      {
        success: false,
        message: "Error fetching user info",
      },
      500
    );
  }
});

// ======================
// 404 Handler
// ======================

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "Route not found",
    },
    404
  );
});

// ======================
// Global Error Handler
// ======================

app.onError((err, c) => {
  console.error("Application error:", err);

  return c.json(
    {
      success: false,
      message: "Internal Server Error",
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

if (!process.env.VERCEL) {
  main().catch(console.error);
}

export default app;
