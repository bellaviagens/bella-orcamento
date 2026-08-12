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

  it("desconta a entrada e mostra a taxa da maquininha no parcelamento aéreo", () => {
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

    expect(markup).toContain("1 entrada de R$ 1.000,00 + 10x de R$ 105,00");
    expect(markup).toContain("Taxa da maquininha: 2,5%");
  });

  it("desconta a entrada antes de parcelar hotel e aéreo mais hotel", () => {
    const hotel = {
      id: "hotel-4",
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
    };

    const hotelMarkup = renderToStaticMarkup(
      <HotelCard
        hotel={hotel}
        index={0}
        tiers={[{ id: "fare-4", name: "Completa", flightPrice: 1000, benefits: [] }]}
        passengers={2}
        includeHotel
        hotelPaymentMethods={["cartao"]}
        hotelInstallments={6}
        hotelDownpayment
        hotelDownpaymentAmount={1000}
      />,
    );

    const combinedMarkup = renderToStaticMarkup(
      <HotelCard
        hotel={hotel}
        index={0}
        tiers={[{ id: "fare-5", name: "Completa", flightPrice: 1000, benefits: [] }]}
        passengers={2}
        combined
        combinedInstallments={6}
        combinedDownpayment
        combinedDownpaymentAmount={1000}
      />,
    );

    expect(hotelMarkup).toContain("1 entrada de R$ 1.000,00 + 6x de R$ 333,33");
    expect(combinedMarkup).toContain("1 entrada de R$ 1.000,00 + 6x de R$ 666,67");
  });

  it("aplica a taxa da calculadora do aéreo antes de parcelar o total conjunto", () => {
    const markup = renderToStaticMarkup(
      <HotelCard
        hotel={{
          id: "hotel-5",
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
        tiers={[{ id: "fare-6", name: "Completa", flightPrice: 1000, benefits: [] }]}
        passengers={2}
        combined
        combinedInstallments={6}
        combinedDownpayment
        combinedDownpaymentAmount={1000}
        flightMachineRate={10}
      />,
    );

    expect(markup).toContain("1 entrada de R$ 1.000,00 + 6x de R$ 700,00");
    expect(markup).toContain("Taxa da maquininha: 10%");
  });

  it("usa a entrada e o número de parcelas configurados no aéreo ao parcelar junto", () => {
    const markup = renderToStaticMarkup(
      <HotelCard
        hotel={{
          id: "hotel-6",
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
        tiers={[{ id: "fare-7", name: "Completa", flightPrice: 1000, benefits: [] }]}
        passengers={2}
        combined
        combinedInstallments={10}
        flightDownpayment
        flightDownpaymentAmount={1000}
      />,
    );

    expect(markup).toContain("1 entrada de R$ 1.000,00 + 10x de R$ 400,00");
  });
});
