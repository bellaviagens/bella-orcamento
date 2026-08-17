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
      // A sombra existe somente para destacar a prévia no navegador. Ao dividir
      // a Proposta em páginas, ela pode aparecer como uma faixa antes do conteúdo.
      if (elementId === "itinerary-document") {
        clone.style.boxShadow = "none";
        clone.style.border = "none";
        clone.style.outline = "none";
        clone.style.overflow = "visible";
      }
      // A Proposta possui conteúdo próprio e não deve ganhar área branca artificial
      // no fim da captura; os demais documentos preservam a altura A4 mínima.
      clone.style.minHeight = elementId === "itinerary-document" ? "0" : "1123px";
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
      // A Proposta precisa da mesma área de respiro em todas as páginas para que
      // o primeiro e o último pixel do segmento não fiquem no limite físico do PDF.
      // O Roteiro Final conserva sua área interna própria e o orçamento mantém a
      // margem superior já aprovada.
      const isTourProposal = elementId === "itinerary-document";
      const continuedPageTopMarginMm = isTourProposal ? 7 : elementId === "final-itinerary-document" ? 0 : 8;
      const continuedPageBottomMarginMm = isTourProposal ? 7 : 0;
      const pageContentHeightMm = pdfPageHeightMm - continuedPageTopMarginMm - continuedPageBottomMarginMm;
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

      // Na Proposta de Passeios, cada compromisso é protegido individualmente.
      // O cabeçalho de cada dia é incorporado somente ao primeiro compromisso:
      // isso permite aproveitar o restante da página com o próximo passeio, sem
      // separar título, agenda e conteúdo do primeiro bloco do dia.
      const proposalDayBounds: Array<{ top: number; bottom: number; label: string }> = [];
      if (elementId === "itinerary-document") {
        const proposalHeader = clone.querySelector<HTMLElement>("[data-pdf-proposal-header='true']");
        const proposalDays = clone.querySelectorAll<HTMLElement>("[data-proposal-day='true']");
        let firstActivityBlock: { top: number; bottom: number } | undefined;

        proposalDays.forEach((day) => {
          const firstActivity = day.querySelector<HTMLElement>("[data-proposal-activity='true']");
          if (!firstActivity) return;

          const dayBounds = toCanvasBounds(day);
          proposalDayBounds.push({
            top: dayBounds.top,
            bottom: dayBounds.bottom,
            label: day.dataset.pdfDayLabel || "Dia da viagem",
          });
          const activityBounds = toCanvasBounds(firstActivity);
          const activityBlock = protectedPositions.find(
            (block) => Math.abs(block.top - activityBounds.top) <= 2 && Math.abs(block.bottom - activityBounds.bottom) <= 2,
          );
          if (!activityBlock) return;

          activityBlock.top = dayBounds.top;
          firstActivityBlock ??= activityBlock;
        });

        // A capa só acompanha o primeiro compromisso quando o conjunto inteiro
        // realmente cabe na área útil, evitando uma página inicial parcialmente
        // preenchida seguida por um corte no começo do Dia 1.
        if (proposalHeader && firstActivityBlock) {
          const headerBounds = toCanvasBounds(proposalHeader);
          const combinedHeight = firstActivityBlock.bottom - headerBounds.top;
          if (combinedHeight <= pageHeightPx) {
            firstActivityBlock.top = headerBounds.top;
          }
        }
      }
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

      const continuationDayLabels = isTourProposal
        ? segments.map((segment, pageIndex) => {
          if (pageIndex === 0) return undefined;
          const matchingDay = proposalDayBounds.find((day) => segment.start > day.top + 2 && segment.start < day.bottom - 2);
          return matchingDay?.label;
        })
        : [];

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

      // A Proposta usa o mesmo recuo superior desde a capa até a última página.
      const pageYOffsetsMm = segmentData.map((_, index) => isTourProposal ? continuedPageTopMarginMm : index === 0 ? 0 : continuedPageTopMarginMm);

      // Add each segment as a page with A4 height
      for (let i = 0; i < segmentData.length; i++) {
        const seg = segmentData[i];
        if (i > 0) {
          pdf.addPage("a4");
        }
        pdf.addImage(seg.imgData, "PNG", seg.xOffsetMm, pageYOffsetsMm[i], seg.widthMm, seg.heightMm, undefined, "FAST");
      }

      // Quando o conteúdo de um mesmo dia continua em uma nova página, o título
      // reaparece discretamente na margem superior para manter o contexto.
      if (isTourProposal) {
        continuationDayLabels.forEach((dayLabel, pageIndex) => {
          if (!dayLabel) return;
          pdf.setPage(pageIndex + 1);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7.5);
          pdf.setTextColor(26, 46, 74);
          pdf.text(`${dayLabel} • continuação`, 7, 4.6);
        });
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

      // A numeração é aplicada após as imagens e os links para ficar idêntica
      // em todas as páginas da Proposta, dentro da margem inferior reservada.
      if (isTourProposal) {
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
          pdf.setPage(pageIndex + 1);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text(`Página ${pageIndex + 1} de ${totalPages}`, pdfWidthMm / 2, pdfPageHeightMm - 3.5, { align: "center" });
        }
      }

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
