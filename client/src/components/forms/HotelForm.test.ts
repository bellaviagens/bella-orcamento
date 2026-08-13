import { describe, expect, it } from "vitest";
import type { Hotel } from "@shared/budgetTypes";
import { getHotelEditorInitialValues } from "./HotelForm";

describe("getHotelEditorInitialValues", () => {
  it("preenche o editor com todos os campos do hotel selecionado", () => {
    const hotel: Hotel = {
      id: "hotel-1",
      name: "Hotel Presidente",
      stars: 4,
      address: "Av. Principal, 123",
      description: "Hospedagem central",
      rating: 8.5,
      ratingLabel: "Excelente",
      amenities: ["Wi-Fi", "Piscina"],
      photoUrl: "https://example.com/photo.jpg",
      hotelUrl: "https://example.com/hotel",
      totalPrice: 5500,
      prices: { "tier-1": { total: 5500, perPerson: 2750 } },
      priceMode: "daily",
      dailyPrice: 1100,
      nights: 5,
      startOnNewPage: true,
      paymentNotes: "10x no cartão",
    };

    expect(getHotelEditorInitialValues(hotel)).toEqual({
      name: "Hotel Presidente",
      stars: 4,
      address: "Av. Principal, 123",
      description: "Hospedagem central",
      rating: 8.5,
      ratingLabel: "Excelente",
      amenities: ["Wi-Fi", "Piscina"],
      photoUrl: "https://example.com/photo.jpg",
      hotelUrl: "https://example.com/hotel",
      totalPrice: 5500,
      priceMode: "daily",
      dailyPrice: 1100,
      nights: 5,
      prices: { "tier-1": { total: 5500, perPerson: 2750 } },
      startOnNewPage: true,
      paymentNotes: "10x no cartão",
    });
  });
});
