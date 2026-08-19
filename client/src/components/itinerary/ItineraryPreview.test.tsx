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

  it("inclui o hotel escolhido e a previsão de chegada na proposta de passeios", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago", period: "10/09 a 17/09" },
      flights: [{
        id: "flight-outbound",
        type: "ida",
        segments: [{ departureAirport: "GRU", departureTime: "09:00", arrivalAirport: "SCL", arrivalCity: "Santiago", arrivalTime: "13:30" }],
      }],
      hotels: [{ id: "hotel-selected", name: "Hotel Lastarria", address: "Calle Lastarria 50, Santiago", description: "Hospedagem no bairro Lastarria", photoUrl: "https://example.com/hotel.jpg", hotelUrl: "https://example.com/hotel" }],
      tours: [],
      itinerary: [],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "", includedHotelId: "hotel-selected", hotelArrivalTime: "15:00" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Chegada e hospedagem");
    expect(markup).toContain("Chegada do voo:");
    expect(markup).toContain("13:30 — Santiago");
    expect(markup).toContain("Previsão de chegada ao hotel:");
    expect(markup).toContain("15:00");
    expect(markup).toContain("Hotel Lastarria");
    expect(markup).toContain("Calle Lastarria 50, Santiago");
    expect(markup).toContain('data-pdf-link="https://example.com/hotel"');
  });

  it("inclui transfer e horários de check-in e check-out da hospedagem", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      hotels: [{ id: "hotel-selected", name: "Hotel Lastarria", address: "Calle Lastarria 50", description: "", photoUrl: "" }],
      tours: [],
      itinerary: [],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "", includedHotelId: "hotel-selected", airportHotelTransfer: "Transfer privativo", airportHotelTransferTime: "15:30", airportHotelTransferDriverContact: "João • (11) 99999-9999", hotelCheckInTime: "15:00", hotelCheckOutTime: "11:00" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Transfer aeroporto → hotel:");
    expect(markup).toContain("Transfer privativo");
    expect(markup).toContain("Motorista / WhatsApp:");
    expect(markup).toContain("João • (11) 99999-9999");
    expect(markup).toContain("Check-in 15:00");
    expect(markup).toContain("Check-out 11:00");
  });

  it("compacta a foto do passeio ao lado dos detalhes para aproveitar melhor a página", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      tours: [{ id: "tour-side-photo", name: "Passeio com foto", description: "DESCRIÇÃO\n- Texto do passeio", photosUrl: "https://example.com/passeio.jpg", pricingMode: "perPerson", pricePerPerson: 0 }],
      itinerary: [{ id: "day-compact", day: 1, title: "Passeios", activities: [{ id: "activity-side-photo", kind: "tour", tourId: "tour-side-photo", title: "Passeio com foto" }] }],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("sm:grid-cols-[138px_minmax(0,1fr)]");
    expect(markup).toContain("flex h-28 w-full items-center justify-center");
    expect(markup).toContain("flex min-w-0 flex-col items-center gap-1.5 text-center");
    expect(markup).toContain('data-pdf-day-label="Dia 1"');
  });

  it("posiciona os acessos do restaurante abaixo da foto, mantendo endereço e site separados", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      tours: [],
      itinerary: [{ id: "day-meal", day: 1, title: "Gastronomia", activities: [{ id: "meal-1", kind: "meal", title: "Restaurante Exemplo", photoUrl: "https://example.com/foto.jpg", addressUrl: "https://maps.example/restaurante", linkUrl: "https://restaurante.example" }] }],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "" },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Ver endereço");
    expect(markup).toContain("Site / fotos");
    expect(markup).toContain('data-pdf-link="https://maps.example/restaurante"');
    expect(markup).toContain('data-pdf-link="https://restaurante.example"');
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
    expect(coverMarkup.match(/bg-\[#f3f7fb\]/g)).toHaveLength(2);
    expect(coverMarkup.match(/bg-\[#1a2e4a\]/g)).toHaveLength(2);
    expect(coverMarkup).not.toContain("bg-[#fff9eb]");
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

  it("mostra entrada, saldo parcelado e a forma de pagamento selecionada", () => {
    const data = {
      tripInfo: { passengers: "2", destination: "Santiago" },
      tours: [{ id: "tour-payment", name: "City tour", pricingMode: "total", totalPrice: 1200, pricePerPerson: 0 }],
      itinerary: [{ id: "day-payment", day: 1, title: "Passeios", activities: [{ id: "activity-payment", kind: "tour", tourId: "tour-payment", title: "City tour" }] }],
      tourProposal: { title: "Proposta de passeios", introMessage: "", paymentDetails: "Vencimento combinado", paymentMethod: "pix", hasEntry: true, entryAmount: 200, installments: 2 },
    } as unknown as BudgetData;

    const markup = renderToStaticMarkup(<ItineraryPreview data={data} />);

    expect(markup).toContain("Entrada: R$ 200,00");
    expect(markup).toContain("2x de R$ 500,00");
    expect(markup).toContain("PIX");
    expect(markup).toContain("Vencimento combinado");
  });
});
