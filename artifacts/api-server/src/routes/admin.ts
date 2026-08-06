import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, desc, sql } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod/v4";
import { db, adminsTable, venuesTable, merchantsTable, insertVenueSchema } from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";

const objectStorageService = new ObjectStorageService();

const router: IRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "محاولات دخول كثيرة، حاول مرة أخرى بعد قليل" },
});

router.post("/auth/admin/login", loginLimiter, async (req, res): Promise<void> => {
  const { username, password } = req.body as Record<string, unknown>;
  if (typeof username !== "string" || !username || typeof password !== "string" || !password) {
    res.status(400).json({ error: "username and password are required" });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, username.toLowerCase().trim()));

  const invalid = () => res.status(401).json({ error: "بيانات الدخول غير صحيحة" });

  if (!admin) {
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    invalid();
    return;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    invalid();
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    req.session.adminId = admin.id;
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: "Session error" });
        return;
      }
      res.json({ adminId: admin.id, displayName: admin.displayName });
    });
  });
});

router.get("/auth/admin/me", async (req, res): Promise<void> => {
  if (!req.session.adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [admin] = await db
    .select({ id: adminsTable.id, displayName: adminsTable.displayName })
    .from(adminsTable)
    .where(eq(adminsTable.id, req.session.adminId));
  if (!admin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ adminId: admin.id, displayName: admin.displayName });
});

router.post("/auth/admin/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

const FIELD_STATUSES = [
  "not_visited",
  "visited",
  "owner_contacted",
  "agreement_signed",
  "live",
] as const;

const adminVenueSchema = insertVenueSchema
  .omit({ rating: true, reviewCount: true })
  .extend({
    nameAr: z.string().min(1).max(200),
    district: z.string().min(1).max(100),
    fieldStatus: z.enum(FIELD_STATUSES).optional(),
    ownerName: z.string().max(200).nullable().optional(),
    ownerPhone: z.string().max(30).nullable().optional(),
    privateNotes: z.string().max(5000).nullable().optional(),
  });

router.get("/admin/venues", requireAdmin, async (req, res): Promise<void> => {
  const rawStatus = typeof req.query.status === "string" ? req.query.status : undefined;
  const status = rawStatus && (FIELD_STATUSES as readonly string[]).includes(rawStatus) ? rawStatus : undefined;
  if (rawStatus && !status) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const rows = await db
    .select()
    .from(venuesTable)
    .where(status ? eq(venuesTable.fieldStatus, status) : undefined)
    .orderBy(desc(venuesTable.createdAt));
  res.json(rows);
});

router.get("/admin/venues/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(venue);
});

router.post("/admin/venues", requireAdmin, async (req, res): Promise<void> => {
  const parsed = adminVenueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
    return;
  }
  const [venue] = await db.insert(venuesTable).values(parsed.data).returning();
  res.status(201).json(venue);
});

router.put("/admin/venues/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = adminVenueSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
    return;
  }
  const [venue] = await db
    .update(venuesTable)
    .set(parsed.data)
    .where(eq(venuesTable.id, id))
    .returning();
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(venue);
});

router.delete("/admin/venues/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [venue] = await db.delete(venuesTable).where(eq(venuesTable.id, id)).returning({ id: venuesTable.id });
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json({ ok: true });
});

// POST /admin/venues/upload-url — request a presigned URL for a venue photo or PDF
router.post("/admin/venues/upload-url", requireAdmin, async (req, res): Promise<void> => {
  const parsed = z.object({
    name: z.string().min(1),
    size: z.number().int().min(1),
    contentType: z.string().min(1),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة" });
    return;
  }
  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath });
  } catch (err) {
    res.status(500).json({ error: "فشل توليد رابط الرفع" });
  }
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const byStatus = await db
    .select({ fieldStatus: venuesTable.fieldStatus, count: sql<number>`count(*)::int` })
    .from(venuesTable)
    .groupBy(venuesTable.fieldStatus);
  const byDistrict = await db
    .select({ district: venuesTable.district, count: sql<number>`count(*)::int` })
    .from(venuesTable)
    .groupBy(venuesTable.district)
    .orderBy(desc(sql`count(*)`));
  const [totals] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(venuesTable);
  res.json({ total: totals?.total ?? 0, byStatus, byDistrict });
});

// ── Team management ────────────────────────────────────────────────────────

