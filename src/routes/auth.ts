// src/routes/auth.ts

import { Hono } from "hono";
import { userDatabase } from "../services/userDatabase";
import {
  setCookie,
  deleteCookie,
  getCookie,
} from "hono/cookie";

const authRoutes = new Hono();

// ======================
// Register
// ======================

authRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json();

    const { email, name, password } = body;

    if (!email || !name || !password) {
      return c.json(
        {
          success: false,
          message: "Email, name and password are required",
        },
        400
      );
    }

    if (password.length < 6) {
      return c.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        400
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return c.json(
        {
          success: false,
          message: "Invalid email format",
        },
        400
      );
    }

    const userId = await userDatabase.createUser(
      email,
      name,
      password
    );

    const token = await userDatabase.createSession(userId);

    setCookie(c, "session_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return c.json({
      success: true,
      message: "Account created successfully",
      user: {
        id: userId,
        email,
        name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return c.json(
      {
        success: false,
        message: "Registration failed",
      },
      500
    );
  }
});

// ======================
// Login
// ======================

authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json();

    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        {
          success: false,
          message: "Email and password are required",
        },
        400
      );
    }

    const user = await userDatabase.authenticateUser(
      email,
      password
    );

    if (!user) {
      return c.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        401
      );
    }

    const token = await userDatabase.createSession(user.id);

    setCookie(c, "session_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return c.json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return c.json(
      {
        success: false,
        message: "Login failed",
      },
      500
    );
  }
});

// ======================
// Logout
// ======================

authRoutes.post("/logout", async (c) => {
  try {
    const token = getCookie(c, "session_token");

    if (token) {
      userDatabase.deleteSession(token);
    }

    deleteCookie(c, "session_token");

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Logout failed",
      },
      500
    );
  }
});

// ======================
// Current User
// ======================

authRoutes.get("/me", async (c) => {
  try {
    const token = getCookie(c, "session_token");

    if (!token) {
      return c.json(
        {
          success: false,
          message: "Not authenticated",
        },
        401
      );
    }

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
      user,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Auth check failed",
      },
      500
    );
  }
});

export default authRoutes;
