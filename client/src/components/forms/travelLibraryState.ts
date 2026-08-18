export type TravelLibraryCategory = "hotel" | "tour" | "transfer";

export const TRAVEL_LIBRARY_CATEGORY_LABELS: Record<TravelLibraryCategory, string> = {
  hotel: "Hotéis",
  tour: "Passeios",
  transfer: "Transfers",
};

type TravelLibraryItemLike = {
  category: TravelLibraryCategory;
  folderName: string;
};

export function filterTravelLibraryItems<T extends TravelLibraryItemLike>(items: T[], category: TravelLibraryCategory | "all") {
  return items.filter((item) => category === "all" || item.category === category);
}

export function getTravelLibraryFolders<T extends TravelLibraryItemLike>(items: T[]) {
  return Array.from(new Set(items.map((item) => item.folderName))).sort((first, second) => first.localeCompare(second, "pt-BR"));
}
