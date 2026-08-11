import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { defaultBudgetData } from "@shared/budgetTypes";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    imageProxy: {
      useQuery: () => ({ data: undefined }),
    },
  },
}));

import { PdfPreview } from "./PdfPreview";

describe("PdfPreview — parcelamento conjunto", () => {
  it("exibe a soma de uma tarifa e um hotel dividida pelas parcelas configuradas no aéreo", () => {
    const data = {
      ...defaultBudgetData,
      fareComparison: {
        tiers: [{ id: "fare-1", name: "Básica", flightPrice: 1000, benefits: [] }],
      },
      hotels: [{ ...defaultBudgetData.hotels[0], id: "hotel-1", totalPrice: 3000, prices: {} }],
      installments: { ...defaultBudgetData.installments, combined: true, flight: 10 },
    };

    const markup = renderToStaticMarkup(<PdfPreview data={data} />);

    expect(markup).toContain("Aéreo + Hotel");
    expect(markup).toContain("10x de R$ 500,00");
  });
});
