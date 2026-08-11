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

  it("preserva exatamente o título digitado da tarifa", () => {
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
        tiers={[{ id: "fare-2", name: "Aéreo Personalizado", flightPrice: 1000, benefits: [] }]}
        passengers={1}
      />,
    );

    expect(markup).toContain("Aéreo Personalizado");
    expect(markup).not.toContain("Com Aéreo Aéreo Personalizado");
  });
});
