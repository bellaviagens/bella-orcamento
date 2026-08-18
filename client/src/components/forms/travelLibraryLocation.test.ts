import { describe, expect, it } from "vitest";
import { travelLibraryLocationFromDestination } from "./travelLibraryLocation";

describe("travelLibraryLocationFromDestination", () => {
  it("separa cidade e país do destino preenchido na viagem", () => {
    expect(travelLibraryLocationFromDestination("Santiago, Chile")).toEqual({
      destination: "Santiago, Chile", city: "Santiago", country: "Chile",
    });
  });

  it("mantém a cidade quando o destino não inclui país", () => {
    expect(travelLibraryLocationFromDestination("Maceió")).toEqual({ destination: "Maceió", city: "Maceió", country: "" });
  });
});
