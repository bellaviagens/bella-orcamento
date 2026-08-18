import { describe, expect, it } from "vitest";
import { rehydrateBudgetDraft, restoreLastBudgetFromStorage, updateFareTierInBudget } from "./BudgetContext";
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
