import { pgTable, text, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("citizen"),
  fakeStrikes: integer("fake_strikes").default(0),
  createdAt: text("created_at").notNull(),
});

export const buildingsTable = pgTable("buildings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  builder: text("builder").notNull(),
  rating: real("rating").notNull(),
  status: text("status").notNull(),
  category: text("category"),
  lastAudit: text("last_audit"),
});

export const insertUserSchema = createInsertSchema(usersTable);
export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export const insertBuildingSchema = createInsertSchema(buildingsTable);
export type Building = typeof buildingsTable.$inferSelect;
export type InsertBuilding = typeof buildingsTable.$inferInsert;