import type { FinalItineraryEvent } from "@shared/budgetTypes";

export type BoardingPassData = {
  airline: string;
  flightNumber: string;
  locator: string;
  date: string;
  departureAirport: string;
  departureTime: string;
  departureTerminal: string;
  arrivalAirport: string;
  arrivalTime: string;
  arrivalTerminal: string;
};

function keepExistingValue(parsedValue: string, currentValue?: string) {
  return parsedValue.trim() || currentValue || "";
}

export function boardingPassUpdates(event: FinalItineraryEvent, parsed: BoardingPassData): Partial<FinalItineraryEvent> {
  const departureTime = keepExistingValue(parsed.departureTime, event.flightDepartureTime);

  return {
    flightAirline: keepExistingValue(parsed.airline, event.flightAirline),
    flightNumber: keepExistingValue(parsed.flightNumber, event.flightNumber),
    flightLocator: keepExistingValue(parsed.locator, event.flightLocator),
    flightDate: keepExistingValue(parsed.date, event.flightDate),
    flightDepartureAirport: keepExistingValue(parsed.departureAirport, event.flightDepartureAirport),
    flightDepartureTime: departureTime,
    flightDepartureTerminal: keepExistingValue(parsed.departureTerminal, event.flightDepartureTerminal),
    flightArrivalAirport: keepExistingValue(parsed.arrivalAirport, event.flightArrivalAirport),
    flightArrivalTime: keepExistingValue(parsed.arrivalTime, event.flightArrivalTime),
    flightArrivalTerminal: keepExistingValue(parsed.arrivalTerminal, event.flightArrivalTerminal),
    time: departureTime || event.time,
  };
}
