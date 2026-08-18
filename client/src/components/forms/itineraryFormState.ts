import type { GastronomyOption } from "@shared/budgetTypes";

export interface GastronomySearchDraft {
  name: string;
  location: string;
  targetDays: Record<string, string>;
}

/** Estado local inicial da busca, usado para que uma Nova Proposta não retenha resultados anteriores. */
export function createEmptyGastronomySearchDraft(): GastronomySearchDraft {
  return { name: "", location: "", targetDays: {} };
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

export function filterRestaurantFavorites<T extends Pick<RestaurantFavoriteForProposal, "name" | "location" | "address"> & { tags?: string[] }>(favorites: T[], search: string, selectedTag: string): T[] {
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  return favorites.filter((favorite) => {
    const matchesTag = selectedTag === "all" || (favorite.tags || []).includes(selectedTag);
    const searchable = `${favorite.name} ${favorite.location} ${favorite.address} ${(favorite.tags || []).join(" ")}`.toLocaleLowerCase("pt-BR");
    return matchesTag && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
}
