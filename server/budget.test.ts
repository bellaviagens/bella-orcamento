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
    expect(defaultBudgetData.fareComparison.basic.name).toBe("BASIC");
    expect(defaultBudgetData.fareComparison.light.name).toBe("LIGHT");
    expect(defaultBudgetData.fareComparison.full.name).toBe("FULL");
    expect(defaultBudgetData.baggage).toHaveLength(3);
    expect(defaultBudgetData.tripInfo.introText).toContain("Prezadíssimos");
  });

  it("fare tiers have correct default benefit flags", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(defaultBudgetData.fareComparison.basic.carryOn).toBe(false);
    expect(defaultBudgetData.fareComparison.light.carryOn).toBe(true);
    expect(defaultBudgetData.fareComparison.full.carryOn).toBe(true);
    expect(defaultBudgetData.fareComparison.full.checkedBag).toBe(true);
    expect(defaultBudgetData.fareComparison.basic.checkedBag).toBe(false);
  });
});
