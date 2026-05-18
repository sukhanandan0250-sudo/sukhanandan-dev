import { Hono } from "hono";

const app = new Hono();

// API info endpoint
app.get("/", (c) => {
  return c.json({
    message: "Bulk Email Sender API",
    version: "2.0.0",
    frontend: "React.js (run separately on port 5173)",
  });
});

export default app;
