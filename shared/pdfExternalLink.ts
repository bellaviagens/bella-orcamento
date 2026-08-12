export type PdfLinkWriter = (
  x: number,
  y: number,
  width: number,
  height: number,
  options: { url: string; pageNumber: undefined },
) => void;

/**
 * Mantém a configuração usada pela versão do PDF em que os links externos
 * abriam fora do visualizador, sem interferir na paginação ou no layout.
 */
export function addExternalPdfLink(
  writeLink: PdfLinkWriter,
  x: number,
  y: number,
  width: number,
  height: number,
  url: string,
) {
  writeLink(x, y, width, height, { url, pageNumber: undefined });
}
