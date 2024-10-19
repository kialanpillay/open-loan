import { Hono } from "hono";
import { cors } from "hono/cors";
import { jsxRenderer } from "hono/jsx-renderer";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { handleInteraction } from "./handlers/auth";

const app = new Hono();
// CORS middleware
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Other middleware
app.use("*", logger());
app.use(
  "*",
  secureHeaders({
    xFrameOptions: false,
  })
);
app.use("*", jsxRenderer());

app.get("/", (c) => c.text("Open Loan"));

app.get("/auth/:id", handleInteraction);

export default app;
