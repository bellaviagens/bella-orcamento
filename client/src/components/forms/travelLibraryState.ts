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
  contactName: string | null;
  phone: string | null;
  linkUrl: string | null;
  imageUrl: string | null;
  notes: string | null;
};

export function filterTravelLibraryItems<T extends TravelLibraryItemLike>(items: T[], category: TravelLibraryCategory | "all") {
  return items.filter((item) => category === "all" || item.category === category);
}

export function getTravelLibraryFolders<T extends TravelLibraryItemLike>(items: T[]) {
  return Array.from(new Set(items.map((item) => item.folderName))).sort((first, second) => first.localeCompare(second, "pt-BR"));
}
