export type TravelLibraryCategory = "hotel" | "tour" | "restaurant" | "transfer";

export const TRAVEL_LIBRARY_CATEGORY_LABELS: Record<TravelLibraryCategory, string> = {
  hotel: "Hotéis",
  tour: "Passeios",
  restaurant: "Restaurantes",
  transfer: "Transfer",
};

type TravelLibraryItemLike = {
  id: string;
  category: TravelLibraryCategory;
  folderName: string;
  name: string;
  destination: string | null;
  country?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  contactName: string | null;
  phone: string | null;
  responsibleName?: string | null;
  whatsapp?: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
  isFavorite?: boolean;
};

export type TravelLibraryFilters = {
  category: TravelLibraryCategory | "all";
  country: string;
  city: string;
  neighborhood: string;
  searchQuery?: string;
};

export type HotelLibrarySort = "default" | "neighborhood";

function normalizedText(value: string | null | undefined) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function filterTravelLibraryItems<T extends TravelLibraryItemLike>(items: T[], filters: TravelLibraryFilters | TravelLibraryCategory | "all") {
  const normalizedFilters: TravelLibraryFilters = typeof filters === "string"
    ? { category: filters, country: "", city: "", neighborhood: "", searchQuery: "" }
    : filters;
  const searchQuery = normalizedText(normalizedFilters.searchQuery);
  return items.filter((item) =>
    (normalizedFilters.category === "all" || item.category === normalizedFilters.category)
    && (!normalizedFilters.country || item.country?.trim() === normalizedFilters.country)
    && (!normalizedFilters.city || item.city?.trim() === normalizedFilters.city)
    && (!normalizedFilters.neighborhood || item.neighborhood?.trim() === normalizedFilters.neighborhood)
    && (!searchQuery || [item.name, item.destination, item.country, item.city, item.neighborhood, item.contactName, item.phone, item.responsibleName, item.whatsapp, item.notes].some((value) => normalizedText(value).includes(searchQuery))),
  );
}

/** Ordena hotéis pelo bairro sem alterar a sequência padrão dos demais itens. */
export function sortTravelLibraryItems<T extends TravelLibraryItemLike>(items: T[], hotelSort: HotelLibrarySort) {
  if (hotelSort !== "neighborhood") return items;
  return [...items].sort((first, second) => {
    if (first.category !== "hotel" || second.category !== "hotel") return 0;
    const neighborhoodOrder = normalizedText(first.neighborhood).localeCompare(normalizedText(second.neighborhood), "pt-BR");
    return neighborhoodOrder || normalizedText(first.name).localeCompare(normalizedText(second.name), "pt-BR");
  });
}

/** Mantém na aba Favoritos somente os itens marcados pelo usuário na Biblioteca. */
export function filterFavoriteTravelLibraryItems<T extends TravelLibraryItemLike>(items: T[]) {
  return items.filter((item) => item.isFavorite === true);
}

export function getTravelLibraryFolders<T extends TravelLibraryItemLike>(items: T[]) {
  return Array.from(new Set(items.map((item) => item.folderName))).sort((first, second) => first.localeCompare(second, "pt-BR"));
}

/** Agrupa exclusivamente os itens que já passaram pelos filtros ativos. */
export function getTravelLibraryDestinationGroups<T extends TravelLibraryItemLike>(items: T[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const destination = item.destination?.trim() || "Sem destino definido";
    groups.set(destination, [...(groups.get(destination) || []), item]);
  }
  return Array.from(groups.entries())
    .sort(([first], [second]) => first.localeCompare(second, "pt-BR"))
    .map(([destination, destinationItems]) => ({ destination, items: destinationItems }));
}
