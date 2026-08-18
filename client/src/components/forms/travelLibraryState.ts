export type TravelLibraryCategory = "hotel" | "tour" | "restaurant" | "transfer";

export const TRAVEL_LIBRARY_CATEGORY_LABELS: Record<TravelLibraryCategory, string> = {
  hotel: "Hotéis",
  tour: "Passeios",
  restaurant: "Restaurantes",
  transfer: "Transfers",
};

type TravelLibraryItemLike = {
  id: string;
  category: TravelLibraryCategory;
  folderName: string;
  name: string;
  destination: string | null;
  country?: string | null;
  city?: string | null;
  contactName: string | null;
  phone: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
};

export type TravelLibraryFilters = {
  category: TravelLibraryCategory | "all";
  country: string;
  city: string;
};

export function filterTravelLibraryItems<T extends TravelLibraryItemLike>(items: T[], filters: TravelLibraryFilters | TravelLibraryCategory | "all") {
  const normalizedFilters: TravelLibraryFilters = typeof filters === "string"
    ? { category: filters, country: "", city: "" }
    : filters;
  return items.filter((item) =>
    (normalizedFilters.category === "all" || item.category === normalizedFilters.category)
    && (!normalizedFilters.country || item.country?.trim() === normalizedFilters.country)
    && (!normalizedFilters.city || item.city?.trim() === normalizedFilters.city),
  );
}

export function getTravelLibraryFolders<T extends TravelLibraryItemLike>(items: T[]) {
  return Array.from(new Set(items.map((item) => item.folderName))).sort((first, second) => first.localeCompare(second, "pt-BR"));
}
