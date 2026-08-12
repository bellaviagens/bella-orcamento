import { selectFlightsFromScreenshot, type ParsedFlight } from "../shared/flightScreenshot";
import { describe, expect, it } from "vitest";

const outboundFlight: ParsedFlight = {
  type: "ida",
  isDirect: true,
  totalDuration: "3h 45min",
  operatingAirline: "LATAM",
  segments: [{
    airline: "LATAM",
    flightNumber: "",
    departureAirport: "FLN",
    departureCity: "Florianópolis",
    departureTime: "10:05",
    arrivalAirport: "SCL",
    arrivalCity: "Santiago do Chile",
    arrivalTime: "12:50",
    date: "26/08",
    duration: "3h 45min",
  }],
};

const returnFlight: ParsedFlight = {
  ...outboundFlight,
  type: "volta",
  totalDuration: "3h 15min",
  segments: [{
    ...outboundFlight.segments[0],
    departureAirport: "SCL",
    departureCity: "Santiago do Chile",
    departureTime: "13:50",
    arrivalAirport: "FLN",
    arrivalCity: "Florianópolis",
    arrivalTime: "18:05",
    date: "31/08",
    duration: "3h 15min",
  }],
};

describe("selectFlightsFromScreenshot", () => {
  it("seleciona ida e volta quando o print contém os dois trechos", () => {
    const selected = selectFlightsFromScreenshot([outboundFlight, returnFlight], "automatico");

    expect(selected).toHaveLength(2);
    expect(selected.map((flight) => flight.type)).toEqual(["ida", "volta"]);
    expect(selected[0].segments[0].departureAirport).toBe("FLN");
    expect(selected[1].segments[0].departureAirport).toBe("SCL");
  });

  it("permite reutilizar o mesmo print escolhendo somente a volta", () => {
    const selected = selectFlightsFromScreenshot([outboundFlight, returnFlight], "volta");

    expect(selected).toHaveLength(1);
    expect(selected[0].type).toBe("volta");
    expect(selected[0].segments[0].departureAirport).toBe("SCL");
    expect(selected[0].segments[0].arrivalAirport).toBe("FLN");
  });

  it("respeita o trecho escolhido mesmo quando a leitura tem um único voo", () => {
    const selected = selectFlightsFromScreenshot([outboundFlight], "volta");

    expect(selected).toHaveLength(1);
    expect(selected[0].type).toBe("volta");
    expect(selected[0].segments[0].departureAirport).toBe("FLN");
  });
});
