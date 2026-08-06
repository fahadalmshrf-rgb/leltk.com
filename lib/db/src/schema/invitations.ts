import { pgTable, text, serial, timestamp, integer, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invitationsTable = pgTable("invitations", {
  id: serial("id").primaryKey(),
  publicToken: text("public_token").notNull().unique(),
  manageToken: text("manage_token").notNull().unique(),
  template: text("template").notNull().default("emerald"),
  inviterType: text("inviter_type").notNull().default("groom"),
  groomName: text("groom_name"),
  groomFatherName: text("groom_father_name"),
  brideFatherName: text("bride_father_name"),
  brideMotherName: text("bride_mother_name"),
  groomSideRef: text("groom_side_ref"),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  venueName: text("venue_name"),
  venueAddress: text("venue_address"),
  note: text("note"),
  giftEnabled: boolean("gift_enabled").notNull().default(false),
  giftIban: text("gift_iban"),
  giftBankName: text("gift_bank_name"),
  giftStcPay: text("gift_stc_pay"),
  giftNote: text("gift_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rsvpsTable = pgTable(
  "rsvps",
  {
    id: serial("id").primaryKey(),
    invitationId: integer("invitation_id").notNull().references(() => invitationsTable.id),
    guestName: text("guest_name").notNull(),
    attending: boolean("attending").notNull(),
    partySize: integer("party_size").notNull().default(1),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("rsvps_invitation_guest_uniq").on(table.invitationId, table.guestName)],
);

export const insertInvitationSchema = createInsertSchema(invitationsTable).omit({
  id: true,
  publicToken: true,
  manageToken: true,
  createdAt: true,
});
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type Invitation = typeof invitationsTable.$inferSelect;

export const insertRsvpSchema = createInsertSchema(rsvpsTable).omit({
  id: true,
  invitationId: true,
  createdAt: true,
});
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
export type Rsvp = typeof rsvpsTable.$inferSelect;
