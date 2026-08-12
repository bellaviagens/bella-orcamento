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

  it("exibe a observação de parcelamento mesmo quando há hospedagem", () => {
    const data = {
      ...defaultBudgetData,
      installments: { ...defaultBudgetData.installments, observations: "20% de entrada e saldo conforme combinado." },
    };

    const markup = renderToStaticMarkup(<PdfPreview data={data} />);

    expect(markup).toContain("20% de entrada e saldo conforme combinado.");
  });

  it("mantém pagamento e métodos dentro de cada tarifa quando há somente aéreo", () => {
    const data = {
      ...defaultBudgetData,
      fareComparison: {
        tiers: [{ id: "fare-1", name: "Premium", flightPrice: 1000, benefits: ["Bagagem de 10kg", "Seleção de Assento"] }],
      },
      hotels: [],
      installments: { ...defaultBudgetData.installments, flight: 10, paymentMethods: ["dinheiro", "cartao", "pix"] },
    };

    const markup = renderToStaticMarkup(<PdfPreview data={data} includeAirfare includeHotel={false} />);

    expect(markup).toContain("Forma de Pagamento");
    expect(markup).toContain("Dinheiro");
    expect(markup).toContain("Cartão");
    expect(markup).toContain("PIX");
    expect(markup).not.toContain("Formas de Pagamento");
    expect(markup).toContain('flex:0 0 100px');
    expect(markup).toContain("Bagagem de 10kg");
  });
});
