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

  it("agrupa pastas únicas em ordem de leitura", () => {
    expect(getTravelLibraryFolders(items)).toEqual(["Hotéis Chile", "Passeios Chile", "Restaurantes Chile", "Transfers"]);
  });
});
