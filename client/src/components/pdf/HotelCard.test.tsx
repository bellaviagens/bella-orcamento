import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    imageProxy: {
      useQuery: () => ({ data: undefined }),
    },
  },
}));

import { HotelCard } from "./HotelCard";

describe("HotelCard — parcelamento conjunto", () => {
  it("renderiza a soma de aéreo e hotel dividida pelas parcelas do aéreo", () => {
    const markup = renderToStaticMarkup(
      <HotelCard
        hotel={{
          id: "hotel-1",
          name: "Hotel Exemplo",
          stars: 4,
          address: "Endereço",
          description: "",
          rating: 0,
          ratingLabel: "",
          amenities: [],
          photoUrl: "",
          totalPrice: 3000,
          prices: {},
        }}
        index={0}
        tiers={[{ id: "fare-1", name: "Básica", flightPrice: 1000, benefits: [] }]}
        passengers={2}
        combined
        combinedInstallments={10}
      />,
    );

    expect(markup).toContain("Aéreo + Hotel");
    expect(markup).toContain("10x de R$ 500,00");
  });

  it("insere o prefixo Com Aéreo antes do título digitado da tarifa", () => {
    const markup = renderToStaticMarkup(
      <HotelCard
        hotel={{
          id: "hotel-2",
          name: "Hotel Exemplo",
          stars: 4,
          address: "Endereço",
          description: "",
          rating: 0,
          ratingLabel: "",
          amenities: [],
          photoUrl: "",
          totalPrice: 3000,
          prices: {},
        }}
        index={0}
        tiers={[{ id: "fare-2", name: "Personalizado", flightPrice: 1000, benefits: [] }]}
        passengers={1}
      />,
    );

    expect(markup).toContain("Com Aéreo Personalizado");
  });

  it("mostra a entrada e a taxa da maquininha no parcelamento aéreo", () => {
    const markup = renderToStaticMarkup(
      <HotelCard
        hotel={{
          id: "hotel-3",
          name: "Hotel Exemplo",
          stars: 4,
          address: "Endereço",
          description: "",
          rating: 0,
          ratingLabel: "",
          amenities: [],
          photoUrl: "",
          totalPrice: 3000,
          prices: {},
        }}
        index={0}
        tiers={[{ id: "fare-3", name: "Completa", flightPrice: 1000, benefits: [] }]}
        passengers={2}
        flightPaymentMethods={["cartao"]}
        flightInstallments={10}
        flightDownpayment
        flightDownpaymentAmount={1000}
        flightMachineRate={2.5}
      />,
    );

    expect(markup).toContain("10x de R$ 205,00");
    expect(markup).toContain("Taxa da maquininha: 2,5%");
    expect(markup).toContain("Entrada: R$ 1.000,00");
  });
});
