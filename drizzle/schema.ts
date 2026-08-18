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

export const favoriteRestaurants = mysqlTable("favorite_restaurants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  placeId: varchar("placeId", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  address: varchar("address", { length: 1000 }).notNull(),
  description: text("description").notNull(),
  rating: varchar("rating", { length: 16 }),
  mapsUrl: varchar("mapsUrl", { length: 2048 }).notNull(),
  website: varchar("website", { length: 2048 }),
  photoUrl: varchar("photoUrl", { length: 2048 }),
  tags: text("tags"),
  collectionName: varchar("collectionName", { length: 120 }),
  priceRange: varchar("priceRange", { length: 24 }),
  personalNote: text("personalNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FavoriteRestaurant = typeof favoriteRestaurants.$inferSelect;
export type InsertFavoriteRestaurant = typeof favoriteRestaurants.$inferInsert;

export const travelLibraryItems = mysqlTable("travel_library_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  category: mysqlEnum("category", ["hotel", "tour", "restaurant", "transfer"]).notNull(),
  folderName: varchar("folderName", { length: 120 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }),
  contactName: varchar("contactName", { length: 255 }),
  phone: varchar("phone", { length: 80 }),
  responsibleName: varchar("responsibleName", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 80 }),
  linkUrl: varchar("linkUrl", { length: 2048 }),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TravelLibraryItem = typeof travelLibraryItems.$inferSelect;
export type InsertTravelLibraryItem = typeof travelLibraryItems.$inferInsert;

export const travelClients = mysqlTable("travel_clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 80 }),
  email: varchar("email", { length: 320 }),
  document: varchar("document", { length: 40 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TravelClient = typeof travelClients.$inferSelect;
export type InsertTravelClient = typeof travelClients.$inferInsert;

export const sharedFavoriteLists = mysqlTable("shared_favorite_lists", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  snapshot: text("snapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SharedFavoriteList = typeof sharedFavoriteLists.$inferSelect;
export type InsertSharedFavoriteList = typeof sharedFavoriteLists.$inferInsert;
