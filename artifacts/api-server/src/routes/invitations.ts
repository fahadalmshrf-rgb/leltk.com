import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db, invitationsTable, rsvpsTable } from "@workspace/db";
import {
  CreateInvitationBody,
  GetPublicInvitationParams,
  GetPublicInvitationResponse,
  RespondToInvitationParams,
  RespondToInvitationBody,
  GetManagedInvitationResponse,
} from "@workspace/api-zod";
import { invitationCreateLimiter, rsvpLimiter } from "../middleware/rateLimiters.js";

const router: IRouter = Router();

const RSVP_WINDOW_MS = 60 * 60 * 1000;
const RSVP_MAX_PER_WINDOW = 10;
const rsvpHits = new Map<string, number[]>();

function isRateLimited(ip: string, token: string): boolean {
  const key = `${ip}:${token}`;
  const now = Date.now();
  const cutoff = now - RSVP_WINDOW_MS;
  const hits = (rsvpHits.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= RSVP_MAX_PER_WINDOW) {
    rsvpHits.set(key, hits);
    return true;
  }
  hits.push(now);
  rsvpHits.set(key, hits);
  return false;
}

function formatInvitation(inv: typeof invitationsTable.$inferSelect) {
  return {
    id: inv.id,
    publicToken: inv.publicToken,
    manageToken: inv.manageToken,
    template: inv.template,
    inviterType: inv.inviterType,
    groomName: inv.groomName,
    groomFatherName: inv.groomFatherName,
    brideFatherName: inv.brideFatherName,
    brideMotherName: inv.brideMotherName,
    groomSideRef: inv.groomSideRef,
    eventDate: inv.eventDate,
    eventTime: inv.eventTime,
    venueName: inv.venueName,
    venueAddress: inv.venueAddress,
    note: inv.note,
    giftEnabled: inv.giftEnabled,
    giftIban: inv.giftIban,
    giftBankName: inv.giftBankName,
    giftStcPay: inv.giftStcPay,
    giftNote: inv.giftNote,
    createdAt: inv.createdAt.toISOString(),
  };
}

function formatRsvp(r: typeof rsvpsTable.$inferSelect) {
  return {
    id: r.id,
    guestName: r.guestName,
    attending: r.attending,
    partySize: r.partySize,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
  };
}

router.post("/invitations", invitationCreateLimiter, async (req, res): Promise<void> => {
  const parsed = CreateInvitationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const template = parsed.data.template === "classic" ? "classic" : "emerald";
  const isClassic = template === "classic";
  const inviterType = parsed.data.inviterType;
  const groomName = parsed.data.groomName?.trim() || null;
  const groomFatherName = isClassic ? parsed.data.groomFatherName?.trim() || null : null;
  const brideFatherName = parsed.data.brideFatherName?.trim() || null;
  const brideMotherName = parsed.data.brideMotherName?.trim() || null;
  const groomSideRef = parsed.data.groomSideRef?.trim() || null;

  const giftEnabled = parsed.data.giftEnabled === true;
  const giftIban = giftEnabled ? parsed.data.giftIban?.trim() || null : null;
  const giftBankName = giftEnabled ? parsed.data.giftBankName?.trim() || null : null;
  const giftStcPay = giftEnabled ? parsed.data.giftStcPay?.trim() || null : null;
  const giftNote = giftEnabled ? parsed.data.giftNote?.trim() || null : null;

  if (inviterType === "groom" && !groomName) {
    res.status(400).json({ error: "groomName is required for a groom invitation" });
    return;
  }

  const [invitation] = await db
    .insert(invitationsTable)
    .values({
      publicToken: randomUUID(),
      manageToken: randomUUID(),
      template,
      inviterType,
      groomName,
      groomFatherName,
      brideFatherName,
      brideMotherName,
      groomSideRef,
      eventDate: parsed.data.eventDate,
      eventTime: parsed.data.eventTime ?? null,
      venueName: parsed.data.venueName ?? null,
      venueAddress: parsed.data.venueAddress ?? null,
      note: parsed.data.note ?? null,
      giftEnabled,
      giftIban,
      giftBankName,
      giftStcPay,
      giftNote,
    })
    .returning();

  res.status(201).json(formatInvitation(invitation));
});

