import { describe, expect, it } from "vitest";
import { filterTravelLibraryItems, getTravelLibraryFolders } from "./travelLibraryState";

describe("Biblioteca de Viagem", () => {
  const items = [
    { id: "hotel-1", category: "hotel" as const, folderName: "Hotéis Chile" },
    { id: "tour-1", category: "tour" as const, folderName: "Passeios Chile" },
    { id: "restaurant-1", category: "restaurant" as const, folderName: "Restaurantes Chile" },
    { id: "transfer-1", category: "transfer" as const, folderName: "Transfers" },
    { id: "hotel-2", category: "hotel" as const, folderName: "Hotéis Chile" },
  ];

  it("filtra os itens pelo tipo selecionado", () => {
    expect(filterTravelLibraryItems(items, "hotel").map((item) => item.id)).toEqual(["hotel-1", "hotel-2"]);
    expect(filterTravelLibraryItems(items, "restaurant").map((item) => item.id)).toEqual(["restaurant-1"]);
  });

  it("combina filtros de país, cidade e tipo de serviço", () => {
    const detailedItems = [
      { id: "hotel-scl", category: "hotel" as const, folderName: "Hotéis", country: "Chile", city: "Santiago" },
      { id: "tour-scl", category: "tour" as const, folderName: "Passeios", country: "Chile", city: "Santiago" },
      { id: "hotel-pucon", category: "hotel" as const, folderName: "Hotéis", country: "Chile", city: "Pucón" },
      { id: "hotel-lisboa", category: "hotel" as const, folderName: "Hotéis", country: "Portugal", city: "Lisboa" },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "hotel", country: "Chile", city: "Santiago" }).map((item) => item.id)).toEqual(["hotel-scl"]);
  });

  it("agrupa pastas únicas em ordem de leitura", () => {
    expect(getTravelLibraryFolders(items)).toEqual(["Hotéis Chile", "Passeios Chile", "Restaurantes Chile", "Transfers"]);
  });
});
