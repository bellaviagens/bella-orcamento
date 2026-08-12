import { describe, expect, it, vi } from "vitest";
import { addExternalPdfLink } from "@shared/pdfExternalLink";

describe("addExternalPdfLink", () => {
  it("restaura a configuração de link externo da versão anterior", () => {
    const writeLink = vi.fn();

    addExternalPdfLink(writeLink, 12, 34, 56, 7, "https://hotel.example.com/fotos");

    expect(writeLink).toHaveBeenCalledWith(12, 34, 56, 7, {
      url: "https://hotel.example.com/fotos",
      pageNumber: undefined,
    });
  });
});
