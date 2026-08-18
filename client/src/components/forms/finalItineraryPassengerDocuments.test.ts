import { describe, expect, it } from "vitest";
import type { FinalItineraryEvent } from "@shared/budgetTypes";
import { passengerFlightDocuments } from "./FinalItineraryForm";

describe("passengerFlightDocuments", () => {
  it("mantém junto ao passageiro apenas os documentos dos voos a ele vinculados", () => {
    const events: FinalItineraryEvent[] = [
      { id: "flight-1", kind: "flight", day: 1, title: "Ida", time: "10:00", attachments: [
        { id: "doc-anderson", name: "Bilhete Anderson.pdf", url: "https://example.com/anderson.pdf", passengerId: "p-anderson", passengerName: "Anderson" },
        { id: "doc-maria", name: "Cartão Maria.pdf", url: "https://example.com/maria.pdf", passengerId: "p-maria", passengerName: "Maria" },
      ] },
      { id: "hotel-1", kind: "hotel", day: 1, title: "Hotel", time: "14:00", attachments: [
        { id: "hotel-doc", name: "Reserva.pdf", url: "https://example.com/hotel.pdf", passengerId: "p-anderson" },
      ] },
    ];

    expect(passengerFlightDocuments(events, "p-anderson", "Anderson").map(({ attachment }) => attachment.id)).toEqual(["doc-anderson"]);
    expect(passengerFlightDocuments(events, "p-maria", "Maria").map(({ attachment }) => attachment.id)).toEqual(["doc-maria"]);
  });
});
