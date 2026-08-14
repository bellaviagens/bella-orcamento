import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, savedTourProposals, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function saveTourProposal(input: { ownerOpenId: string; clientName: string; proposalTitle: string; snapshot: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para salvar a proposta.");

  const existing = await db
    .select({ id: savedTourProposals.id })
    .from(savedTourProposals)
    .where(and(eq(savedTourProposals.ownerOpenId, input.ownerOpenId), eq(savedTourProposals.clientName, input.clientName)))
    .limit(1);

  if (existing[0]) {
    await db.update(savedTourProposals)
      .set({ proposalTitle: input.proposalTitle, snapshot: input.snapshot, updatedAt: new Date() })
      .where(eq(savedTourProposals.id, existing[0].id));
    return existing[0].id;
  }

  const id = crypto.randomUUID();
  await db.insert(savedTourProposals).values({ ...input, id });
  return id;
}

export async function listTourProposals(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: savedTourProposals.id,
    clientName: savedTourProposals.clientName,
    proposalTitle: savedTourProposals.proposalTitle,
    updatedAt: savedTourProposals.updatedAt,
  }).from(savedTourProposals)
    .where(eq(savedTourProposals.ownerOpenId, ownerOpenId))
    .orderBy(desc(savedTourProposals.updatedAt));
}

export async function getTourProposal(ownerOpenId: string, id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(savedTourProposals)
    .where(and(eq(savedTourProposals.id, id), eq(savedTourProposals.ownerOpenId, ownerOpenId)))
    .limit(1);
  return result[0];
}
