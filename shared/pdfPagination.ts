export interface PdfSegment {
  start: number;
  end: number;
}

export interface PdfProtectedBlock {
  top: number;
  bottom: number;
}

/**
 * Divide o canvas do orçamento em páginas, mantendo blocos protegidos inteiros.
 * Um bloco maior que uma página é mantido em um único segmento e reduzido pelo
 * exportador, evitando que qualquer parte dele seja cortada.
 */
export function buildPdfSegments(
  canvasHeight: number,
  pageHeight: number,
  protectedBlocks: PdfProtectedBlock[],
  manualBreakPoints: number[],
): PdfSegment[] {
  const blocks = [...protectedBlocks].sort((a, b) => a.top - b.top);
  const breaks = [...manualBreakPoints].sort((a, b) => a - b);
  const segments: PdfSegment[] = [];
  let currentY = 0;

  while (currentY < canvasHeight) {
    const pageEnd = Math.min(currentY + pageHeight, canvasHeight);
    let adjustedEnd = pageEnd;
    const oversizedBlock = blocks.find(
      (block) => block.top <= currentY + 1 && block.bottom > pageEnd && block.bottom - block.top > pageHeight,
    );

    if (oversizedBlock) {
      adjustedEnd = Math.min(oversizedBlock.bottom, canvasHeight);
    } else {
      const cutBlock = blocks.find(
        (block) => block.top > currentY && block.top < pageEnd && block.bottom > pageEnd,
      );
      if (cutBlock) adjustedEnd = cutBlock.top;
    }

    const manualBreak = breaks.find((breakPoint) => breakPoint > currentY && breakPoint < adjustedEnd);
    if (manualBreak !== undefined) adjustedEnd = manualBreak;

    if (adjustedEnd - currentY <= 10) {
      adjustedEnd = pageEnd;
    }

    segments.push({ start: currentY, end: adjustedEnd });
    currentY = adjustedEnd;
  }

  return segments;
}
