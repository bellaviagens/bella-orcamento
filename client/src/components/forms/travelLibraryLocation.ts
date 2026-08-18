export type TravelLibraryLocation = { destination: string; city: string; country: string };

/**
 * Interpreta o destino informado na viagem no formato usual "Cidade, País".
 * Caso o país não seja informado, a cidade continua disponível para edição.
 */
export function travelLibraryLocationFromDestination(value: string): TravelLibraryLocation {
  const destination = value.trim();
  if (!destination) return { destination: "", city: "", country: "" };

  const parts = destination.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { destination, city: destination, country: "" };

  return {
    destination,
    city: parts[0],
    country: parts.at(-1) || "",
  };
}
