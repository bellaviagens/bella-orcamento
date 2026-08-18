import type { FinalItineraryAttachment, FinalItineraryAttachmentDocumentType, FinalItineraryEvent, FinalItineraryPassenger } from "@shared/budgetTypes";

export type BoardingPassData = {
  airline: string;
  flightNumber: string;
  locator: string;
  date: string;
  departureAirport: string;
  departureTime: string;
  departureTerminal: string;
  departureGate: string;
  arrivalAirport: string;
  arrivalTime: string;
  arrivalTerminal: string;
  passengerName: string;
  seat: string;
  documentType: FinalItineraryAttachmentDocumentType;
};

function keepExistingValue(parsedValue: string, currentValue?: string) {
  return parsedValue.trim() || currentValue || "";
}

function normalizePassengerName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
}

export function findPassengerIdByBoardingPassName(passengers: FinalItineraryPassenger[], boardingPassName: string) {
  const documentTokens = normalizePassengerName(boardingPassName).split(" ").filter((token) => token.length > 1);
  if (documentTokens.length < 2) return undefined;

  return passengers.find((passenger) => {
    const passengerTokens = normalizePassengerName(passenger.name).split(" ").filter((token) => token.length > 1);
    return documentTokens.every((token) => passengerTokens.includes(token)) || passengerTokens.every((token) => documentTokens.includes(token));
  })?.id;
}

export function boardingPassAttachmentUpdates(
  attachment: FinalItineraryAttachment,
  passengers: FinalItineraryPassenger[],
  selectedPassengerId: string | undefined,
  parsed: BoardingPassData,
): FinalItineraryAttachment {
  const detectedPassengerId = findPassengerIdByBoardingPassName(passengers, parsed.passengerName);
  const passengerId = selectedPassengerId || detectedPassengerId || attachment.passengerId;
  const selectedPassenger = passengers.find((passenger) => passenger.id === passengerId);

  return {
    ...attachment,
    passengerId,
    passengerName: parsed.passengerName.trim() || selectedPassenger?.name || attachment.passengerName,
    seat: parsed.seat.trim() || attachment.seat,
    documentType: parsed.documentType || attachment.documentType,
  };
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
    flightDepartureGate: keepExistingValue(parsed.departureGate, event.flightDepartureGate),
    flightArrivalAirport: keepExistingValue(parsed.arrivalAirport, event.flightArrivalAirport),
    flightArrivalTime: keepExistingValue(parsed.arrivalTime, event.flightArrivalTime),
    flightArrivalTerminal: keepExistingValue(parsed.arrivalTerminal, event.flightArrivalTerminal),
    time: departureTime || event.time,
  };
}
