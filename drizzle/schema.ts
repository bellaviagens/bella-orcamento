import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const savedTourProposals = mysqlTable("saved_tour_proposals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  proposalTitle: varchar("proposalTitle", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "approved"]).default("pending").notNull(),
  snapshot: text("snapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedTourProposal = typeof savedTourProposals.$inferSelect;
export type InsertSavedTourProposal = typeof savedTourProposals.$inferInsert;

export const savedBudgetDrafts = mysqlTable("saved_budget_drafts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  snapshot: text("snapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedBudgetDraft = typeof savedBudgetDrafts.$inferSelect;
export type InsertSavedBudgetDraft = typeof savedBudgetDrafts.$inferInsert;

export const sharedItineraries = mysqlTable("shared_itineraries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  snapshot: text("snapshot").notNull(),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SharedItinerary = typeof sharedItineraries.$inferSelect;
export type InsertSharedItinerary = typeof sharedItineraries.$inferInsert;
