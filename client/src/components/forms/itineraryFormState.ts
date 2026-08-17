export interface GastronomySearchDraft {
  name: string;
  location: string;
  targetDays: Record<string, string>;
}

/** Estado local inicial da busca, usado para que uma Nova Proposta não retenha resultados anteriores. */
export function createEmptyGastronomySearchDraft(): GastronomySearchDraft {
  return { name: "", location: "", targetDays: {} };
}
