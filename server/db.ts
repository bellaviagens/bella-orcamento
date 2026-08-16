import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, savedBudgetDrafts, savedTourProposals, sharedItineraries, users } from "../drizzle/schema";
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

type TourProposalStatus = "pending" | "sent" | "approved";

export async function saveBudgetDraft(input: { ownerOpenId: string; label: string; snapshot: string; id?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para salvar o rascunho.");

  if (input.id) {
    const result = await db.update(savedBudgetDrafts)
      .set({ label: input.label, snapshot: input.snapshot, updatedAt: new Date() })
      .where(and(eq(savedBudgetDrafts.id, input.id), eq(savedBudgetDrafts.ownerOpenId, input.ownerOpenId)));
    if ((result[0]?.affectedRows ?? 0) > 0) return input.id;
  }

  const id = crypto.randomUUID();
  await db.insert(savedBudgetDrafts).values({ id, ownerOpenId: input.ownerOpenId, label: input.label, snapshot: input.snapshot });
  return id;
}

function getBudgetDraftMetadata(snapshot: string) {
  try {
    const data = JSON.parse(snapshot) as {
      tripInfo?: { destination?: string };
      tourProposal?: { clientName?: string };
    };
    return {
      destination: data.tripInfo?.destination?.trim() || "",
      clientName: data.tourProposal?.clientName?.trim() || "",
    };
  } catch {
    return { destination: "", clientName: "" };
  }
}

export async function listBudgetDrafts(ownerOpenId: string, search = "") {
  const db = await getDb();
  if (!db) return [];

  const drafts = await db.select({
    id: savedBudgetDrafts.id,
    label: savedBudgetDrafts.label,
    snapshot: savedBudgetDrafts.snapshot,
    updatedAt: savedBudgetDrafts.updatedAt,
  }).from(savedBudgetDrafts)
    .where(eq(savedBudgetDrafts.ownerOpenId, ownerOpenId))
    .orderBy(desc(savedBudgetDrafts.updatedAt));

  const term = search.trim().toLocaleLowerCase("pt-BR");
  return drafts
    .map((draft) => ({
      id: draft.id,
      label: draft.label,
      updatedAt: draft.updatedAt,
      ...getBudgetDraftMetadata(draft.snapshot),
    }))
    .filter((draft) => !term || [draft.label, draft.destination, draft.clientName]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(term)));
}

export async function getBudgetDraft(ownerOpenId: string, id: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(savedBudgetDrafts)
    .where(and(eq(savedBudgetDrafts.id, id), eq(savedBudgetDrafts.ownerOpenId, ownerOpenId)))
    .limit(1);
  return result[0];
}

export async function renameBudgetDraft(ownerOpenId: string, id: string, label: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para renomear o rascunho.");

  const result = await db.update(savedBudgetDrafts)
    .set({ label, updatedAt: new Date() })
    .where(and(eq(savedBudgetDrafts.id, id), eq(savedBudgetDrafts.ownerOpenId, ownerOpenId)));
  return (result[0]?.affectedRows ?? 0) > 0;
}

export async function deleteBudgetDraft(ownerOpenId: string, id: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para excluir o rascunho.");

  const result = await db.delete(savedBudgetDrafts)
    .where(and(eq(savedBudgetDrafts.id, id), eq(savedBudgetDrafts.ownerOpenId, ownerOpenId)));
  return (result[0]?.affectedRows ?? 0) > 0;
}

export async function saveTourProposal(input: { ownerOpenId: string; clientName: string; proposalTitle: string; snapshot: string; status?: TourProposalStatus }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para salvar a proposta.");

  const existing = await db
    .select({ id: savedTourProposals.id })
    .from(savedTourProposals)
    .where(and(eq(savedTourProposals.ownerOpenId, input.ownerOpenId), eq(savedTourProposals.clientName, input.clientName)))
    .limit(1);

  if (existing[0]) {
    await db.update(savedTourProposals)
      .set({ proposalTitle: input.proposalTitle, snapshot: input.snapshot, ...(input.status ? { status: input.status } : {}), updatedAt: new Date() })
      .where(eq(savedTourProposals.id, existing[0].id));
    return existing[0].id;
  }

  const id = crypto.randomUUID();
  await db.insert(savedTourProposals).values({ ...input, id });
  return id;
}

export async function listTourProposals(ownerOpenId: string, search = "") {
  const db = await getDb();
  if (!db) return [];

  const term = search.trim();
  const whereClause = term
    ? and(eq(savedTourProposals.ownerOpenId, ownerOpenId), or(like(savedTourProposals.clientName, `%${term}%`), like(savedTourProposals.proposalTitle, `%${term}%`)))
    : eq(savedTourProposals.ownerOpenId, ownerOpenId);

  return db.select({
    id: savedTourProposals.id,
    clientName: savedTourProposals.clientName,
    proposalTitle: savedTourProposals.proposalTitle,
    status: savedTourProposals.status,
    updatedAt: savedTourProposals.updatedAt,
  }).from(savedTourProposals)
    .where(whereClause)
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

export async function duplicateTourProposal(ownerOpenId: string, id: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para duplicar a proposta.");

  const source = await getTourProposal(ownerOpenId, id);
  if (!source) return undefined;

  let snapshot = source.snapshot;
  try {
    const copiedBudget = JSON.parse(source.snapshot) as { tourProposal?: { clientName?: string; title?: string } };
    if (copiedBudget.tourProposal) {
      copiedBudget.tourProposal.clientName = `${source.clientName} — cópia`;
      copiedBudget.tourProposal.title = `${source.proposalTitle} — cópia`;
      snapshot = JSON.stringify(copiedBudget);
    }
  } catch {
    // Mantém o arquivo original caso uma proposta antiga não use o formato atual.
  }

  const copyId = crypto.randomUUID();
  await db.insert(savedTourProposals).values({
    id: copyId,
    ownerOpenId,
    clientName: `${source.clientName} — cópia`,
    proposalTitle: `${source.proposalTitle} — cópia`,
    snapshot,
    status: "pending",
  });
  return copyId;
}

export async function updateTourProposalStatus(ownerOpenId: string, id: string, status: TourProposalStatus) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para atualizar a proposta.");

  const result = await db.update(savedTourProposals)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(savedTourProposals.id, id), eq(savedTourProposals.ownerOpenId, ownerOpenId)));
  return result[0]?.affectedRows ?? 0;
}

export async function createSharedItinerary(input: { ownerOpenId: string; token: string; snapshot: string; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para compartilhar o roteiro.");

  const id = crypto.randomUUID();
  await db.insert(sharedItineraries).values({ ...input, id });
  return { id, token: input.token, expiresAt: input.expiresAt ?? null };
}

export async function getSharedItinerary(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select({
    snapshot: sharedItineraries.snapshot,
    updatedAt: sharedItineraries.updatedAt,
    expiresAt: sharedItineraries.expiresAt,
    revokedAt: sharedItineraries.revokedAt,
  }).from(sharedItineraries).where(eq(sharedItineraries.token, token)).limit(1);
  return result[0];
}

export async function revokeSharedItinerary(ownerOpenId: string, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para revogar o link compartilhado.");

  const result = await db.update(sharedItineraries)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sharedItineraries.ownerOpenId, ownerOpenId), eq(sharedItineraries.token, token), isNull(sharedItineraries.revokedAt)));
  return result[0]?.affectedRows ?? 0;
}
