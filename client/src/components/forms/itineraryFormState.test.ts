import { describe, expect, it } from "vitest";
import { createEmptyGastronomySearchDraft, favoriteRestaurantToGastronomyOption, filterRestaurantFavorites } from "./itineraryFormState";

describe("createEmptyGastronomySearchDraft", () => {
  it("limpa os campos e os resultados associados a uma busca gastronômica anterior", () => {
    expect(createEmptyGastronomySearchDraft()).toEqual({ name: "", location: "", targetDays: {} });
  });
});

describe("favoriteRestaurantToGastronomyOption", () => {
  it("preserva endereço, site e foto ao reutilizar um restaurante favorito", () => {
    expect(favoriteRestaurantToGastronomyOption({
      placeId: "place-123",
      name: "Restaurante favorito",
      location: "Santiago",
      address: "Av. Exemplo, 100",
      description: "Cozinha chilena",
      rating: 4.7,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query_place_id=place-123",
      website: "https://restaurante.example",
      photoUrl: "https://storage.example/restaurante.jpg",
    })).toEqual({
      id: "place-123",
      name: "Restaurante favorito",
      location: "Santiago",
      address: "Av. Exemplo, 100",
      description: "Cozinha chilena",
      rating: 4.7,
      mapsUrl: "https://www.google.com/maps/search/?api=1&query_place_id=place-123",
      website: "https://restaurante.example",
      photoUrl: "https://storage.example/restaurante.jpg",
    });
  });
});

describe("filterRestaurantFavorites", () => {
  const favorites = [
    { name: "Bistrô Andes", location: "Santiago", address: "Providencia", tags: ["jantar", "romântico"] },
    { name: "Café Central", location: "Santiago", address: "Centro", tags: ["almoço"] },
  ];

  it("filtra por texto ou por categoria personalizada", () => {
    expect(filterRestaurantFavorites(favorites, "andes", "all")).toHaveLength(1);
    expect(filterRestaurantFavorites(favorites, "", "almoço")).toEqual([favorites[1]]);
    expect(filterRestaurantFavorites(favorites, "centro", "jantar")).toEqual([]);
  });
});
