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

  it("move um card de tarifa somente aéreo inteiro para a página seguinte", () => {
    expect(buildPdfSegments(2100, 1000, [{ top: 780, bottom: 1100 }], [])).toEqual([
      { start: 0, end: 780 },
      { start: 780, end: 1780 },
      { start: 1780, end: 2100 },
    ]);
  });

  it("move um dia completo da proposta de passeios para a página seguinte", () => {
    expect(buildPdfSegments(2500, 1000, [{ top: 760, bottom: 1460 }], [])).toEqual([
      { start: 0, end: 760 },
      { start: 760, end: 1760 },
      { start: 1760, end: 2500 },
    ]);
  });

  it("mantém dois passeios completos na mesma página quando ambos cabem", () => {
    expect(buildPdfSegments(2100, 1000, [
      { top: 100, bottom: 460 },
      { top: 480, bottom: 940 },
      { top: 960, bottom: 1320 },
    ], [])).toEqual([
      { start: 0, end: 960 },
      { start: 960, end: 1960 },
      { start: 1960, end: 2100 },
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

  it("incorpora um resíduo de arredondamento na última página", () => {
    expect(buildPdfSegments(2246, 2245.885714285714, [], [])).toEqual([
      { start: 0, end: 2246 },
    ]);
  });
});
