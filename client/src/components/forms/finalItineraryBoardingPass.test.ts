import { describe, expect, it } from "vitest";
import { boardingPassUpdates } from "./finalItineraryBoardingPass";

describe("boardingPassUpdates", () => {
  it("preenche os campos do voo com os dados encontrados no bilhete", () => {
    const updates = boardingPassUpdates({ id: "flight-1", day: 1, kind: "flight", title: "Voo de ida", time: "", description: "" }, {
      airline: "LATAM Airlines",
      flightNumber: "LA 8123",
      locator: "ABC123",
      date: "2026-08-26",
      departureAirport: "FLN",
      departureTime: "10:05",
      departureTerminal: "1",
      arrivalAirport: "SCL",
      arrivalTime: "12:50",
      arrivalTerminal: "Internacional",
    });

    expect(updates).toMatchObject({
      flightAirline: "LATAM Airlines",
      flightNumber: "LA 8123",
      flightLocator: "ABC123",
      flightDate: "2026-08-26",
      flightDepartureAirport: "FLN",
      flightDepartureTime: "10:05",
      flightArrivalAirport: "SCL",
      flightArrivalTime: "12:50",
      time: "10:05",
    });
  });

  it("mantém o que já foi preenchido quando o bilhete não informa algum campo", () => {
    const updates = boardingPassUpdates({
      id: "flight-1",
      day: 1,
      kind: "flight",
      title: "Voo de ida",
      time: "09:10",
      description: "",
      flightLocator: "EXISTENTE",
      flightDepartureTerminal: "Terminal 2",
    }, {
      airline: "",
      flightNumber: "LA 8123",
      locator: "",
      date: "",
      departureAirport: "",
      departureTime: "",
      departureTerminal: "",
      arrivalAirport: "SCL",
      arrivalTime: "12:50",
      arrivalTerminal: "",
    });

    expect(updates).toMatchObject({
      flightLocator: "EXISTENTE",
      flightDepartureTerminal: "Terminal 2",
      time: "09:10",
      flightArrivalAirport: "SCL",
      flightArrivalTime: "12:50",
    });
  });
});
