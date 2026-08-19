/**
 * Preserva apenas imagens que o cadastro da Biblioteca consegue receber.
 * Fotos ausentes ou retornadas em formato inválido por buscas externas não
 * impedem o salvamento dos demais dados do restaurante.
 */
export function validTravelLibraryImageUrl(photoUrl?: string): string | undefined {
  const candidate = photoUrl?.trim();
  if (!candidate) return undefined;

  if (candidate.startsWith("/manus-storage/")) return candidate;

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? candidate : undefined;
  } catch {
    return undefined;
  }
}
