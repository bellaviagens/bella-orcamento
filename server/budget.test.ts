import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { calculateCombinedInstallmentValue, calculateCombinedTotal, calculateEffectiveHotelTotal } from "../shared/paymentCalculations";
import { calculateCombinedPaymentPlan } from "../shared/combinedPaymentPlan";
import { calculateTourProposalInstallment, calculateTourTotal, getTourTravelerCount } from "../shared/tourPricing";
import { addFinalItineraryEventToBudget, addFlightToFinalItineraryInBudget, addHotelToFinalItineraryInBudget, duplicateHotelInBudget, duplicateTourInBudget, importQuotationActivitiesIntoBudget, reorderHotelsInBudget, reorderItineraryDaysInBudget, reorderToursInBudget, resetTourProposalInBudget } from "../client/src/contexts/BudgetContext";

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

  it("has itineraryAttachments.upload procedure", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.itineraryAttachments.upload).toBeDefined();
  });

  it("has shared itinerary and weather procedures", () => {
    const caller = appRouter.createCaller(createMockContext());
    expect(caller.sharedItineraries.create).toBeDefined();
    expect(caller.sharedItineraries.get).toBeDefined();
    expect(caller.weather.get).toBeDefined();
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

  it("soma os valores de adultos e crianças quando o passeio possui preços distintos", () => {
    const tour = {
      pricingMode: "perPerson" as const,
      pricePerPerson: 275,
      travelerCount: 2,
      childPrice: 150,
      childCount: 2,
      totalPrice: 0,
    };

    expect(calculateTourTotal(tour)).toBe(850);
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

  it("calcula o valor de cada parcela da proposta sem alterar o total dos passeios", () => {
    expect(calculateTourProposalInstallment(960, 3)).toEqual({ count: 3, value: 320 });
    expect(calculateTourProposalInstallment(960, 1)).toEqual({ count: 1, value: 960 });
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

  it("inicia uma nova proposta sem apagar o roteiro final já montado", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const budget = {
      ...defaultBudgetData,
      tours: [{ id: "tour-1", name: "Museu", location: "Centro", duration: "2 horas", description: "", totalPrice: 100 }],
      itinerary: [{ id: "day-1", day: 1, title: "Museu", notes: "", tourId: "tour-1" }],
      tourProposal: { title: "Proposta de Ana", introMessage: "Olá", paymentDetails: "PIX", clientName: "Ana", installments: 3 },
      finalItinerary: { ...defaultBudgetData.finalItinerary, title: "Roteiro aprovado", events: [{ id: "event-1", day: 1, kind: "hotel" as const, title: "Hotel", time: "", description: "", linkUrl: "", photoUrl: "" }] },
    };
    const resetBudget = resetTourProposalInBudget(budget);

    expect(resetBudget.tours).toEqual([]);
    expect(resetBudget.itinerary).toEqual([]);
    expect(resetBudget.tourProposal).toMatchObject({ title: "Proposta de passeios", introMessage: "", paymentDetails: "", installments: 1 });
    expect(resetBudget.finalItinerary).toEqual(budget.finalItinerary);
  });

  it("leva endereço, GPS e detalhes disponíveis ao reutilizar hotel e voo no roteiro final", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const withHotel = addHotelToFinalItineraryInBudget(defaultBudgetData, defaultBudgetData.hotels[0].id);
    const hotelEvent = withHotel.finalItinerary.events[0];
    const withFlight = addFlightToFinalItineraryInBudget(defaultBudgetData, defaultBudgetData.flights[0].id);
    const flightEvent = withFlight.finalItinerary.events[0];

    expect(hotelEvent).toMatchObject({ hotelAddress: defaultBudgetData.hotels[0].address });
    expect(hotelEvent.hotelMapUrl).toContain("google.com/maps/search");
    expect(flightEvent).toMatchObject({
      flightAirline: defaultBudgetData.flights[0].segments[0].airline,
      flightNumber: defaultBudgetData.flights[0].segments[0].flightNumber,
      flightDepartureAirport: defaultBudgetData.flights[0].segments[0].departureAirport,
    });
  });

  it("mantém anexos no evento do Roteiro Final e inicia eventos novos sem arquivos", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const attachment = { id: "file-1", name: "cartao.pdf", url: "/manus-storage/cartao.pdf", contentType: "application/pdf", size: 1024, passengerId: "passenger-1" };
    const withAttachment = addFinalItineraryEventToBudget(defaultBudgetData, { kind: "flight", attachments: [attachment] });
    const emptyEvent = addFinalItineraryEventToBudget(defaultBudgetData, { kind: "hotel" }).finalItinerary.events[0];

    expect(withAttachment.finalItinerary.events[0].attachments).toEqual([attachment]);
    expect(emptyEvent.attachments).toEqual([]);
  });

  it("mantém os dados de capa e os passageiros no Roteiro Final", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const finalItinerary = {
      ...defaultBudgetData.finalItinerary,
      essentialInfo: "Levar o passaporte e chegar com antecedência.",
      emergencyContacts: "Agência: +55 11 99999-9999",
      passengers: [{ id: "passenger-1", name: "Ana Souza" }],
    };
    const budget = { ...defaultBudgetData, finalItinerary };
    const withAttachment = addFinalItineraryEventToBudget(budget, {
      kind: "hotel",
      attachments: [{ id: "hotel-1", name: "reserva.pdf", url: "/manus-storage/reserva.pdf", contentType: "application/pdf", size: 2048, passengerId: "passenger-1" }],
    });

    expect(withAttachment.finalItinerary).toMatchObject({
      essentialInfo: "Levar o passaporte e chegar com antecedência.",
      emergencyContacts: "Agência: +55 11 99999-9999",
      passengers: [{ id: "passenger-1", name: "Ana Souza" }],
    });
    expect(withAttachment.finalItinerary.events[0].attachments?.[0].passengerId).toBe("passenger-1");
  });

  it("mantém o checklist de bagagem individual de cada passageiro", async () => {
    const { defaultBudgetData } = await import("../shared/budgetTypes");
    const baggageChecklist = [
      { id: "bag-1", label: "Passaporte", packed: true },
      { id: "bag-2", label: "Adaptador de tomada", packed: false },
    ];
    const budget = {
      ...defaultBudgetData,
      finalItinerary: {
        ...defaultBudgetData.finalItinerary,
        shareToken: "a".repeat(32),
        passengers: [{ id: "passenger-1", name: "Ana Souza", baggageChecklist }],
      },
    };
    const withEvent = addFinalItineraryEventToBudget(budget, { kind: "flight" });

    expect(withEvent.finalItinerary.shareToken).toHaveLength(32);
    expect(withEvent.finalItinerary.passengers?.[0].baggageChecklist).toEqual(baggageChecklist);
    expect(withEvent.finalItinerary.passengers?.[0].baggageChecklist?.filter((item) => item.packed)).toHaveLength(1);
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

  it("soma formas internas em cada condição de pagamento combinado", () => {
    const plan = calculateCombinedPaymentPlan(10000, [
      {
        id: "condition-1",
        steps: [
          { id: "card", paymentMethod: "cartao", amount: 4000, installments: 10 },
          { id: "pix-now", paymentMethod: "pix", amount: 1000, installments: 1 },
          { id: "pix-later", paymentMethod: "pix", amount: 3000, installments: 3 },
        ],
      },
      {
        id: "condition-2",
        steps: [{ id: "card-rate", paymentMethod: "cartao", amount: 10000, installments: 10, cardRate: 10 }],
      },
    ]);

    expect(plan[0].steps.map((step) => step.installmentValue)).toEqual([400, 1000, 1000]);
    expect(plan[0].total).toBe(8000);
    expect(plan[1].total).toBe(11000);
  });

  it("mantém uma condição acima do total de referência como alternativa independente", () => {
    const plan = calculateCombinedPaymentPlan(3000, [
      { id: "condition", steps: [{ id: "pix", paymentMethod: "pix", amount: 5000, installments: 1 }] },
    ]);

    expect(plan[0]).toMatchObject({ total: 5000 });
    expect(plan[0].steps[0]).toMatchObject({ installmentValue: 5000 });
  });

  it("aplica taxa somente ao cartão dentro de uma condição", () => {
    const plan = calculateCombinedPaymentPlan(10000, [
      {
        id: "condition",
        steps: [
          { id: "card", paymentMethod: "cartao", amount: 4000, installments: 10, cardRate: 5 },
          { id: "pix", paymentMethod: "pix", amount: 4000, installments: 10, cardRate: 5 },
        ],
      },
    ]);

    expect(plan[0].steps[0]).toMatchObject({ totalWithRate: 4200, installmentValue: 420, cardRate: 5 });
    expect(plan[0].steps[1]).toMatchObject({ totalWithRate: 4000, installmentValue: 400, cardRate: 0 });
    expect(plan[0].total).toBe(8200);
  });
});
