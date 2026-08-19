import { describe, expect, it } from "vitest";
import { filterFavoriteTravelLibraryItems, filterTravelLibraryItems, getTravelLibraryDestinationGroups, getTravelLibraryFolders, sortTravelLibraryItems } from "./travelLibraryState";

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
      { id: "hotel-scl", category: "hotel" as const, folderName: "Hotéis", country: "Chile", city: "Santiago", neighborhood: "Las Condes" },
      { id: "tour-scl", category: "tour" as const, folderName: "Passeios", country: "Chile", city: "Santiago" },
      { id: "hotel-pucon", category: "hotel" as const, folderName: "Hotéis", country: "Chile", city: "Pucón" },
      { id: "hotel-lisboa", category: "hotel" as const, folderName: "Hotéis", country: "Portugal", city: "Lisboa" },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "hotel", country: "Chile", city: "Santiago" }).map((item) => item.id)).toEqual(["hotel-scl"]);
  });

  it("inclui itens cujo país foi salvo apenas no destino", () => {
    const detailedItems = [
      { id: "hotel-scl", category: "hotel" as const, folderName: "Hotéis", destination: "Santiago, Chile", country: "Chile" },
      { id: "tour-scl", category: "tour" as const, folderName: "Passeios", destination: "Santiago, Chile", country: null },
      { id: "transfer-scl", category: "transfer" as const, folderName: "Transfers", destination: "Santiago, Chile", country: "" },
      { id: "hotel-lisboa", category: "hotel" as const, folderName: "Hotéis", destination: "Lisboa, Portugal", country: "Portugal" },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "all", country: "Chile", city: "", neighborhood: "" }).map((item) => item.id)).toEqual(["hotel-scl", "tour-scl", "transfer-scl"]);
  });

  it("agrupa pastas únicas em ordem de leitura", () => {
    expect(getTravelLibraryFolders(items)).toEqual(["Hotéis Chile", "Passeios Chile", "Restaurantes Chile", "Transfers"]);
  });

  it("forma grupos de destino somente a partir dos itens já filtrados", () => {
    const localizedItems = [
      { id: "santiago-hotel", category: "hotel" as const, folderName: "Hotéis", name: "Hotel Santiago", destination: "Santiago, Chile", country: "Chile", city: "Santiago", contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: null },
      { id: "lisbon-hotel", category: "hotel" as const, folderName: "Hotéis", name: "Hotel Lisboa", destination: "Lisboa, Portugal", country: "Portugal", city: "Lisboa", contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: null },
    ];

    const filtered = filterTravelLibraryItems(localizedItems, { category: "hotel", country: "Portugal", city: "Lisboa", neighborhood: "" });
    expect(getTravelLibraryDestinationGroups(filtered).map((group) => group.destination)).toEqual(["Lisboa, Portugal"]);
  });

  it("filtra hotéis por bairro", () => {
    const detailedItems = [
      { id: "hotel-las-condes", category: "hotel" as const, folderName: "Hotéis", country: "Chile", city: "Santiago", neighborhood: "Las Condes" },
      { id: "hotel-providencia", category: "hotel" as const, folderName: "Hotéis", country: "Chile", city: "Santiago", neighborhood: "Providencia" },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "hotel", country: "Chile", city: "Santiago", neighborhood: "Las Condes" }).map((item) => item.id)).toEqual(["hotel-las-condes"]);
  });

  it("aplica o filtro de bairro também a passeios e transfers", () => {
    const localizedItems = [
      { id: "tour-1", category: "tour" as const, folderName: "Passeios", country: "Chile", city: "Santiago", neighborhood: "Providencia" },
      { id: "transfer-1", category: "transfer" as const, folderName: "Transfers", country: "Chile", city: "Santiago", neighborhood: "Las Condes" },
    ];

    expect(filterTravelLibraryItems(localizedItems, { category: "all", country: "Chile", city: "Santiago", neighborhood: "Providencia" }).map((item) => item.id)).toEqual(["tour-1"]);
  });

  it("pesquisa hotéis por nome, endereço salvo nas notas ou bairro", () => {
    const detailedItems = [
      { id: "hotel-1", category: "hotel" as const, folderName: "Hotéis", name: "Hotel Andes", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: "Las Condes", contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: "Endereço: Avenida Manquehue Norte" },
      { id: "hotel-2", category: "hotel" as const, folderName: "Hotéis", name: "Plaza Centro", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: "Providencia", contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: null },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "hotel", country: "", city: "", neighborhood: "", searchQuery: "manquehue" }).map((item) => item.id)).toEqual(["hotel-1"]);
    expect(filterTravelLibraryItems(detailedItems, { category: "hotel", country: "", city: "", neighborhood: "", searchQuery: "providencia" }).map((item) => item.id)).toEqual(["hotel-2"]);
  });

  it("ordena hotéis pelo bairro e usa o nome como desempate", () => {
    const detailedItems = [
      { id: "hotel-2", category: "hotel" as const, folderName: "Hotéis", name: "Zeta", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: "Providencia", contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: null },
      { id: "hotel-1", category: "hotel" as const, folderName: "Hotéis", name: "Andes", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: "Las Condes", contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: null },
    ];
    expect(sortTravelLibraryItems(detailedItems, "neighborhood").map((item) => item.id)).toEqual(["hotel-1", "hotel-2"]);
  });

  it("separa os itens marcados como favoritos na Biblioteca", () => {
    const detailedItems = [
      { id: "hotel-1", category: "hotel" as const, folderName: "Hotéis", isFavorite: true },
      { id: "tour-1", category: "tour" as const, folderName: "Passeios", isFavorite: false },
      { id: "transfer-1", category: "transfer" as const, folderName: "Transfers" },
    ];
    expect(filterFavoriteTravelLibraryItems(detailedItems).map((item) => item.id)).toEqual(["hotel-1"]);
  });

  it("pesquisa passeios e transfers por dados cadastrados", () => {
    const detailedItems = [
      { id: "tour-1", category: "tour" as const, folderName: "Passeios", name: "Vinícolas do Vale", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: null, contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: "Saída do hotel às 08:00" },
      { id: "transfer-1", category: "transfer" as const, folderName: "Transfers", name: "Transfer Andes", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: null, contactName: "Andes Transportes", phone: "+56 9 9999-9999", responsibleName: "Carlos Silva", whatsapp: "+56 9 9999-9999", linkUrl: null, imageUrl: null, notes: "Recepção no aeroporto" },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "tour", country: "Chile", city: "Santiago", neighborhood: "", searchQuery: "08:00" }).map((item) => item.id)).toEqual(["tour-1"]);
    expect(filterTravelLibraryItems(detailedItems, { category: "transfer", country: "Chile", city: "Santiago", neighborhood: "", searchQuery: "carlos" }).map((item) => item.id)).toEqual(["transfer-1"]);
  });

  it("pesquisa na Biblioteca inteira quando Todos estiver selecionado", () => {
    const detailedItems = [
      { id: "hotel-1", category: "hotel" as const, folderName: "Hotéis", name: "Manquehue Apart Hotel", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: null, contactName: null, phone: null, linkUrl: null, imageUrl: null, notes: null },
      { id: "restaurant-1", category: "restaurant" as const, folderName: "Restaurantes", name: "Restaurante Andino", destination: "Santiago, Chile", country: "Chile", city: "Santiago", neighborhood: null, contactName: "Reserva Andina", phone: null, linkUrl: null, imageUrl: null, notes: null },
    ];

    expect(filterTravelLibraryItems(detailedItems, { category: "all", country: "", city: "", neighborhood: "", searchQuery: "andina" }).map((item) => item.id)).toEqual(["restaurant-1"]);
  });
});
