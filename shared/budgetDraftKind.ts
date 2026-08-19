export type BudgetDraftKind = "complete-budget" | "final-itinerary";

type BudgetDraftSnapshot = {
  finalItinerary?: {
    enabled?: boolean;
    events?: unknown[];
  };
};

/** Identifica se um snapshot de orçamento já possui conteúdo de Roteiro Final. */
export function getBudgetDraftKind(snapshot: string): BudgetDraftKind {
  try {
    const data = JSON.parse(snapshot) as BudgetDraftSnapshot;
    const finalItinerary = data.finalItinerary;
    const hasFinalItineraryEvents = Array.isArray(finalItinerary?.events) && finalItinerary.events.length > 0;

    return finalItinerary?.enabled === true || hasFinalItineraryEvents
      ? "final-itinerary"
      : "complete-budget";
  } catch {
    return "complete-budget";
  }
}
