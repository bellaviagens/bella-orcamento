import { describe, expect, it } from "vitest";
import { getBudgetDraftKind } from "./budgetDraftKind";

describe("getBudgetDraftKind", () => {
  it("classifica um orçamento sem roteiro final como orçamento completo", () => {
    expect(getBudgetDraftKind(JSON.stringify({ tripInfo: { destination: "Santiago" } }))).toBe("complete-budget");
  });

  it("classifica um orçamento com roteiro final ativado como roteiro final", () => {
    expect(getBudgetDraftKind(JSON.stringify({ finalItinerary: { enabled: true, events: [] } }))).toBe("final-itinerary");
  });

  it("classifica um orçamento com eventos do roteiro final mesmo quando a versão antiga não tiver enabled", () => {
    expect(getBudgetDraftKind(JSON.stringify({ finalItinerary: { events: [{ id: "evento-1" }] } }))).toBe("final-itinerary");
  });

  it("mantém snapshots inválidos na lista de orçamento completo para que continuem recuperáveis", () => {
    expect(getBudgetDraftKind("{invalido")).toBe("complete-budget");
  });
});
