import { describe, expect, it } from "vitest";
import { buildPdfSegments } from "@shared/pdfPagination";

describe("buildPdfSegments", () => {
  it("move o hotel inteiro para a página seguinte quando a borda o cortaria", () => {
    expect(buildPdfSegments(2400, 1000, [{ top: 820, bottom: 1320 }], [])).toEqual([
      { start: 0, end: 820 },
      { start: 820, end: 1820 },
      { start: 1820, end: 2400 },
    ]);
  });

  it("mantém um bloco maior que a página no mesmo segmento para escala de exportação", () => {
    expect(buildPdfSegments(2200, 1000, [{ top: 0, bottom: 1250 }], [])).toEqual([
      { start: 0, end: 1250 },
      { start: 1250, end: 2200 },
    ]);
  });

  it("respeita uma quebra manual antes de qualquer corte", () => {
    expect(buildPdfSegments(1800, 1000, [], [650])).toEqual([
      { start: 0, end: 650 },
      { start: 650, end: 1650 },
      { start: 1650, end: 1800 },
    ]);
  });
});
