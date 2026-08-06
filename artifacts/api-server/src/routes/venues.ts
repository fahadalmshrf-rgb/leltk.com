import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, sql } from "drizzle-orm";
import { db, venuesTable, bookingsTable, merchantsTable } from "@workspace/db";
import {
  ListVenuesQueryParams,
  ListVenuesResponse,
  GetFeaturedVenuesResponse,
  GetNearbyVenuesQueryParams,
  GetNearbyVenuesResponse,
  GetVenueStatsResponse,
  GetVenueParams,
  GetVenueResponse,
  GetVenueAvailabilityParams,
  GetVenueAvailabilityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * Only expose venues that belong to an approved merchant, or that were entered
 * directly by the platform (no merchant owner). This prevents unapproved/pending
 * merchant accounts from publishing venues into the public marketplace.
 */
const publiclyVisibleVenue = sql`(${venuesTable.merchantId} IS NULL OR ${venuesTable.merchantId} IN (SELECT ${merchantsTable.id} FROM ${merchantsTable} WHERE ${merchantsTable.status} = 'approved'))`;

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

function formatVenueDetail(v: typeof venuesTable.$inferSelect) {
  return {
    ...formatVenue(v),
    menuPdf: v.menuPdf ?? null,
    latitude: v.latitude != null ? Number(v.latitude) : null,
    longitude: v.longitude != null ? Number(v.longitude) : null,
    address: v.address ?? null,
    phone: v.phone ?? null,
    socialLinks: {
      instagram: v.instagramUrl ?? null,
      twitter: v.twitterUrl ?? null,
    },
  };
}

router.get("/venues", async (req, res): Promise<void> => {
  const parsed = ListVenuesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, minPrice, maxPrice, minCapacity, search, page = 1, limit = 20 } = parsed.data;

  const conditions = [publiclyVisibleVenue];
  if (category) conditions.push(eq(venuesTable.categorySlug, category));
  if (minPrice != null) conditions.push(gte(venuesTable.pricePerNight, String(minPrice)));
  if (maxPrice != null) conditions.push(lte(venuesTable.pricePerNight, String(maxPrice)));
  if (minCapacity != null) conditions.push(gte(venuesTable.capacity, minCapacity));
  if (search) conditions.push(ilike(venuesTable.nameAr, `%${search}%`));

  const whereClause = and(...conditions);
  const offset = (page - 1) * limit;

  const [venues, countResult] = await Promise.all([
    db.select().from(venuesTable).where(whereClause).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(venuesTable).where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  res.json(
    ListVenuesResponse.parse({
      venues: venues.map(formatVenue),
      total,
      page,
      limit,
    })
  );
});

router.get("/venues/featured", async (req, res): Promise<void> => {
  const venues = await db
    .select()
    .from(venuesTable)
    .where(and(eq(venuesTable.isFeatured, true), eq(venuesTable.isAvailable, true), publiclyVisibleVenue))
    .limit(10);

  res.json(GetFeaturedVenuesResponse.parse(venues.map(formatVenue)));
});

router.get("/venues/nearby", async (req, res): Promise<void> => {
  const parsed = GetNearbyVenuesQueryParams.safeParse(req.query);
  const district = parsed.success ? parsed.data.district : undefined;

  const conditions = [eq(venuesTable.isAvailable, true), publiclyVisibleVenue];
  if (district) conditions.push(ilike(venuesTable.district, `%${district}%`));

  const venues = await db
    .select()
    .from(venuesTable)
    .where(and(...conditions))
    .limit(10);

  res.json(GetNearbyVenuesResponse.parse(venues.map(formatVenue)));
});

router.get("/venues/stats", async (req, res): Promise<void> => {
  const bookingOnVisibleVenue = sql`${bookingsTable.venueId} IN (SELECT ${venuesTable.id} FROM ${venuesTable} WHERE ${publiclyVisibleVenue})`;

  const [venueCount, bookingCount, priceResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(venuesTable).where(publiclyVisibleVenue),
    db.select({ count: sql<number>`count(*)` }).from(bookingsTable).where(bookingOnVisibleVenue),
    db.select({ avg: sql<number>`avg(price_per_night)` }).from(venuesTable).where(publiclyVisibleVenue),
  ]);

  const categoryBreakdown = await db
    .select({
      categorySlug: venuesTable.categorySlug,
      count: sql<number>`count(*)`,
    })
    .from(venuesTable)
    .where(publiclyVisibleVenue)
    .groupBy(venuesTable.categorySlug);

  const districts = await db
    .select({ district: venuesTable.district })
    .from(venuesTable)
    .where(publiclyVisibleVenue)
    .groupBy(venuesTable.district);

  res.json(
    GetVenueStatsResponse.parse({
      totalVenues: Number(venueCount[0]?.count ?? 0),
      totalBookings: Number(bookingCount[0]?.count ?? 0),
      avgPrice: Number(priceResult[0]?.avg ?? 0),
      totalDistricts: districts.length,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        categorySlug: c.categorySlug,
        count: Number(c.count),
      })),
    })
  );
});

router.get("/venues/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetVenueParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [venue] = await db
    .select()
    .from(venuesTable)
    .where(and(eq(venuesTable.id, parsed.data.id), publiclyVisibleVenue));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  res.json(GetVenueResponse.parse(formatVenueDetail(venue)));
});

router.get("/venues/:id/availability", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetVenueAvailabilityParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [venue] = await db
    .select({ id: venuesTable.id })
    .from(venuesTable)
    .where(and(eq(venuesTable.id, parsed.data.id), publiclyVisibleVenue));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  // Only confirmed and completed bookings block dates; pending bookings (unverified
  // requests) do not block availability to prevent calendar-flooding attacks.
  const bookedDates = await db
    .select({ eventDate: bookingsTable.eventDate })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.venueId, parsed.data.id),
        sql`${bookingsTable.status} IN ('confirmed', 'completed')`
      )
    );

  const bookedDateStrings = bookedDates.map((b) => b.eventDate);

  // Generate next 60 available dates excluding booked ones
  const availableDates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    if (!bookedDateStrings.includes(dateStr)) {
      availableDates.push(dateStr);
      if (availableDates.length >= 60) break;
    }
  }

  res.json(
    GetVenueAvailabilityResponse.parse({
      venueId: parsed.data.id,
      availableDates,
      bookedDates: bookedDateStrings,
    })
  );
});

export default router;
