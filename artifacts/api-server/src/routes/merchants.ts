import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { and, eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, merchantsTable, venuesTable, bookingsTable } from "@workspace/db";
import {
  RegisterMerchantBody,
  GetMerchantParams,
  GetMerchantResponse,
  UpdateMerchantParams,
  UpdateMerchantBody,
  UpdateMerchantResponse,
  ListMerchantVenuesParams,
  ListMerchantVenuesResponse,
  CreateMerchantVenueParams,
  CreateMerchantVenueBody,
  UpdateMerchantVenueParams,
  UpdateMerchantVenueBody,
  UpdateMerchantVenueResponse,
  DeleteMerchantVenueParams,
  GetMerchantDashboardParams,
  GetMerchantDashboardResponse,
  ListMerchantBookingsParams,
  ListMerchantBookingsResponse,
  UpdateMerchantBookingParams,
  UpdateMerchantBookingBody,
  UpdateMerchantBookingResponse,
} from "@workspace/api-zod";
import { formatBooking } from "./bookings";
import { merchantRegisterLimiter } from "../middleware/rateLimiters.js";

const router: IRouter = Router();

/**
 * Middleware: require an authenticated merchant session.
 * Sets res.locals.sessionMerchantId on success.
 */
function requireMerchantSession(req: Request, res: Response, next: NextFunction): void {
  const merchantId = req.session.merchantId;
  if (!merchantId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.locals.sessionMerchantId = merchantId;
  next();
}

/**
 * Middleware: require the session merchant ID to match the :id route param.
 * Must be used after requireMerchantSession.
 */
function requireSelfMerchant(req: Request, res: Response, next: NextFunction): void {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const routeMerchantId = Number(rawId);
  if (!Number.isFinite(routeMerchantId) || routeMerchantId !== res.locals.sessionMerchantId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }
  next();
}

/**
 * Middleware: require the session merchant to be approved before allowing actions
 * that affect public marketplace state (e.g. publishing venues). Pending or
 * suspended accounts can access their own read-only surfaces but must not gain the
 * same effective privileges as approved merchants. Must run after requireMerchantSession.
 */
async function requireApprovedMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
  const merchantId = res.locals.sessionMerchantId as number | undefined;
  if (!merchantId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const [merchant] = await db
    .select({ status: merchantsTable.status })
    .from(merchantsTable)
    .where(eq(merchantsTable.id, merchantId));

  if (!merchant || merchant.status !== "approved") {
    res.status(403).json({ error: "حسابك قيد المراجعة. لا يمكن نشر القاعات قبل اعتماد الحساب" });
    return;
  }
  next();
}

function formatMerchant(m: typeof merchantsTable.$inferSelect) {
  return {
    id: m.id,
    ownerName: m.ownerName,
    businessName: m.businessName,
    phone: m.phone,
    email: m.email,
    crNumber: m.crNumber,
    status: m.status,
    logoUrl: m.logoUrl ?? null,
    description: m.description ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

function formatVenue(v: typeof venuesTable.$inferSelect) {
  return {
    id: v.id,
    nameAr: v.nameAr,
    categorySlug: v.categorySlug,
    pricePerNight: Number(v.pricePerNight),
    capacity: v.capacity,
    district: v.district,
    rating: Number(v.rating),
    reviewCount: v.reviewCount,
    images: v.images ?? [],
    isFeatured: v.isFeatured,
    isAvailable: v.isAvailable,
    amenities: v.amenities ?? [],
    services: v.services ?? [],
    description: v.description ?? null,
    merchantId: v.merchantId ?? null,
  };
}

router.post("/merchants/register", merchantRegisterLimiter, async (req, res): Promise<void> => {
  const parsed = RegisterMerchantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [merchant] = await db
    .insert(merchantsTable)
    .values({
      ownerName: parsed.data.ownerName,
      businessName: parsed.data.businessName,
      phone: parsed.data.phone,
      email: parsed.data.email.toLowerCase().trim(),
      crNumber: parsed.data.crNumber,
      passwordHash,
      description: parsed.data.description,
      logoUrl: parsed.data.logoUrl,
      status: "pending",
    })
    .returning();

  res.status(201).json(formatMerchant(merchant));
});

router.get("/merchants/:id", requireMerchantSession, requireSelfMerchant, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMerchantParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [merchant] = await db
    .select()
    .from(merchantsTable)
    .where(eq(merchantsTable.id, parsed.data.id));

  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }

  res.json(GetMerchantResponse.parse(formatMerchant(merchant)));
});

router.patch("/merchants/:id", requireMerchantSession, requireSelfMerchant, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateMerchantParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateMerchantBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<typeof merchantsTable.$inferInsert> = {};
  if (body.data.ownerName) updates.ownerName = body.data.ownerName;
  if (body.data.businessName) updates.businessName = body.data.businessName;
  if (body.data.phone) updates.phone = body.data.phone;
  if (body.data.description != null) updates.description = body.data.description;
  if (body.data.logoUrl != null) updates.logoUrl = body.data.logoUrl;

  const [merchant] = await db
    .update(merchantsTable)
    .set(updates)
    .where(eq(merchantsTable.id, params.data.id))
    .returning();

  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }

  res.json(UpdateMerchantResponse.parse(formatMerchant(merchant)));
});

