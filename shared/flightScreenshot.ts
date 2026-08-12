import type { Flight } from "./budgetTypes";

export type FlightScreenshotTarget = "automatico" | Flight["type"];

export type ParsedFlight = Omit<Flight, "id">;

export function selectFlightsFromScreenshot(
  flights: ParsedFlight[],
  target: FlightScreenshotTarget,
): ParsedFlight[] {
  const validFlights = flights.filter((flight) => flight.segments.length > 0);

  if (target === "automatico") {
    return (["ida", "volta"] as const)
      .map((type) => validFlights.find((flight) => flight.type === type))
      .filter((flight): flight is ParsedFlight => Boolean(flight));
  }

  const selectedFlight = validFlights.find((flight) => flight.type === target) ?? validFlights[0];
  return selectedFlight ? [{ ...selectedFlight, type: target }] : [];
}
