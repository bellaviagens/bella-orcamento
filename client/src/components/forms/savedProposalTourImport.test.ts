import { describe, expect, it } from "vitest";
import type { BudgetData, FinalItineraryEvent } from "@shared/budgetTypes";
import { savedProposalTourEvents } from "./savedProposalTourImport";

const sourceBudget: Pick<BudgetData, "tours" | "itinerary"> = {
  tours: [{
    id: "tour-valle-nevado",
    name: "Vale Nevado",
    location: "Santiago",
    duration: "Dia inteiro",
    description: "Passeio panorâmico pela cordilheira.",
    totalPrice: 350,
    notes: "Levar casaco.",
    pageUrl: "https://exemplo.com/passeio",
    photosUrl: "https://exemplo.com/foto.jpg",
  }],
  itinerary: [{
    id: "day-3",
    day: 3,
    title: "Cordilheira",
    notes: "",
    activities: [{
      id: "activity-1",
      kind: "tour",
      title: "Vale Nevado",
      time: "07:30",
      description: "Saída do hotel.",
      linkUrl: "",
      addressUrl: "https://maps.example.com/vale",
      photoUrl: "https://exemplo.com/atividade.jpg",
      ticketUrl: "https://exemplo.com/ingresso",
      importantNotes: "Documento obrigatório.",
      tourId: "tour-valle-nevado",
    }],
  }],
};

describe("savedProposalTourEvents", () => {
  it("preserva dia, horário, links, foto e informações da proposta escolhida", () => {
    const [event] = savedProposalTourEvents(sourceBudget, "proposal-123", []);

    expect(event).toMatchObject({
      day: 3,
      time: "07:30",
      title: "Vale Nevado",
      linkUrl: "https://exemplo.com/passeio",
      addressUrl: "https://maps.example.com/vale",
      photoUrl: "https://exemplo.com/atividade.jpg",
      sourceTourId: "saved-proposal:proposal-123:tour-valle-nevado",
    });
    expect(event.description).toContain("Saída do hotel.");
    expect(event.description).toContain("Ingresso: https://exemplo.com/ingresso");
  });

  it("não duplica uma proposta que já foi importada para o mesmo roteiro", () => {
    const existingEvents = [{
      id: "event-1",
      day: 3,
      kind: "tour" as const,
      title: "Vale Nevado",
      time: "07:30",
      description: "",
      linkUrl: "",
      photoUrl: "",
      sourceTourId: "saved-proposal:proposal-123:tour-valle-nevado",
    }] satisfies FinalItineraryEvent[];

    expect(savedProposalTourEvents(sourceBudget, "proposal-123", existingEvents)).toEqual([]);
    expect(savedProposalTourEvents(sourceBudget, "proposal-456", existingEvents)).toHaveLength(1);
  });
});
