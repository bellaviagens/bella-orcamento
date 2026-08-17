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
});
