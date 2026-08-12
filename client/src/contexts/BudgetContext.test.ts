import { describe, expect, it } from "vitest";
import { updateFareTierInBudget } from "./BudgetContext";
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
