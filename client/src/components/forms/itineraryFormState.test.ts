import { describe, expect, it } from "vitest";
import { createEmptyGastronomySearchDraft } from "./itineraryFormState";

describe("createEmptyGastronomySearchDraft", () => {
  it("limpa os campos e os resultados associados a uma busca gastronômica anterior", () => {
    expect(createEmptyGastronomySearchDraft()).toEqual({ name: "", location: "", targetDays: {} });
  });
});
