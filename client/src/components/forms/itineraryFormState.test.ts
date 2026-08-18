import { describe, expect, it } from "vitest";
import { createEmptyGastronomySearchDraft, createProposalTourFromActivity, favoriteRestaurantToGastronomyOption, filterRestaurantFavorites, sortRestaurantFavorites } from "./itineraryFormState";

describe("createEmptyGastronomySearchDraft", () => {
  it("limpa os campos e os resultados associados a uma busca gastronômica anterior", () => {
    expect(createEmptyGastronomySearchDraft()).toEqual({ name: "", location: "", targetDays: {} });
  });
});

describe("createProposalTourFromActivity", () => {
  it("concentra no passeio os dados iniciais de descrição, site, foto e quantidade de viajantes", () => {
    expect(createProposalTourFromActivity({ title: "Tour nos Andes", description: "Passeio panorâmico", linkUrl: "https://fornecedor.example/tour", photoUrl: "https://fornecedor.example/foto.jpg" }, "tour-1", 2)).toMatchObject({
      id: "tour-1",
      name: "Tour nos Andes",
      description: "Passeio panorâmico",
      pageUrl: "https://fornecedor.example/tour",
      photosUrl: "https://fornecedor.example/foto.jpg",
      pricingMode: "perPerson",
      travelerCount: 2,
      childPrice: 0,
      childCount: 0,
    });
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
    { name: "Bistrô Andes", location: "Santiago", address: "Providencia", tags: ["jantar", "romântico"], collectionName: "Santiago 2027", rating: 4.8, priceRange: "alta" },
    { name: "Café Central", location: "Santiago", address: "Centro", tags: ["almoço"], collectionName: "Santiago 2027", rating: 4.2, priceRange: "economica" },
    { name: "Bar Valparaíso", location: "Valparaíso", address: "Cerro Alegre", tags: ["jantar"], collectionName: "Chile 2027", rating: 4.5, priceRange: "premium" },
  ];

  it("filtra por texto ou por categoria personalizada", () => {
    expect(filterRestaurantFavorites(favorites, "andes", "all")).toHaveLength(1);
    expect(filterRestaurantFavorites(favorites, "", "almoço")).toEqual([favorites[1]]);
    expect(filterRestaurantFavorites(favorites, "centro", "jantar")).toEqual([]);
    expect(filterRestaurantFavorites(favorites, "", "all", "Chile 2027")).toEqual([favorites[2]]);
  });

  it("ordena por avaliação e faixa de preço sem alterar a lista original", () => {
    expect(sortRestaurantFavorites(favorites, "rating_desc").map((favorite) => favorite.name)).toEqual(["Bistrô Andes", "Bar Valparaíso", "Café Central"]);
    expect(sortRestaurantFavorites(favorites, "price_asc").map((favorite) => favorite.name)).toEqual(["Café Central", "Bistrô Andes", "Bar Valparaíso"]);
  });
});
