import { describe, expect, it } from "vitest";
import { validTravelLibraryImageUrl } from "./travelLibraryRestaurantSave";

describe("validTravelLibraryImageUrl", () => {
  it("mantém URLs HTTP válidas e caminhos internos de armazenamento", () => {
    expect(validTravelLibraryImageUrl("https://images.example.com/restaurant.jpg")).toBe("https://images.example.com/restaurant.jpg");
    expect(validTravelLibraryImageUrl("/manus-storage/restaurantes/foto.jpg")).toBe("/manus-storage/restaurantes/foto.jpg");
  });

  it("ignora valores vazios ou que não são URLs", () => {
    expect(validTravelLibraryImageUrl()).toBeUndefined();
    expect(validTravelLibraryImageUrl("   ")).toBeUndefined();
    expect(validTravelLibraryImageUrl("imagem-do-restaurante")).toBeUndefined();
  });
});
