import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { logger } from "./logger";

/**
 * If the admins table is empty, create the initial "admin" account using the
 * ADMIN_INITIAL_PASSWORD secret. This ensures fresh environments (e.g. a new
 * production database) always have an admin login. Does nothing when at least
 * one admin already exists.
 */
export async function bootstrapAdmin(): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminsTable);
  if (count > 0) return;

  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) {
    logger.warn(
      "admins table is empty and ADMIN_INITIAL_PASSWORD is not set — no admin account created",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(adminsTable)
    .values({ username: "admin", displayName: "المدير", passwordHash })
    .onConflictDoNothing();
  logger.info("Created initial admin account (username: admin)");
}
