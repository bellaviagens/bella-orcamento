import type { GastronomyOption, Tour } from "@shared/budgetTypes";

export interface GastronomySearchDraft {
  name: string;
  location: string;
  targetDays: Record<string, string>;
}

/** Estado local inicial da busca, usado para que uma Nova Proposta não retenha resultados anteriores. */
export function createEmptyGastronomySearchDraft(): GastronomySearchDraft {
  return { name: "", location: "", targetDays: {} };
}

/** Cria o registro de passeio que concentra os detalhes de uma atividade da proposta. */
export function createProposalTourFromActivity(activity: Pick<import("@shared/budgetTypes").ItineraryActivity, "title" | "description" | "linkUrl" | "photoUrl">, id: string, defaultTravelerCount: number): Tour {
  return {
    id,
    name: activity.title || "Novo passeio",
    location: "",
    duration: "",
    description: activity.description || "",
    totalPrice: 0,
    pricingMode: "perPerson",
    pricePerPerson: 0,
    travelerCount: Math.max(1, defaultTravelerCount),
    childPrice: 0,
    childCount: 0,
    notes: "",
    pageUrl: activity.linkUrl || "",
    photosUrl: activity.photoUrl || "",
  };
}

export interface RestaurantFavoriteForProposal {
  placeId: string;
  name: string;
  location: string;
  address: string;
  description: string;
  rating?: number;
  mapsUrl: string;
  website?: string | null;
  photoUrl?: string | null;
  tags?: string[];
  collectionName?: string | null;
  priceRange?: string | null;
  personalNote?: string | null;
}

/** Mantém os links e a foto do favorito ao reutilizá-lo em uma nova proposta. */
export function favoriteRestaurantToGastronomyOption(favorite: RestaurantFavoriteForProposal): GastronomyOption {
  return {
    id: favorite.placeId,
    name: favorite.name,
    location: favorite.location,
    address: favorite.address,
    description: favorite.description,
    rating: favorite.rating,
    mapsUrl: favorite.mapsUrl,
    website: favorite.website || undefined,
    photoUrl: favorite.photoUrl || undefined,
  };
}

export function filterRestaurantFavorites<T extends Pick<RestaurantFavoriteForProposal, "name" | "location" | "address"> & { tags?: string[]; collectionName?: string | null }>(favorites: T[], search: string, selectedTag: string, selectedCollection = "all"): T[] {
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  return favorites.filter((favorite) => {
    const matchesTag = selectedTag === "all" || (favorite.tags || []).includes(selectedTag);
    const matchesCollection = selectedCollection === "all" || favorite.collectionName === selectedCollection;
    const searchable = `${favorite.name} ${favorite.location} ${favorite.address} ${favorite.collectionName || ""} ${(favorite.tags || []).join(" ")}`.toLocaleLowerCase("pt-BR");
    return matchesTag && matchesCollection && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
}

export type FavoriteRestaurantSort = "recent" | "rating_desc" | "price_asc" | "price_desc";

const PRICE_RANGE_RANK = { economica: 1, moderada: 2, alta: 3, premium: 4 } as const;

/** Ordena sem modificar a lista original, mantendo favoritos sem preço ao final. */
export function sortRestaurantFavorites<T extends { rating?: number; priceRange?: string | null; updatedAt?: Date | string }>(favorites: T[], sort: FavoriteRestaurantSort): T[] {
  const sorted = [...favorites];
  if (sort === "rating_desc") return sorted.sort((first, second) => (second.rating ?? -1) - (first.rating ?? -1));
  if (sort === "price_asc" || sort === "price_desc") {
    const direction = sort === "price_asc" ? 1 : -1;
    return sorted.sort((first, second) => {
      const firstRank = first.priceRange && first.priceRange in PRICE_RANGE_RANK ? PRICE_RANGE_RANK[first.priceRange as keyof typeof PRICE_RANGE_RANK] : Number.POSITIVE_INFINITY;
      const secondRank = second.priceRange && second.priceRange in PRICE_RANGE_RANK ? PRICE_RANGE_RANK[second.priceRange as keyof typeof PRICE_RANGE_RANK] : Number.POSITIVE_INFINITY;
      return (firstRank - secondRank) * direction;
    });
  }
  return sorted;
}
