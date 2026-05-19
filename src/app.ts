// src/app.ts
import "dotenv/config";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
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

// Run once
initializeDirectories().catch(console.error);

// ======================
// Middleware
// ======================

app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("*", logger());

// ======================
// Public Route Protection
// ======================

app.use("*", async (c, next) => {
  const path = c.req.path;

  const publicPaths = [
    "/register",
    "/login",
    "/health",
    "/auth/register",
    "/auth/login",
  ];

  if (publicPaths.some((p) => path.startsWith(p))) {
    return await next();
  }

  return await authMiddleware(c, next);
});

// ======================
// Routes
// ======================

// IMPORTANT FIX
app.route("/auth", authRoutes);

app.route("/", sendRoutes);
app.route("/", reportRoutes);
app.route("/", configRoutes);
app.route("/", dashboardRoutes);

// ======================
// Health Check
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
      c.req.header("cookie")?.match(/session_token=([^;]+)/)?.[1];

    if (!token) {
      return c.json(
        {
          success: false,
          message: "Not authenticated",
        },
        401
      );
    }

    const { userDatabase } = await import("./services/userDatabase");

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
    console.error(error);

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
      message: "Endpoint not found",
    },
    404
  );
});

// ======================
// Error Handler
// ======================

app.onError((err, c) => {
  console.error("Application error:", err);

  return c.json(
    {
      success: false,
      message: "Internal Server Error",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : undefined,
    },
    500
  );
});

export default app;