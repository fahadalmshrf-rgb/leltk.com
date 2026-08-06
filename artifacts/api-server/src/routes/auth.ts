import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { db, merchantsTable } from "@workspace/db";

const router: IRouter = Router();

/**
 * Brute-force protection for merchant login. Limits repeated attempts per client
 * so an attacker cannot script guesses against the login endpoint. Successful
 * logins do not count against the limit.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "محاولات دخول كثيرة، حاول مرة أخرى بعد قليل" },
});

router.post("/auth/merchant/login", loginLimiter, async (req, res): Promise<void> => {
  const { email, password } = req.body as Record<string, unknown>;
  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const [merchant] = await db
    .select({
      id: merchantsTable.id,
      status: merchantsTable.status,
      businessName: merchantsTable.businessName,
      passwordHash: merchantsTable.passwordHash,
    })
    .from(merchantsTable)
    .where(eq(merchantsTable.email, email.toLowerCase().trim()));

  // Generic failure message to avoid leaking whether an account exists.
  const invalid = () => res.status(401).json({ error: "بيانات الدخول غير صحيحة" });

  if (!merchant || !merchant.passwordHash) {
    // Spend a hash comparison to reduce timing side-channels on account existence.
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    invalid();
    return;
  }

  const ok = await bcrypt.compare(password, merchant.passwordHash);
  if (!ok) {
    invalid();
    return;
  }

  // Suspended accounts are a real privilege boundary: deny access entirely.
  if (merchant.status === "suspended") {
    res.status(403).json({ error: "تم إيقاف هذا الحساب. تواصل مع الدعم" });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    req.session.merchantId = merchant.id;
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ merchantId: merchant.id, businessName: merchant.businessName, status: merchant.status });
    });
  });
});

router.get("/auth/merchant/me", (req, res): void => {
  if (!req.session.merchantId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ merchantId: req.session.merchantId });
});

router.post("/auth/merchant/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

export default router;
