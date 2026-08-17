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

  it("exibe imagem e resumo diário na capa detalhada", () => {
    const data = {
      tripInfo: { destination: "Santiago", period: "10/09/2026 a 17/09/2026", passengers: "2 viajantes" },
      finalItinerary: {
        title: "Roteiro Santiago",
        introMessage: "",
        coverMode: "detailed",
        coverImageUrl: "https://example.com/santiago.jpg",
        passengers: [],
        usefulLinks: [],
        events: [{ id: "event-1", day: 1, time: "09:00", kind: "tour", title: "Tour panorâmico", description: "", linkUrl: "" }],
      },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<FinalItineraryPreview data={data} />);

    expect(markup).toContain("Resumo diário");
    expect(markup).toContain("Tour panorâmico");
    expect(markup).toContain("https://example.com/santiago.jpg");
  });

  it("organiza o resumo por horário e tipo, mostra o localizador e preserva cada dia como bloco de PDF", () => {
    const data = {
      tripInfo: { destination: "Santiago", period: "10/09/2026 a 17/09/2026", passengers: "2 viajantes" },
      finalItinerary: {
        title: "Roteiro Santiago",
        introMessage: "",
        passengers: [{ id: "passenger-1", name: "Ana" }],
        usefulLinks: [],
        events: [
          {
            id: "flight-1",
            day: 1,
            time: "14:00",
            kind: "flight",
            title: "Chegada em Santiago",
            description: "",
            linkUrl: "",
            flightAirline: "LATAM",
            flightNumber: "LA 700",
            flightLocator: "ABC123",
            flightDate: "2026-09-10",
            attachments: [{ id: "boarding-pass", name: "Cartão Ana", url: "https://example.com/cartao.pdf", size: 1024, passengerId: "passenger-1" }],
          },
          { id: "hotel-1", day: 1, time: "15:00", kind: "hotel", title: "Hospedagem Hotel Bella", description: "", linkUrl: "" },
          { id: "tour-1", day: 1, time: "16:00", kind: "tour", title: "Passeio panorâmico", description: "", linkUrl: "" },
        ],
      },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<FinalItineraryPreview data={data} />);

    expect(markup).toContain("14:00");
    expect(markup).toContain("Voo de ida");
    expect(markup).toContain("Hospedagem");
    expect(markup).toContain("Localizador");
    expect(markup).toContain("ABC123");
    expect(markup).toContain("Cartões de embarque e documentos deste voo");
    expect(markup).toContain("Abrir cartão de embarque: Cartão Ana");
    expect(markup).toContain("data-pdf-keep-together=\"true\"");
    expect(markup).toContain("break-inside:avoid");
  });
});
