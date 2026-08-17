import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BudgetData } from "@shared/budgetTypes";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    weather: {
      get: {
        useQuery: () => ({ data: { days: [] }, isLoading: false, error: null }),
      },
    },
  },
}));

import { FinalItineraryPreview } from "./FinalItineraryPreview";

describe("FinalItineraryPreview — capa institucional", () => {
  it("usa cabeçalho azul da Bella Viagens e exibe o resumo da viagem na capa", () => {
    const data = {
      tripInfo: { destination: "Santiago", period: "10/09/2026 a 17/09/2026", passengers: "2 viajantes" },
      finalItinerary: {
        title: "Roteiro Santiago",
        introMessage: "Uma viagem especial para aproveitar cada momento.",
        passengers: [{ id: "passenger-1", name: "Ana" }],
        events: [],
        usefulLinks: [],
      },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<FinalItineraryPreview data={data} />);

    expect(markup).toContain("Bella Viagens e Milhas");
    expect(markup).toContain("Roteiro Final");
    expect(markup).toContain("Acumule. Viaje. Viva.");
    expect(markup).toContain("bg-[#1a2e4a]");
    expect(markup).toContain("Santiago");
  });
});