router.get("/invitations/public/:publicToken", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.publicToken)
    ? req.params.publicToken[0]
    : req.params.publicToken;
  const parsed = GetPublicInvitationParams.safeParse({ publicToken: raw });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.publicToken, parsed.data.publicToken));

  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  res.json(
    GetPublicInvitationResponse.parse({
      publicToken: invitation.publicToken,
      template: invitation.template,
      inviterType: invitation.inviterType,
      groomName: invitation.groomName,
      groomFatherName: invitation.groomFatherName,
      brideFatherName: invitation.brideFatherName,
      brideMotherName: invitation.brideMotherName,
      groomSideRef: invitation.groomSideRef,
      eventDate: invitation.eventDate,
      eventTime: invitation.eventTime,
      venueName: invitation.venueName,
      venueAddress: invitation.venueAddress,
      note: invitation.note,
      giftEnabled: invitation.giftEnabled,
      giftIban: invitation.giftIban,
      giftBankName: invitation.giftBankName,
      giftStcPay: invitation.giftStcPay,
      giftNote: invitation.giftNote,
    })
  );
});

router.post("/invitations/public/:publicToken/rsvp", rsvpLimiter, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.publicToken)
    ? req.params.publicToken[0]
    : req.params.publicToken;
  const params = RespondToInvitationParams.safeParse({ publicToken: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const ip = req.ip ?? "unknown";

  if (isRateLimited(ip, params.data.publicToken)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  const body = RespondToInvitationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const guestName = body.data.guestName.trim();
  if (guestName.length < 1 || guestName.length > 100) {
    res.status(400).json({ error: "guestName must be between 1 and 100 characters" });
    return;
  }

  const message = body.data.message?.trim() ?? null;

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.publicToken, params.data.publicToken));

  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  const MAX_RSVPS_PER_INVITATION = 500;
  const [{ total }] = await db
    .select({ total: count() })
    .from(rsvpsTable)
    .where(eq(rsvpsTable.invitationId, invitation.id));
  if (total >= MAX_RSVPS_PER_INVITATION) {
    res.status(422).json({ error: "This invitation has reached its maximum number of responses." });
    return;
  }

  const MAX_PARTY_SIZE = 20;
  const requested = Math.floor(Number(body.data.partySize ?? 1));
  const partySize = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 1), MAX_PARTY_SIZE)
    : 1;

  const [rsvp] = await db
    .insert(rsvpsTable)
    .values({
      invitationId: invitation.id,
      guestName,
      attending: body.data.attending,
      partySize: body.data.attending ? partySize : 0,
      message,
    })
    .onConflictDoUpdate({
      target: [rsvpsTable.invitationId, rsvpsTable.guestName],
      set: {
        attending: body.data.attending,
        partySize: body.data.attending ? partySize : 0,
        message,
      },
    })
    .returning();

  res.status(201).json(formatRsvp(rsvp));
});

router.get("/invitations/manage", async (req, res): Promise<void> => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(eq(invitationsTable.manageToken, token));

  if (!invitation) {
    res.status(404).json({ error: "Invitation not found" });
    return;
  }

  const rsvps = await db
    .select()
    .from(rsvpsTable)
    .where(eq(rsvpsTable.invitationId, invitation.id))
    .orderBy(desc(rsvpsTable.createdAt));

  const attending = rsvps.filter((r) => r.attending);
  const declining = rsvps.filter((r) => !r.attending);
  const totalAttendingGuests = attending.reduce((sum, r) => sum + r.partySize, 0);

  res.json(
    GetManagedInvitationResponse.parse({
      invitation: formatInvitation(invitation),
      rsvps: rsvps.map(formatRsvp),
      stats: {
        totalResponses: rsvps.length,
        attendingResponses: attending.length,
        decliningResponses: declining.length,
        totalAttendingGuests,
      },
    })
  );
});

export default router;
