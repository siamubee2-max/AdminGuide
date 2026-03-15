import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { sampleRouter } from "./routes/sample";
import { linkingRouter } from "./routes/linking";
import { b2bRouter } from "./routes/b2b";
import { newsletterRouter } from "./routes/newsletter";
import { aiRouter } from "./routes/ai";
import { logger } from "hono/logger";
import { adminAuth, rateLimit } from "./middleware/auth";

const app = new Hono();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Rate limiting on public endpoints
app.use("/api/b2b/contact", rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 5, keyPrefix: "b2b" }));
app.use("/api/newsletter/subscribe", rateLimit({ windowMs: 60 * 60 * 1000, maxRequests: 10, keyPrefix: "nl" }));
app.use("/api/ai/*", rateLimit({ windowMs: 60 * 1000, maxRequests: 20, keyPrefix: "ai" }));

// Admin authentication on sensitive endpoints
app.use("/api/b2b/leads", adminAuth);
app.use("/api/b2b/leads/*", adminAuth);
app.use("/api/newsletter/subscribers", adminAuth);
app.use("/api/newsletter/stats", adminAuth);

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/linking", linkingRouter);
app.route("/api/b2b", b2bRouter);
app.route("/api/newsletter", newsletterRouter);
app.route("/api/ai", aiRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
