import { useCallback } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import { buildPdfSegments } from "@shared/pdfPagination";
import { addExternalPdfLink } from "@shared/pdfExternalLink";

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf", elementId: string = "pdf-document") => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("PDF document element not found");
      throw new Error("Elemento do PDF não encontrado");
    }

    try {
      console.log("📄 Iniciando geração de PDF...");

      // Move element to a fixed-width container outside the layout
      const captureContainer = document.createElement("div");
      captureContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: -9999px;
        width: 794px;
        min-width: 794px;
        max-width: 794px;
        overflow: visible;
        z-index: 9999;
        background: white;
      `;
      document.body.appendChild(captureContainer);

      // Clone the element into the capture container
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.width = "794px";
      clone.style.maxWidth = "794px";
      clone.style.minWidth = "794px";
      // Ensure height > width so jsPDF keeps portrait orientation (A4 ratio: 794 x 1123px at 96dpi)
      clone.style.minHeight = "1123px";
      captureContainer.appendChild(clone);

      // Os ícones SVG das bagagens podem não ser rasterizados pelo mecanismo de
      // exportação em alguns navegadores. No clone de PDF, substituímos somente
      // esses SVGs pelo mesmo símbolo de mala em texto, mantendo o preview intacto.
      clone.querySelectorAll<HTMLElement>("[data-pdf-baggage-icon='true']").forEach((icon) => {
        icon.style.display = "inline-flex";
        icon.style.alignItems = "center";
        icon.style.justifyContent = "center";
        const svgIcon = icon.previousElementSibling as SVGElement | null;
        if (svgIcon?.tagName.toLowerCase() === "svg") {
          svgIcon.style.display = "none";
        }
      });

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 150));

      // Capture the entire document as one tall canvas
      const canvas = await html2canvas(clone, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        imageTimeout: 0,
      });

      console.log("✓ Canvas gerado com sucesso", canvas.width, "x", canvas.height);

      // A4 dimensions: 210mm wide, 297mm tall
      const pdfWidthMm = 210;
      const pdfPageHeightMm = 297;
      const isItineraryPdf = elementId === "itinerary-document" || elementId === "final-itinerary-document";
      const continuedPageTopMarginMm = 8;
      const pageContentHeightMm = pdfPageHeightMm - continuedPageTopMarginMm;
      // pixels per mm based on canvas width
      const pxPerMm = canvas.width / pdfWidthMm;
      const pageHeightPx = pageContentHeightMm * pxPerMm;
      const imgWidth = pdfWidthMm; // alias for readability

      // Todas as posições precisam ser lidas do clone: ele é o documento com largura
      // fixa que o html2canvas efetivamente transforma em PDF.
      const cloneRect = clone.getBoundingClientRect();
      const scaleX = canvas.width / cloneRect.width;
      const scaleY = canvas.height / cloneRect.height;
      const toCanvasBounds = (node: Element) => {
        const rect = (node as HTMLElement).getBoundingClientRect();
        return {
          top: Math.round((rect.top - cloneRect.top) * scaleY),
          bottom: Math.round((rect.bottom - cloneRect.top) * scaleY),
          left: Math.round((rect.left - cloneRect.left) * scaleX),
          width: Math.round(rect.width * scaleX),
          height: Math.round(rect.height * scaleY),
        };
      };

      // ─── Collect cards that may not be split between PDF pages ───
      const protectedCards = clone.querySelectorAll("[data-hotel-card='true'], [data-pdf-keep-together='true']");
      const protectedPositions: Array<{ top: number; bottom: number }> = [];
      protectedCards.forEach((card) => {
        const bounds = toCanvasBounds(card);
        protectedPositions.push({ top: bounds.top, bottom: bounds.bottom });
      });
      protectedPositions.sort((a, b) => a.top - b.top);
      console.log("✓ Protected card positions:", protectedPositions.length, protectedPositions);

      // ─── Collect manual break points (data-page-break) ───
      const breakElements = clone.querySelectorAll("[data-page-break='true']");
      const manualBreakPoints: number[] = [];
      breakElements.forEach((breakElement) => {
        manualBreakPoints.push(toCanvasBounds(breakElement).top);
      });
      manualBreakPoints.sort((a, b) => a - b);
      console.log("✓ Manual break points:", manualBreakPoints.length, manualBreakPoints);

      // ─── Build page segments respecting protected boundaries ───
      const segments = buildPdfSegments(
        canvas.height,
        pageHeightPx,
        protectedPositions,
        manualBreakPoints,
      );

      console.log("✓ Segments:", segments.length, segments);

      // ─── Create PDF ───
      // Pre-compute all segment images and heights
      const segmentData: Array<{ imgData: string; widthMm: number; heightMm: number; xOffsetMm: number; scale: number }> = [];
      for (const seg of segments) {
        const segHeight = seg.end - seg.start;
        const subCanvas = document.createElement("canvas");
        subCanvas.width = canvas.width;
        subCanvas.height = segHeight;
        const ctx = subCanvas.getContext("2d");
        if (!ctx) continue;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, subCanvas.width, subCanvas.height);
        ctx.drawImage(canvas, 0, seg.start, canvas.width, segHeight, 0, 0, canvas.width, segHeight);
        const imgData = subCanvas.toDataURL("image/png");
        const rawHeightMm = (segHeight * imgWidth) / canvas.width;
        const scale = rawHeightMm > pageContentHeightMm ? pageContentHeightMm / rawHeightMm : 1;
        const widthMm = imgWidth * scale;
        const heightMm = rawHeightMm * scale;
        segmentData.push({
          imgData,
          widthMm,
          heightMm,
          xOffsetMm: (pdfWidthMm - widthMm) / 2,
          scale,
        });
      }

      // Create PDF with A4 format (210mm x 297mm) for all pages
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      // Cada trecho continuado começa sempre abaixo da margem superior. Assim,
      // a segunda página e as seguintes não ficam com conteúdo deslocado para
      // baixo ou iniciado fora da área útil do PDF.
      const pageYOffsetsMm = segmentData.map((segment, index) => {
        if (index === 0 || isItineraryPdf) return index === 0 ? 0 : continuedPageTopMarginMm;
        return continuedPageTopMarginMm;
      });

      // Add each segment as a page with A4 height
      for (let i = 0; i < segmentData.length; i++) {
        const seg = segmentData[i];
        if (i > 0) {
          pdf.addPage("a4");
        }
        pdf.addImage(seg.imgData, "PNG", seg.xOffsetMm, pageYOffsetsMm[i], seg.widthMm, seg.heightMm, undefined, "FAST");
      }

      // Add clickable links for elements with data-pdf-link
      const linkElements = clone.querySelectorAll("[data-pdf-link]");
      const totalPages = segments.length;

      linkElements.forEach((linkElement) => {
        const link = (linkElement as HTMLAnchorElement).href || (linkElement as HTMLElement).dataset.pdfLink;
        if (!link) return;

        const bounds = toCanvasBounds(linkElement);
        const yInCanvas = bounds.top;

        // Find which page this link is on
        let pageNum = 0;
        let yOffset = 0;
        for (let i = 0; i < segments.length; i++) {
          if (yInCanvas >= segments[i].start && yInCanvas < segments[i].end) {
            pageNum = i;
            yOffset = segments[i].start;
            break;
          }
        }

        if (pageNum < totalPages) {
          const segment = segmentData[pageNum];
          const xMm = (bounds.left / canvas.width) * imgWidth * segment.scale + segment.xOffsetMm;
          const yOnPage = ((yInCanvas - yOffset) / canvas.width) * imgWidth * segment.scale + pageYOffsetsMm[pageNum];
          const wMm = (bounds.width / canvas.width) * imgWidth * segment.scale;
          const hMm = (bounds.height / canvas.width) * imgWidth * segment.scale;
          pdf.setPage(pageNum + 1);
          addExternalPdfLink(pdf.link.bind(pdf), xMm, yOnPage, wMm, hMm, link);
        }
      });

      // As medições e a área clicável usam o clone. Ele só pode ser removido
      // depois de todos os cálculos de posição terem sido concluídos.
      document.body.removeChild(captureContainer);

      // Save the PDF
      pdf.save(filename);
      console.log("✓ PDF salvo com sucesso!");
      return true;
    } catch (err) {
      console.error("❌ Erro na geração do PDF:", err);
      throw new Error("Erro ao exportar PDF: " + String(err));
    }
  }, []);

  return { generatePdf };
}