router.get("/admin/team", requireAdmin, async (_req, res): Promise<void> => {
  const admins = await db
    .select({ id: adminsTable.id, username: adminsTable.username, displayName: adminsTable.displayName, createdAt: adminsTable.createdAt })
    .from(adminsTable)
    .orderBy(adminsTable.createdAt);
  res.json(admins);
});

const createAdminSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, "اسم المستخدم: أحرف إنجليزية صغيرة وأرقام وشرطة سفلية فقط"),
  displayName: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

router.post("/admin/team", requireAdmin, async (req, res): Promise<void> => {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
    return;
  }
  const { username, displayName, password } = parsed.data;

  const [existing] = await db.select({ id: adminsTable.id }).from(adminsTable).where(eq(adminsTable.username, username.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "اسم المستخدم مستخدم بالفعل" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [admin] = await db
    .insert(adminsTable)
    .values({ username: username.toLowerCase(), displayName, passwordHash })
    .returning({ id: adminsTable.id, username: adminsTable.username, displayName: adminsTable.displayName, createdAt: adminsTable.createdAt });
  res.status(201).json(admin);
});

router.delete("/admin/team/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (id === req.session.adminId) {
    res.status(400).json({ error: "لا يمكنك حذف حسابك الخاص" });
    return;
  }
  // Serialize admin deletions so two concurrent deletes can't leave zero admins.
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`LOCK TABLE ${adminsTable} IN SHARE ROW EXCLUSIVE MODE`);
    const [target] = await tx.select({ id: adminsTable.id }).from(adminsTable).where(eq(adminsTable.id, id));
    if (!target) return "not_found" as const;
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(adminsTable);
    if (count <= 1) return "last_admin" as const;
    await tx.delete(adminsTable).where(eq(adminsTable.id, id));
    return "deleted" as const;
  });
  if (result === "not_found") {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }
  if (result === "last_admin") {
    res.status(400).json({ error: "لا يمكن حذف آخر مشرف متبقٍّ في النظام" });
    return;
  }
  res.json({ ok: true });
});

// ── Convert venue to merchant account ────────────────────────────────────

const CONVERTIBLE_STATUSES = ["agreement_signed", "live"] as const;

router.post("/admin/venues/:id/convert-to-merchant", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [venue] = await db.select().from(venuesTable).where(eq(venuesTable.id, id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  if (venue.merchantId) {
    res.status(409).json({ error: "القاعة مرتبطة بحساب تاجر بالفعل" });
    return;
  }

  if (!(CONVERTIBLE_STATUSES as readonly string[]).includes(venue.fieldStatus)) {
    res.status(400).json({ error: "يجب أن تكون حالة القاعة 'تم توقيع الاتفاقية' أو 'منشورة'" });
    return;
  }

  if (!venue.ownerName || !venue.ownerPhone) {
    res.status(400).json({ error: "يجب تعيين اسم المالك وجواله في بيانات القاعة أولاً" });
    return;
  }

  // Derive a unique email from the owner's phone number
  const phoneDigits = venue.ownerPhone.replace(/\D/g, "");
  const email = `${phoneDigits}@merchant.lailtak.sa`;

  const [existingByEmail] = await db
    .select({ id: merchantsTable.id })
    .from(merchantsTable)
    .where(eq(merchantsTable.email, email));

  if (existingByEmail) {
    res.status(409).json({ error: "يوجد حساب تاجر مسجل بهذا الرقم بالفعل" });
    return;
  }

  // Generate a random 12-character password (no ambiguous chars)
  const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [merchant] = await db
    .insert(merchantsTable)
    .values({
      ownerName: venue.ownerName,
      businessName: venue.nameAr,
      phone: venue.ownerPhone,
      email,
      crNumber: `ADMIN-${venue.id}`,
      passwordHash,
      status: "approved",
    })
    .returning();

  await db
    .update(venuesTable)
    .set({ merchantId: merchant.id })
    .where(eq(venuesTable.id, id));

  res.status(201).json({ merchantId: merchant.id, email, password });
});

// ── Change own password ───────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.post("/admin/auth/change-password", requireAdmin, async (req, res): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, req.session.adminId!));
  if (!admin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) {
    res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(adminsTable).set({ passwordHash: newHash }).where(eq(adminsTable.id, admin.id));
  res.json({ ok: true });
});

export default router;
