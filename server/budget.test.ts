import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { calculateCombinedInstallmentValue, calculateCombinedTotal, calculateEffectiveHotelTotal } from "../shared/paymentCalculations";
import { calculateTourTotal, getTourTravelerCount } from "../shared/tourPricing";
import { duplicateHotelInBudget, duplicateTourInBudget, importQuotationActivitiesIntoBudget, reorderHotelsInBudget, reorderItineraryDaysInBudget, reorderToursInBudget } from "../client/src/contexts/BudgetContext";

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

  it("has parseTourScreenshot procedure", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.parseTourScreenshot).toBeDefined();
  });

  it("has importQuotationUrl procedure", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.importQuotationUrl).toBeDefined();
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
    expect(defaultBudgetData.tours).toEqual([]);
    expect(defaultBudgetData.itinerary).toEqual([]);
    expect(defaultBudgetData.tourProposal).toMatchObject({ title: "Proposta de passeios", introMessage: "", paymentDetails: "" });
    expect(defaultBudgetData.tripInfo.introText).toContain("Prezadíssimos");
  });

  it("baggage has correct default items", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(defaultBudgetData.baggage[0]).toMatchObject({ type: "Mala de Mão", weight: "12kg" });
    expect(defaultBudgetData.baggage[1]).toMatchObject({ type: "Mala Despachada", weight: "23kg" });
    expect(defaultBudgetData.baggage[2]).toMatchObject({ type: "2ª Mala Despachada", weight: "23kg" });
  });

  it("fare comparison tiers are available by default", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    expect(Array.isArray(defaultBudgetData.fareComparison.tiers)).toBe(true);
    expect(defaultBudgetData.fareComparison.tiers.length).toBeGreaterThan(0);
  });
});

describe("gestão de hotéis", () => {
  it("duplica o hotel logo após o original, preservando os dados e criando novo id", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const original = defaultBudgetData.hotels[0];
    const duplicatedBudget = duplicateHotelInBudget(defaultBudgetData, original.id);
    const duplicate = duplicatedBudget.hotels[1];

    expect(duplicatedBudget.hotels).toHaveLength(defaultBudgetData.hotels.length + 1);
    expect(duplicate.id).not.toBe(original.id);
    expect(duplicate.name).toBe(`${original.name} (cópia)`);
    expect(duplicate.address).toBe(original.address);
    expect(duplicate.amenities).toEqual(original.amenities);
    expect(duplicate.amenities).not.toBe(original.amenities);
    expect(duplicate.prices).not.toBe(original.prices);
  });

  it("substitui a ordem dos hotéis sem alterar seus dados", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const reversedHotels = [...defaultBudgetData.hotels].reverse();
    const reorderedBudget = reorderHotelsInBudget(defaultBudgetData, reversedHotels);

    expect(reorderedBudget.hotels.map((hotel) => hotel.id)).toEqual(
      reversedHotels.map((hotel) => hotel.id),
    );
    expect(reorderedBudget.hotels[0].name).toBe(defaultBudgetData.hotels[1].name);
  });
});

describe("gestão de passeios e roteiro", () => {
  it("calcula o total de passeio por pessoa usando a quantidade de viajantes informada", () => {
    const tour = {
      pricingMode: "perPerson" as const,
      pricePerPerson: 275,
      travelerCount: 3,
      totalPrice: 0,
    };

    expect(getTourTravelerCount(tour)).toBe(3);
    expect(calculateTourTotal(tour)).toBe(825);
  });

  it("preserva o valor total informado quando o passeio não é cobrado por pessoa", () => {
    const tour = {
      pricingMode: "total" as const,
      pricePerPerson: 0,
      travelerCount: 4,
      totalPrice: 950,
    };

    expect(calculateTourTotal(tour)).toBe(950);
  });

  it("duplica o passeio logo após o original com novo id", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const tour = { id: "tour-1", name: "Vinícola", location: "Vale", duration: "6 horas", description: "Degustação", totalPrice: 300, pageUrl: "", photosUrl: "" };
    const budget = { ...defaultBudgetData, tours: [tour] };
    const duplicatedBudget = duplicateTourInBudget(budget, tour.id);

    expect(duplicatedBudget.tours).toHaveLength(2);
    expect(duplicatedBudget.tours[1]).toMatchObject({ name: "Vinícola (cópia)", location: "Vale", totalPrice: 300 });
    expect(duplicatedBudget.tours[1].id).not.toBe(tour.id);
  });

  it("substitui a ordem dos passeios sem alterar os dados", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const tours = [
      { id: "tour-1", name: "Museu", location: "Centro", duration: "2 horas", description: "", totalPrice: 100 },
      { id: "tour-2", name: "Vinícola", location: "Vale", duration: "6 horas", description: "", totalPrice: 300 },
    ];
    const reorderedBudget = reorderToursInBudget({ ...defaultBudgetData, tours }, [...tours].reverse());

    expect(reorderedBudget.tours.map((tour) => tour.id)).toEqual(["tour-2", "tour-1"]);
    expect(reorderedBudget.tours[0].name).toBe("Vinícola");
  });

  it("reordena e renumera os dias do roteiro", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const days = [
      { id: "day-1", day: 1, title: "Dia livre", notes: "" },
      { id: "day-2", day: 2, title: "Vinícola", notes: "" },
    ];
    const reorderedBudget = reorderItineraryDaysInBudget({ ...defaultBudgetData, itinerary: days }, [...days].reverse());

    expect(reorderedBudget.itinerary.map((day) => day.id)).toEqual(["day-2", "day-1"]);
    expect(reorderedBudget.itinerary.map((day) => day.day)).toEqual([1, 2]);
  });

  it("cria passeios e dias cronológicos ao importar uma cotação sem duplicar a mesma atividade", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const quotationUrl = "https://exemplo.com/quotations/abc";
    const importedBudget = importQuotationActivitiesIntoBudget(defaultBudgetData, [
      {
        name: "Passeio à vinícola",
        date: "2026-08-30",
        description: "Degustação e visita às vinícolas selecionadas.",
        location: "Vale do Casablanca",
        duration: "6 horas",
        pageUrl: "https://exemplo.com/passeios/vinicola",
        photosUrl: "https://images.exemplo.com/vinicola.jpg",
      },
      { name: "Tour panorâmico", date: "2026-08-29", description: "Centro da cidade" },
      {
        name: "Passeio à vinícola",
        date: "2026-08-30",
        description: "Degustação e visita às vinícolas selecionadas.",
        location: "Vale do Casablanca",
        duration: "6 horas",
        pageUrl: "https://exemplo.com/passeios/vinicola",
        photosUrl: "https://images.exemplo.com/vinicola.jpg",
      },
    ], quotationUrl);

    expect(importedBudget.tours).toHaveLength(2);
    expect(importedBudget.tours.find((tour) => tour.name === "Passeio à vinícola")).toMatchObject({
      location: "Vale do Casablanca",
      duration: "6 horas",
      pageUrl: "https://exemplo.com/passeios/vinicola",
      photosUrl: "https://images.exemplo.com/vinicola.jpg",
    });
    expect(importedBudget.tours.find((tour) => tour.name === "Tour panorâmico")?.pageUrl).toBe(quotationUrl);
    expect(importedBudget.itinerary.map((day) => day.title)).toEqual([
      "29/08/2026 — Tour panorâmico",
      "30/08/2026 — Passeio à vinícola",
    ]);
    expect(importedBudget.itinerary.map((day) => day.day)).toEqual([1, 2]);
    expect(importedBudget.itinerary[0].notes).toBe("Centro da cidade");
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
