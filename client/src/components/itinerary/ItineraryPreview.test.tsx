import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BudgetData } from "@shared/budgetTypes";

import { ItineraryPreview } from "./ItineraryPreview";

describe("ItineraryPreview — agenda de dia extenso", () => {
  it("insere separadores discretos quando o mesmo dia possui três compromissos", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      tours: [],
      itinerary: [{
        id: "day-1",
        day: 1,
        title: "Chegada e experiências",
        activities: [
          { id: "activity-1", title: "Chegada", time: "13:30" },
          { id: "activity-2", title: "Passeio panorâmico", time: "15:30" },
          { id: "activity-3", title: "Jantar", time: "20:00" },
        ],
      }],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Agenda do dia");
    expect(markup).toContain("3 compromissos");
    expect(markup.match(/Próximo compromisso/g)).toHaveLength(2);
  });

  it("usa tarja institucional e identifica detalhes de voo sem tratá-los como passeio", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago", period: "10/09 a 17/09" },
      tours: [],
      itinerary: [{
        id: "day-flight",
        day: 1,
        title: "Chegada",
        activities: [{
          id: "flight-activity",
          kind: "flight",
          title: "Voo de ida",
          time: "10:05",
          description: "LATAM Airlines • Florianópolis • Santiago do Chile",
        }],
      }],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Bella Viagens e Milhas");
    expect(markup).toContain("Acumule. Viaje. Viva.");
    expect(markup).toContain("Detalhes do voo");
    expect(markup).not.toContain("Detalhes do passeio");
  });

  it("mostra resumo de capa e horário de chegada do voo, sem exibir duração importada em dias", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago", period: "10/09 a 17/09" },
      flights: [{
        id: "flight-outbound",
        type: "ida",
        segments: [{ departureAirport: "GRU", departureTime: "09:00", arrivalAirport: "SCL", arrivalCity: "Santiago", arrivalTime: "13:30" }],
      }],
      tours: [{ id: "tour-1", name: "City tour", duration: "2 dias", description: "", totalPrice: 0, pricingMode: "perPerson", pricePerPerson: 0, travelerCount: 2, notes: "", pageUrl: "", photosUrl: "" }],
      itinerary: [{
        id: "day-flight",
        day: 1,
        date: "2026-09-10",
        title: "Chegada",
        activities: [
          { id: "flight-activity", kind: "flight", flightId: "flight-outbound", title: "Voo de ida", time: "09:00" },
          { id: "tour-activity", kind: "tour", tourId: "tour-1", title: "City tour", time: "15:00" },
        ],
      }],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Resumo da proposta");
    expect(markup).toContain("Chegada ao destino: 13:30 — Santiago");
    expect(markup).not.toContain("Duração: 2 dias");
  });

  it("mantém todas as atividades e gastronomia no respectivo dia do resumo, com ícones por tipo", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      tours: [],
      itinerary: [
        {
          id: "day-1",
          day: 1,
          date: "2026-08-26",
          title: "Chegada",
          activities: [
            { id: "flight-1", kind: "flight", title: "Voo de ida", time: "10:05" },
            { id: "meal-1", kind: "meal", title: "Almoço no Costanera", time: "13:00" },
            { id: "tour-1", kind: "tour", title: "Passeio panorâmico", time: "15:00" },
          ],
        },
        {
          id: "day-2",
          day: 2,
          date: "2026-08-27",
          title: "Passeios",
          activities: [{ id: "tour-2", kind: "tour", title: "Centro histórico", time: "09:00" }],
        },
      ],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);
    const coverMarkup = markup.slice(markup.indexOf("Resumo da proposta"), markup.indexOf('data-proposal-day'));

    expect(coverMarkup).toContain("Almoço no Costanera");
    expect(coverMarkup).toContain("Passeio panorâmico");
    expect(coverMarkup).toContain("Centro histórico");
    expect(coverMarkup.match(/Dia 1 •/g)).toHaveLength(1);
    expect(coverMarkup).toContain("lucide-plane-takeoff");
    expect(coverMarkup).toContain("lucide-utensils");
    expect(coverMarkup).toContain("lucide-sparkles");
    expect(coverMarkup).toContain("border-l-4");
    expect(coverMarkup).toContain("bg-[#f3f7fb]");
    expect(coverMarkup).toContain("bg-[#fff9eb]");
  });

  it("permite selecionar os dias e o tamanho de fonte exibidos no resumo de capa", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      tours: [],
      itinerary: [
        { id: "day-hidden", day: 1, date: "2026-08-26", activities: [{ id: "activity-hidden", kind: "tour", title: "Não aparece na capa", time: "10:00" }] },
        { id: "day-visible", day: 2, date: "2026-08-27", activities: [{ id: "activity-visible", kind: "tour", title: "Aparece no resumo", time: "11:00" }] },
      ],
      tourProposal: {
        title: "Proposta de passeios",
        introMessage: "",
        paymentDetails: "",
        coverSummaryDayIds: ["day-visible"],
        coverSummaryFontSize: "large",
      },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);
    const coverMarkup = markup.slice(markup.indexOf("Resumo da proposta"), markup.indexOf('data-proposal-day'));

    expect(coverMarkup).toContain("Aparece no resumo");
    expect(coverMarkup).not.toContain("Não aparece na capa");
    expect(markup).toContain('data-cover-summary-font="large"');
  });
});
