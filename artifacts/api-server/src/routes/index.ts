import "./session.d.ts";
import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "path";
import { existsSync } from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET env var is required");
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        const rawPath = req.url?.split("?")[0] ?? "";
        const safePath = rawPath.replace(
          /\/invitations\/manage\/[^/?#\s]+/g,
          "/invitations/manage/[REDACTED]",
        );
        return {
          id: req.id,
          method: req.method,
          url: safePath,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
// Explicit payload caps: reject oversized bodies before parsing
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Body-parser errors → clear JSON errors
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const e = err as { type?: string; status?: number };
    if (e?.type === "entity.too.large") {
      res.status(413).json({ error: "Request body too large" });
      return;
    }
    if (e?.type === "entity.parse.failed") {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
    next(err);
  },
);

app.use(
  session({
    name: "sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// Middleware: Intercept non-/api requests for backend routes and prepend /api
const apiPrefixes = [
  "/featured",
  "/nearby",
  "/venues",
  "/categories",
  "/auth",
  "/bookings",
  "/invitations",
  "/reviews",
  "/merchants",
  "/admin",
  "/storage",
  "/health",
];

app.use((req, _res, next) => {
  if (
    !req.path.startsWith("/api") &&
    apiPrefixes.some((prefix) => req.path.startsWith(prefix))
  ) {
    req.url = "/api" + req.url;
  }
  next();
});

// Mount router on /api
app.use("/api", router);

const lailtak = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "lailtak",
  "dist",
  "public",
);
const merchant = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "lailtak-merchant",
  "dist",
  "public",
);
const admin = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "lailtak-admin",
  "dist",
  "public",
);

if (existsSync(admin)) {
  app.use("/admin", express.static(admin));
  app.use("/admin/*splat", (_req, res) => {
    res.sendFile(path.join(admin, "index.html"));
  });
}

if (existsSync(lailtak)) {
  app.use("/merchant", express.static(merchant));
  app.use("/merchant/*splat", (_req, res) => {
    res.sendFile(path.join(merchant, "index.html"));
  });

  app.use("/", express.static(lailtak));
  app.use("/*splat", (_req, res) => {
    res.sendFile(path.join(lailtak, "index.html"));
  });
}

export default app; 