router.get("/merchants/:id/venues", requireMerchantSession, requireSelfMerchant, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListMerchantVenuesParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const venues = await db
    .select()
    .from(venuesTable)
    .where(eq(venuesTable.merchantId, parsed.data.id));

  res.json(ListMerchantVenuesResponse.parse(venues.map(formatVenue)));
});

router.post("/merchants/:id/venues", requireMerchantSession, requireSelfMerchant, requireApprovedMerchant, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateMerchantVenueParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CreateMerchantVenueBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [venue] = await db
    .insert(venuesTable)
    .values({
      nameAr: body.data.nameAr,
      categorySlug: body.data.categorySlug,
      pricePerNight: String(body.data.pricePerNight),
      capacity: body.data.capacity,
      district: body.data.district,
      amenities: body.data.amenities ?? [],
      services: body.data.services ?? [],
      description: body.data.description,
      images: body.data.images ?? [],
      latitude: body.data.latitude != null ? String(body.data.latitude) : null,
      longitude: body.data.longitude != null ? String(body.data.longitude) : null,
      address: body.data.address,
      phone: body.data.phone,
      merchantId: params.data.id,
    })
    .returning();

  res.status(201).json(formatVenue(venue));
});

router.patch("/merchants/:id/venues/:venueId", requireMerchantSession, requireSelfMerchant, requireApprovedMerchant, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawVenueId = Array.isArray(req.params.venueId) ? req.params.venueId[0] : req.params.venueId;
  const params = UpdateMerchantVenueParams.safeParse({ id: rawId, venueId: rawVenueId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateMerchantVenueBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<typeof venuesTable.$inferInsert> = {};
  if (body.data.nameAr) updates.nameAr = body.data.nameAr;
  if (body.data.categorySlug) updates.categorySlug = body.data.categorySlug;
  if (body.data.pricePerNight != null) updates.pricePerNight = String(body.data.pricePerNight);
  if (body.data.capacity != null) updates.capacity = body.data.capacity;
  if (body.data.district) updates.district = body.data.district;
  if (body.data.amenities) updates.amenities = body.data.amenities;
  if (body.data.services) updates.services = body.data.services;
  if (body.data.description != null) updates.description = body.data.description;
  if (body.data.isAvailable != null) updates.isAvailable = body.data.isAvailable;
  if (body.data.images) updates.images = body.data.images;

  const [venue] = await db
    .update(venuesTable)
    .set(updates)
    .where(and(eq(venuesTable.id, params.data.venueId), eq(venuesTable.merchantId, params.data.id)))
    .returning();

  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  res.json(UpdateMerchantVenueResponse.parse(formatVenue(venue)));
});

router.delete("/merchants/:id/venues/:venueId", requireMerchantSession, requireSelfMerchant, requireApprovedMerchant, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawVenueId = Array.isArray(req.params.venueId) ? req.params.venueId[0] : req.params.venueId;
  const params = DeleteMerchantVenueParams.safeParse({ id: rawId, venueId: rawVenueId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .update(venuesTable)
    .set({ isAvailable: false })
    .where(and(eq(venuesTable.id, params.data.venueId), eq(venuesTable.merchantId, params.data.id)));

  res.sendStatus(204);
});

router.get("/merchants/:id/dashboard", requireMerchantSession, requireSelfMerchant, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMerchantDashboardParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const merchantId = parsed.data.id;

  const venues = await db
    .select({ id: venuesTable.id, rating: venuesTable.rating })
    .from(venuesTable)
    .where(eq(venuesTable.merchantId, merchantId));

  const venueIds = venues.map((v) => v.id);

  if (venueIds.length === 0) {
    res.json(
      GetMerchantDashboardResponse.parse({
        merchantId,
        totalVenues: 0,
        totalBookings: 0,
        totalRevenue: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        thisMonthRevenue: 0,
        avgRating: 0,
        recentBookings: [],
      })
    );
    return;
  }

  const allBookings = await db
    .select()
    .from(bookingsTable)
    .where(sql`venue_id = ANY(${sql.raw(`ARRAY[${venueIds.join(",")}]`)})`);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const totalRevenue = allBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  const thisMonthRevenue = allBookings
    .filter(
      (b) =>
        (b.status === "confirmed" || b.status === "completed") &&
        b.createdAt.toISOString() >= monthStart
    )
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  const avgRating =
    venues.length > 0
      ? venues.reduce((sum, v) => sum + Number(v.rating), 0) / venues.length
      : 0;

  const recentBookings = await db
    .select()
    .from(bookingsTable)
    .where(sql`venue_id = ANY(${sql.raw(`ARRAY[${venueIds.join(",")}]`)})`)
    .orderBy(sql`created_at desc`)
    .limit(5);

  const formattedRecent = await Promise.all(recentBookings.map(formatBooking));

  res.json(
    GetMerchantDashboardResponse.parse({
      merchantId,
      totalVenues: venues.length,
      totalBookings: allBookings.length,
      totalRevenue,
      pendingBookings: allBookings.filter((b) => b.status === "pending").length,
      confirmedBookings: allBookings.filter((b) => b.status === "confirmed").length,
      thisMonthRevenue,
      avgRating: Number(avgRating.toFixed(1)),
      recentBookings: formattedRecent,
    })
  );
});

router.get("/merchants/:id/bookings", requireMerchantSession, requireSelfMerchant, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListMerchantBookingsParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const venues = await db
    .select({ id: venuesTable.id })
    .from(venuesTable)
    .where(eq(venuesTable.merchantId, parsed.data.id));

  const venueIds = venues.map((v) => v.id);
  if (venueIds.length === 0) {
    res.json(ListMerchantBookingsResponse.parse([]));
    return;
  }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(sql`venue_id = ANY(${sql.raw(`ARRAY[${venueIds.join(",")}]`)})`)
    .orderBy(sql`created_at desc`);

  const formatted = await Promise.all(bookings.map(formatBooking));
  res.json(ListMerchantBookingsResponse.parse(formatted));
});

router.patch("/merchants/:id/bookings/:bookingId", requireMerchantSession, requireSelfMerchant, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const rawBookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const params = UpdateMerchantBookingParams.safeParse({ id: rawId, bookingId: rawBookingId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateMerchantBookingBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Verify the booking belongs to a venue owned by this merchant (IDOR fix)
  const [ownership] = await db
    .select({ venueId: venuesTable.id })
    .from(venuesTable)
    .innerJoin(bookingsTable, eq(bookingsTable.venueId, venuesTable.id))
    .where(
      and(
        eq(bookingsTable.id, params.data.bookingId),
        eq(venuesTable.merchantId, params.data.id)
      )
    );

  if (!ownership) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const updates: Partial<typeof bookingsTable.$inferInsert> = { status: body.data.status };
  if (body.data.notes != null) updates.notes = body.data.notes;

  const [booking] = await db
    .update(bookingsTable)
    .set(updates)
    .where(eq(bookingsTable.id, params.data.bookingId))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(UpdateMerchantBookingResponse.parse(await formatBooking(booking)));
});

export default router;
