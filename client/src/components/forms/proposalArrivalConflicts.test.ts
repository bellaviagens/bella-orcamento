import { describe, expect, it } from "vitest";
import { getProposalArrivalConflicts } from "./proposalArrivalConflicts";

describe("getProposalArrivalConflicts", () => {
  it("destaca somente passeios do dia de chegada iniciados antes do hotel", () => {
    const conflicts = getProposalArrivalConflicts([
      {
        id: "day-arrival",
        day: 1,
        title: "Chegada",
        date: "2026-09-10",
        activities: [
          { id: "tour-before", kind: "tour", title: "City tour", time: "14:00" },
          { id: "tour-after", kind: "tour", title: "Jantar", time: "18:00" },
        ],
      },
      {
        id: "day-next",
        day: 2,
        title: "Dia seguinte",
        date: "2026-09-11",
        activities: [{ id: "tour-next", kind: "tour", title: "Vinícola", time: "09:00" }],
      },
    ], "2026-09-10", "15:30");

    expect(conflicts).toEqual([{
      dayId: "day-arrival",
      dayNumber: 1,
      activityId: "tour-before",
      activityTitle: "City tour",
      activityTime: "14:00",
    }]);
  });

  it("não cria alerta sem data ou horário de chegada válido", () => {
    const itinerary = [{ id: "day", day: 1, title: "Dia", date: "2026-09-10", activities: [{ id: "tour", kind: "tour", title: "Passeio", time: "14:00" }] }];
    expect(getProposalArrivalConflicts(itinerary, undefined, "15:00")).toEqual([]);
    expect(getProposalArrivalConflicts(itinerary, "2026-09-10", "a confirmar")).toEqual([]);
  });
});
