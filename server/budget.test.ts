import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { calculateCombinedInstallmentValue, calculateCombinedTotal, calculateEffectiveHotelTotal } from "../shared/paymentCalculations";

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
    expect(defaultBudgetData.flights.length).toBeGreaterThan(0);
    expect(defaultBudgetData.hotels.length).toBeGreaterThan(0);
    expect(defaultBudgetData.fareComparison.tiers.length).toBeGreaterThan(0);
    expect(defaultBudgetData.baggage).toHaveLength(3);
    expect(defaultBudgetData.tripInfo.introText).toContain("Prezadíssimos");
  });

  it("baggage has correct default items", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(defaultBudgetData.baggage[0].type).toBe("Mala de Mao 12kg");
    expect(defaultBudgetData.baggage[0].weight).toBe("");
    expect(defaultBudgetData.baggage[1].type).toBe("Mala Despachada 23kg");
    expect(defaultBudgetData.baggage[2].type).toBe("2a Mala Despachada");
  });

  it("fare comparison tiers are available by default", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(Array.isArray(defaultBudgetData.fareComparison.tiers)).toBe(true);
    expect(defaultBudgetData.fareComparison.tiers.length).toBeGreaterThan(0);
  });
});

describe("parcelamento conjunto", () => {
  it("soma apenas a tarifa e o hotel da mesma opção", () => {
    const total = calculateCombinedTotal(1000, 2, 3000);

    expect(total).toBe(5000);
  });

  it("usa o total da hospedagem por diária antes de somá-lo à tarifa", () => {
    const hotelTotal = calculateEffectiveHotelTotal({
      totalPrice: 0,
      priceMode: "daily",
      dailyPrice: 500,
      nights: 5,
    });

    expect(calculateCombinedTotal(1000, 2, hotelTotal)).toBe(4500);
  });

  it("soma o aéreo da tarifa selecionada ao hotel antes de dividir pelas parcelas do aéreo", () => {
    const installmentValue = calculateCombinedInstallmentValue(1000, 2, 3000, 10);

    expect(installmentValue).toBe(500);
  });

  it("mantém cada combinação de tarifa e hotel separada", () => {
    const basicComHotelA = calculateCombinedTotal(1000, 2, 3000);
    const plusComHotelB = calculateCombinedTotal(1500, 2, 4500);

    expect(basicComHotelA).toBe(5000);
    expect(plusComHotelB).toBe(7500);
    expect(basicComHotelA).not.toBe(plusComHotelB);
  });
});
