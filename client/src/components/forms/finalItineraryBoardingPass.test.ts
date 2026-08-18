import { describe, expect, it } from "vitest";
import { boardingPassAttachmentUpdates, boardingPassUpdates } from "./finalItineraryBoardingPass";

const parsedBoardingPass = {
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
  passengerName: "Maria da Silva",
  seat: "12A",
};

describe("boardingPassUpdates", () => {
  it("preenche os campos do voo com os dados encontrados no bilhete", () => {
    const updates = boardingPassUpdates({ id: "flight-1", day: 1, kind: "flight", title: "Voo de ida", time: "", description: "" }, parsedBoardingPass);

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
      passengerName: "",
      seat: "",
    });

    expect(updates).toMatchObject({
      flightLocator: "EXISTENTE",
      flightDepartureTerminal: "Terminal 2",
      time: "09:10",
      flightArrivalAirport: "SCL",
      flightArrivalTime: "12:50",
    });
  });

  it("reconhece o passageiro cadastrado pelo nome do bilhete e armazena o assento", () => {
    const attachment = boardingPassAttachmentUpdates(
      { id: "file-1", name: "cartao.pdf", url: "https://example.com/cartao.pdf", contentType: "application/pdf", size: 1234 },
      [{ id: "passenger-1", name: "Maria da Silva" }],
      undefined,
      parsedBoardingPass,
    );

    expect(attachment).toMatchObject({ passengerId: "passenger-1", passengerName: "Maria da Silva", seat: "12A" });
  });

  it("preserva a seleção manual de passageiro quando ela for diferente do nome lido", () => {
    const attachment = boardingPassAttachmentUpdates(
      { id: "file-1", name: "cartao.pdf", url: "https://example.com/cartao.pdf", contentType: "application/pdf", size: 1234 },
      [{ id: "passenger-1", name: "Maria da Silva" }, { id: "passenger-2", name: "João Souza" }],
      "passenger-2",
      parsedBoardingPass,
    );

    expect(attachment).toMatchObject({ passengerId: "passenger-2", passengerName: "Maria da Silva", seat: "12A" });
  });
});
