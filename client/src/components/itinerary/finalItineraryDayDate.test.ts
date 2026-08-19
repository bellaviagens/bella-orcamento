import { describe, expect, it } from "vitest";
import { formatFinalItineraryDayDate, getFinalItineraryDayDate } from "./finalItineraryDayDate";
import type { FinalItineraryEvent } from "@shared/budgetTypes";

function event(overrides: Partial<FinalItineraryEvent>): FinalItineraryEvent {
  return {
    id: "event-1",
    day: 1,
    kind: "tour",
    title: "Passeio",
    time: "",
    description: "",
    linkUrl: "",
    photoUrl: "",
    ...overrides,
  };
}

describe("datas dos dias do Roteiro Final", () => {
  it("prioriza a data que veio da Proposta de Passeios", () => {
    expect(getFinalItineraryDayDate([
      event({ proposalDayDate: "2026-08-30", flightDate: "2026-08-29" }),
    ])).toBe("2026-08-30");
  });

  it("mantém as datas de voo e hospedagem como alternativa para roteiros antigos", () => {
    expect(getFinalItineraryDayDate([
      event({ hotelCheckIn: "2026-08-31" }),
    ])).toBe("2026-08-31");
  });

  it("exibe dia da semana e data completa no padrão brasileiro", () => {
    expect(formatFinalItineraryDayDate("2026-08-30")).toBe("Domingo 30/08/2026");
  });
});
