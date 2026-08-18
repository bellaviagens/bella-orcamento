import { describe, expect, it } from "vitest";
import type { FinalItineraryEvent } from "@shared/budgetTypes";
import { initialCollapsedSections, passengerFlightDocuments, toggleCollapsedSection } from "./FinalItineraryForm";

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

describe("toggleCollapsedSection", () => {
  it("alterna apenas a seção solicitada sem mutar o estado anterior", () => {
    const initial = new Set(["cover", "event-1"]);
    const openedCover = toggleCollapsedSection(initial, "cover");
    const collapsedShare = toggleCollapsedSection(openedCover, "share");
    const collapsedUsefulLinks = toggleCollapsedSection(collapsedShare, "useful-links");

    expect(initial).toEqual(new Set(["cover", "event-1"]));
    expect(openedCover).toEqual(new Set(["event-1"]));
    expect(collapsedShare).toEqual(new Set(["event-1", "share"]));
    expect(collapsedUsefulLinks).toEqual(new Set(["event-1", "share", "useful-links"]));
  });
});

describe("initialCollapsedSections", () => {
  it("inicia as seções gerais, os dias e os compromissos recolhidos", () => {
    const sections = initialCollapsedSections([
      { id: "flight-1", kind: "flight", day: 1, title: "Ida", time: "10:00" },
      { id: "tour-1", kind: "tour", day: 2, title: "Passeio", time: "14:00" },
    ]);

    expect(sections).toEqual(new Set([
      "cover",
      "share",
      "useful-links",
      "day-1",
      "event-flight-1",
      "day-2",
      "event-tour-1",
    ]));
  });
});
