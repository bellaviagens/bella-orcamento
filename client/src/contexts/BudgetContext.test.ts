import { describe, expect, it } from "vitest";
import { clearBudgetOnlyInBudget, clearFinalItineraryWithRegisteredDataInBudget, createBudgetClearUndoSnapshot, rehydrateBudgetDraft, reorderFinalItineraryDaysInBudget, restoreLastBudgetFromStorage, updateFareTierInBudget, updateFinalItineraryDayDateInBudget } from "./BudgetContext";
import { defaultBudgetData } from "@shared/budgetTypes";

describe("updateFareTierInBudget", () => {
  it("sincroniza benefícios ao editar uma tarifa existente e preserva opcionais personalizados", () => {
    const budget = {
      ...defaultBudgetData,
      fareComparison: {
        tiers: [{
          id: "tarifa-1",
          name: "Full",
          flightPrice: 1500,
          bagages: ["Bagagem de 10 kg"],
          checkIns: ["Check-in prioritário"],
          benefits: ["Bagagem de 10 kg", "Check-in prioritário", "Acesso à sala VIP"],
        }],
      },
    };

    const updated = updateFareTierInBudget(budget, "tarifa-1", {
      bagages: ["Bagagem de 12 kg"],
    });

    expect(updated.fareComparison.tiers[0].benefits).toEqual([
      "Bagagem de 12 kg",
      "Check-in prioritário",
      "Acesso à sala VIP",
    ]);
  });
});

describe("rehydrateBudgetDraft", () => {
  it("preserva voos e hotéis salvos ao abrir um rascunho", () => {
    const snapshot = {
      ...defaultBudgetData,
      flights: [{
        ...defaultBudgetData.flights[0],
        id: "voo-rascunho",
        operatingAirline: "GOL",
      }],
      hotels: [{
        ...defaultBudgetData.hotels[0],
        id: "hotel-rascunho",
        name: "Hotel salvo no rascunho",
      }],
    };

    const restored = rehydrateBudgetDraft(JSON.parse(JSON.stringify(snapshot)));

    expect(restored.flights).toEqual(snapshot.flights);
    expect(restored.hotels).toEqual(snapshot.hotels);
    expect(restored.flights).not.toBe(snapshot.flights);
    expect(restored.hotels).not.toBe(snapshot.hotels);
  });
});

describe("restoreLastBudgetFromStorage", () => {
  it("recupera o último orçamento persistido com seus hotéis e voos", () => {
    const persistedBudget = {
      ...defaultBudgetData,
      tripInfo: { ...defaultBudgetData.tripInfo, clientName: "Cliente persistido" },
      flights: [{ ...defaultBudgetData.flights[0], id: "voo-local" }],
      hotels: [{ ...defaultBudgetData.hotels[0], id: "hotel-local", name: "Hotel persistido" }],
    };

    const restored = restoreLastBudgetFromStorage(JSON.stringify(persistedBudget));

    expect(restored.tripInfo.clientName).toBe("Cliente persistido");
    expect(restored.flights).toEqual(persistedBudget.flights);
    expect(restored.hotels).toEqual(persistedBudget.hotels);
  });

  it("usa o orçamento padrão quando o conteúdo local estiver inválido", () => {
    expect(restoreLastBudgetFromStorage("{conteúdo inválido")).toEqual(defaultBudgetData);
  });
});

describe("dias do Roteiro Final", () => {
  const budgetWithFinalDays = {
    ...defaultBudgetData,
    finalItinerary: {
      ...defaultBudgetData.finalItinerary,
      events: [
        { id: "dia-1", day: 1, proposalDayDate: "2026-08-30", kind: "tour" as const, title: "Primeiro dia", time: "", description: "", linkUrl: "", addressUrl: "", photoUrl: "", attachments: [] },
        { id: "dia-1b", day: 1, proposalDayDate: "2026-08-30", kind: "custom" as const, title: "Segundo compromisso", time: "", description: "", linkUrl: "", addressUrl: "", photoUrl: "", attachments: [] },
        { id: "dia-2", day: 2, proposalDayDate: "2026-08-31", kind: "tour" as const, title: "Segundo dia", time: "", description: "", linkUrl: "", addressUrl: "", photoUrl: "", attachments: [] },
      ],
    },
  };

  it("aplica a data editada a todos os compromissos do mesmo dia", () => {
    const updated = updateFinalItineraryDayDateInBudget(budgetWithFinalDays, 1, "2026-09-02");

    expect(updated.finalItinerary.events[0].proposalDayDate).toBe("2026-09-02");
    expect(updated.finalItinerary.events[1].proposalDayDate).toBe("2026-09-02");
    expect(updated.finalItinerary.events[2].proposalDayDate).toBe("2026-08-31");
  });

  it("reordena os blocos diários e faz as datas acompanharem a nova posição", () => {
    const updated = reorderFinalItineraryDaysInBudget(budgetWithFinalDays, 2, 1);

    expect(updated.finalItinerary.events.map((event) => [event.title, event.day, event.proposalDayDate])).toEqual([
      ["Segundo dia", 1, "2026-08-30"],
      ["Primeiro dia", 2, "2026-08-31"],
      ["Segundo compromisso", 2, "2026-08-31"],
    ]);
  });
});

