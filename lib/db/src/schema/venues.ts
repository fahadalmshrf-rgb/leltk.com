import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { merchantsTable } from "./merchants";

export const venuesTable = pgTable("venues", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  categorySlug: text("category_slug").notNull(),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull(),
  district: text("district").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  images: text("images").array().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  amenities: text("amenities").array().notNull().default([]),
  services: text("services").array().notNull().default([]),
  description: text("description"),
  merchantId: integer("merchant_id").references(() => merchantsTable.id),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  address: text("address"),
  phone: text("phone"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  fieldStatus: text("field_status").notNull().default("not_visited"),
  ownerName: text("owner_name"),
  ownerPhone: text("owner_phone"),
  privateNotes: text("private_notes"),
  capacityMin: integer("capacity_min"),
  menuPdf: text("menu_pdf"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVenueSchema = createInsertSchema(venuesTable).omit({ id: true, createdAt: true });
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venuesTable.$inferSelect;
