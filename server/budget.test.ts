import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("appRouter", () => {
  it("has parseFlightScreenshot procedure", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.parseFlightScreenshot).toBeDefined();
  });

  it("has parseHotelScreenshot procedure", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.parseHotelScreenshot).toBeDefined();
  });

  it("has auth.me procedure", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.auth.me).toBeDefined();
  });
});

describe("budgetTypes defaults", () => {
  it("defaultBudgetData has correct structure", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(defaultBudgetData.flights).toEqual([]);
    expect(defaultBudgetData.hotels).toEqual([]);
    expect(defaultBudgetData.fareComparison.tiers).toEqual([]);
    expect(defaultBudgetData.baggage).toHaveLength(3);
    expect(defaultBudgetData.tripInfo.introText).toContain("Prezadíssimos");
  });

  it("baggage has correct default items", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(defaultBudgetData.baggage[0].type).toBe("Mala de Mão");
    expect(defaultBudgetData.baggage[0].weight).toBe("12kg");
    expect(defaultBudgetData.baggage[1].type).toBe("1ª Mala Despachada");
    expect(defaultBudgetData.baggage[2].type).toBe("2ª Mala Despachada");
  });

  it("fare comparison tiers are empty by default", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(Array.isArray(defaultBudgetData.fareComparison.tiers)).toBe(true);
    expect(defaultBudgetData.fareComparison.tiers.length).toBe(0);
  });
});