describe("limpeza do Roteiro Final", () => {
  it("remove os eventos finais e os passeios da proposta atual sem afetar propostas salvas", () => {
    const budget = {
      ...defaultBudgetData,
      finalItinerary: {
        ...defaultBudgetData.finalItinerary,
        events: [{ id: "evento-atual", day: 1, proposalDayDate: "2026-08-30", kind: "tour" as const, title: "Evento atual", time: "", description: "", linkUrl: "", addressUrl: "", photoUrl: "", attachments: [] }],
      },
      flights: [{ ...defaultBudgetData.flights[0], id: "voo-atual" }],
      hotels: [{ ...defaultBudgetData.hotels[0], id: "hotel-atual" }],
      tours: [{
        id: "passeio-cadastrado",
        name: "Passeio cadastrado",
        location: "Destino",
        duration: "2 horas",
        description: "",
        totalPrice: 0,
      }],
      itinerary: [{
        id: "dia-atual",
        day: 1,
        title: "Dia 1",
        notes: "",
        activities: [{
          id: "passeio-atual",
          kind: "tour" as const,
          title: "Passeio atual",
          time: "",
          description: "",
          linkUrl: "",
          photoUrl: "",
        }],
      }],
    };

    const cleared = clearFinalItineraryWithRegisteredDataInBudget(budget);

    expect(cleared.finalItinerary.events).toEqual([]);
    expect(cleared.flights).toEqual([]);
    expect(cleared.hotels).toEqual([]);
    expect(cleared.tours).toEqual([]);
    expect(cleared.itinerary).toEqual([]);
  });
});

describe("limpeza do orçamento de viagem", () => {
  it("limpa somente as abas de orçamento e preserva passeios e roteiro", () => {
    const budget = {
      ...defaultBudgetData,
      tripInfo: { ...defaultBudgetData.tripInfo, destination: "Lisboa" },
      flights: [{ ...defaultBudgetData.flights[0], id: "voo-do-orcamento" }],
      fareComparison: { tiers: [{ ...defaultBudgetData.fareComparison.tiers[0], id: "tarifa-do-orcamento" }] },
      hotels: [{ ...defaultBudgetData.hotels[0], id: "hotel-do-orcamento" }],
      baggage: [{ type: "Mala extra", weight: "20kg", priceAdvance: 120, priceAirport: 180 }],
      installments: { flight: 8, hotel: 6, observations: "Condição do orçamento" },
      pageBreaks: { flights: true, hotels: true },
      tours: [{
        id: "passeio-preservado",
        name: "Passeio preservado",
        location: "Lisboa",
        duration: "2 horas",
        description: "",
        totalPrice: 200,
      }],
      itinerary: [{ id: "dia-preservado", day: 1, title: "Dia 1", notes: "", activities: [] }],
      tourProposal: { ...defaultBudgetData.tourProposal, title: "Proposta preservada" },
      finalItinerary: {
        ...defaultBudgetData.finalItinerary,
        events: [{ id: "evento-preservado", day: 1, proposalDayDate: "2026-08-30", kind: "tour" as const, title: "Evento preservado", time: "", description: "", linkUrl: "", addressUrl: "", photoUrl: "", attachments: [] }],
      },
    };

    const cleared = clearBudgetOnlyInBudget(budget);

    expect(cleared.tripInfo).toEqual({ destination: "", period: "", passengers: "", airline: "", introText: "" });
    expect(cleared.flights).toEqual([]);
    expect(cleared.fareComparison.tiers).toEqual([]);
    expect(cleared.hotels).toEqual([]);
    expect(cleared.baggage).toEqual([]);
    expect(cleared.installments).toEqual({});
    expect(cleared.pageBreaks).toBeUndefined();
    expect(cleared.tours).toEqual(budget.tours);
    expect(cleared.itinerary).toEqual(budget.itinerary);
    expect(cleared.tourProposal).toEqual(budget.tourProposal);
    expect(cleared.finalItinerary).toEqual(budget.finalItinerary);
  });

  it("mantém uma cópia independente para desfazer a limpeza recém-confirmada", () => {
    const budget = {
      ...defaultBudgetData,
      tripInfo: { ...defaultBudgetData.tripInfo, destination: "Lisboa" },
      flights: [{ ...defaultBudgetData.flights[0], id: "voo-para-restaurar" }],
    };

    const snapshot = createBudgetClearUndoSnapshot(budget);
    const cleared = clearBudgetOnlyInBudget(budget);

    expect(snapshot).toEqual(budget);
    expect(snapshot).not.toBe(budget);
    expect(snapshot.tripInfo).not.toBe(budget.tripInfo);
    expect(snapshot.flights).not.toBe(budget.flights);
    expect(cleared.flights).toEqual([]);
    expect(snapshot.flights).toHaveLength(1);
  });
});
