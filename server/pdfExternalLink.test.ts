import { describe, expect, it, vi } from "vitest";
import { addExternalPdfLink, normalizeExternalUrl } from "@shared/pdfExternalLink";

describe("addExternalPdfLink", () => {
  it("restaura a configuração de link externo da versão anterior", () => {
    const writeLink = vi.fn();

    addExternalPdfLink(writeLink, 12, 34, 56, 7, "https://hotel.example.com/fotos");

    expect(writeLink).toHaveBeenCalledWith(12, 34, 56, 7, {
      url: "https://hotel.example.com/fotos",
      pageNumber: undefined,
    });
  });

  it("normaliza endereços sem protocolo para links externos válidos", () => {
    expect(normalizeExternalUrl("hotel.example.com/fotos")).toBe("https://hotel.example.com/fotos");
    expect(normalizeExternalUrl("//hotel.example.com/fotos")).toBe("https://hotel.example.com/fotos");
    expect(normalizeExternalUrl("http://hotel.example.com/fotos")).toBe("http://hotel.example.com/fotos");
  });
});
