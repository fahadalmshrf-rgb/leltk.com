import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, reviewsTable, venuesTable, bookingsTable } from "@workspace/db";
import {
  ListVenueReviewsParams,
  ListVenueReviewsResponse,
  CreateVenueReviewParams,
  CreateVenueReviewBody,
} from "@workspace/api-zod";
import { reviewCreateLimiter } from "../middleware/rateLimiters.js";

const router: IRouter = Router();

function formatReview(r: typeof reviewsTable.$inferSelect) {
  return {
    id: r.id,
    venueId: r.venueId,
    authorName: r.authorName,
    rating: Number(r.rating),
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/venues/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListVenueReviewsParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.venueId, parsed.data.id))
    .orderBy(sql`created_at desc`);

  res.json(ListVenueReviewsResponse.parse(reviews.map(formatReview)));
});

router.post("/venues/:id/reviews", reviewCreateLimiter, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateVenueReviewParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CreateVenueReviewBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Look up the booking by its unguessable reviewToken. This proves the caller
  // possesses the token issued at booking creation — no account login required,
  // but an attacker who has never made or seen a real booking cannot forge reviews.
  const [booking] = await db
    .select({ id: bookingsTable.id, venueId: bookingsTable.venueId, status: bookingsTable.status })
    .from(bookingsTable)
    .where(eq(bookingsTable.reviewToken, body.data.reviewToken));

  if (!booking) {
    res.status(404).json({ error: "Invalid review token" });
    return;
  }

  if (booking.venueId !== params.data.id) {
    res.status(400).json({ error: "Review token does not match this venue" });
    return;
  }

  if (booking.status !== "confirmed" && booking.status !== "completed") {
    res.status(400).json({ error: "Reviews can only be submitted for confirmed or completed bookings" });
    return;
  }

  // Clamp rating to [1, 5] as defence-in-depth beyond schema validation
  const rating = Math.min(5, Math.max(1, body.data.rating));

  let review;
  try {
    const [inserted] = await db
      .insert(reviewsTable)
      .values({
        venueId: params.data.id,
        bookingId: booking.id,
        authorName: body.data.authorName,
        rating: String(rating),
        comment: body.data.comment,
      })
      .returning();
    review = inserted;
  } catch (err: unknown) {
    // Unique constraint violation on booking_id — one review per booking.
    // Drizzle wraps the underlying pg error, so check both the error itself and its cause.
    const e = err as { code?: string; cause?: { code?: string } };
    if (e?.code === "23505" || e?.cause?.code === "23505") {
      res.status(409).json({ error: "A review has already been submitted for this booking" });
      return;
    }
    throw err;
  }

  // Update venue aggregate rating from verified reviews only
  const allReviews = await db
    .select({ rating: reviewsTable.rating })
    .from(reviewsTable)
    .where(eq(reviewsTable.venueId, params.data.id));

  const avgRating = allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / allReviews.length;

  await db
    .update(venuesTable)
    .set({
      rating: String(avgRating.toFixed(1)),
      reviewCount: allReviews.length,
    })
    .where(eq(venuesTable.id, params.data.id));

  res.status(201).json(formatReview(review));
});

export default router;
