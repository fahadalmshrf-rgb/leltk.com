import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db, bookingsTable, venuesTable } from "@workspace/db";
import {
  CreateBookingBody,
  GetBookingParams,
  GetBookingResponse,
} from "@workspace/api-zod";
import { bookingCreateLimiter } from "../middleware/rateLimiters.js";

const router: IRouter = Router();

async function formatBooking(b: typeof bookingsTable.$inferSelect) {
  const [venue] = await db
    .select({ nameAr: venuesTable.nameAr, images: venuesTable.images })
    .from(venuesTable)
    .where(eq(venuesTable.id, b.venueId));

  return {
    id: b.id,
    venueId: b.venueId,
    venueName: venue?.nameAr ?? "",
    venueImage: venue?.images?.[0] ?? null,
    eventDate: b.eventDate,
    guestCount: b.guestCount,
    status: b.status,
    totalPrice: Number(b.totalPrice),
    reviewToken: b.reviewToken,
    notes: b.notes ?? null,
    groomName: b.groomName,
    brideName: b.brideName,
    contactPhone: b.contactPhone,
    createdAt: b.createdAt.toISOString(),
  };
}

/**
 * Returns true if the string is a valid calendar date (e.g. rejects 2026-02-30).
 * Date.parse normalises invalid dates (Feb 30 → Mar 2), so the round-tripped
 * ISO string won't match the input if the date was invalid.
 */
function isValidCalendarDate(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().startsWith(dateStr);
}

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

router.post("/bookings", bookingCreateLimiter, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Validate that eventDate is a real calendar date (catches e.g. 2026-02-30)
  if (!isValidCalendarDate(parsed.data.eventDate)) {
    res.status(400).json({ error: "eventDate is not a valid calendar date" });
    return;
  }

  // Validate eventDate is today or in the future (lexicographic comparison is
  // safe for ISO date strings in YYYY-MM-DD format)
  const today = new Date().toISOString().split("T")[0];
  if (parsed.data.eventDate < today) {
    res.status(400).json({ error: "eventDate must be today or a future date" });
    return;
  }

  // Look up the venue to derive the price server-side; never trust client-supplied price
  const [venue] = await db
    .select({ id: venuesTable.id, pricePerNight: venuesTable.pricePerNight })
    .from(venuesTable)
    .where(eq(venuesTable.id, parsed.data.venueId));

  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const serverPrice = String(venue.pricePerNight);

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      venueId: parsed.data.venueId,
      eventDate: parsed.data.eventDate,
      guestCount: parsed.data.guestCount,
      totalPrice: serverPrice,
      notes: parsed.data.notes,
      groomName: parsed.data.groomName,
      brideName: parsed.data.brideName,
      contactPhone: parsed.data.contactPhone,
      status: "pending",
    })
    .returning();

  res.status(201).json(await formatBooking(booking));
});

router.get("/bookings/:id", requireMerchantSession, async (req, res): Promise<void> => {
  const merchantId: number = res.locals.sessionMerchantId;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBookingParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, parsed.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Verify the booking's venue belongs to the authenticated merchant
  const [venueOwner] = await db
    .select({ merchantId: venuesTable.merchantId })
    .from(venuesTable)
    .where(eq(venuesTable.id, booking.venueId));

  if (!venueOwner || venueOwner.merchantId !== merchantId) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json(GetBookingResponse.parse(await formatBooking(booking)));
});

export { formatBooking };
export default router;
