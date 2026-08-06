import rateLimit from "express-rate-limit";

/**
 * Rate limiter for booking creation.
 * 5 requests per 15 minutes per IP — enough for a real user, blocks calendar-flooding attacks.
 */
export const bookingCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many booking requests. Please wait before trying again." },
});

/**
 * Rate limiter for review creation.
 * 10 requests per hour per IP — generous for legitimate users, stops mass review spam.
 */
export const reviewCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many review submissions. Please wait before trying again." },
});

/**
 * Rate limiter for invitation creation.
 * 10 invitations per hour per IP — a real host creates one or two, blocks invitation spam.
 */
export const invitationCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many invitations created. Please wait before trying again." },
});

/**
 * IP-level rate limiter for RSVP submissions (defense-in-depth on top of the
 * per-invitation limiter and per-guest uniqueness constraint).
 * 30 per hour per IP — a device at a family gathering may submit several RSVPs.
 */
export const rsvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many RSVP submissions. Please wait before trying again." },
});

/**
 * Rate limiter for merchant registration.
 * 5 per hour per IP — registration is a one-time action, blocks mass fake accounts.
 */
export const merchantRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Please wait before trying again." },
});
