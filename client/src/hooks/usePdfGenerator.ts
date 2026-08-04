import { useCallback } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf") => {
    const element = document.getElementById("pdf-document");
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

      // Clean up capture container
      document.body.removeChild(captureContainer);

      console.log("✓ Canvas gerado com sucesso", canvas.width, "x", canvas.height);

      // A4 dimensions: 210mm wide, 297mm tall
      const pdfWidthMm = 210;
      const pdfPageHeightMm = 297;
      // pixels per mm based on canvas width
      const pxPerMm = canvas.width / pdfWidthMm;
      const pageHeightPx = pdfPageHeightMm * pxPerMm; // A4 height in pixels
      const imgWidth = pdfWidthMm; // alias for readability

      // Get the element's position on the page to calculate offsets
      const elementRect = element.getBoundingClientRect();

      // ─── Collect hotel card positions in canvas pixel coordinates ───
      const hotelCards = element.querySelectorAll("[data-hotel-card='true']");
      const hotelPositions: Array<{ top: number; bottom: number }> = [];
      hotelCards.forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const topInCanvas = (rect.top - elementRect.top) * (canvas.height / elementRect.height);
        const bottomInCanvas = (rect.bottom - elementRect.top) * (canvas.height / elementRect.height);
        hotelPositions.push({
          top: Math.round(topInCanvas),
          bottom: Math.round(bottomInCanvas),
        });
      });
      hotelPositions.sort((a, b) => a.top - b.top);
      console.log("✓ Hotel positions:", hotelPositions.length, hotelPositions);

      // ─── Collect manual break points (data-page-break) ───
      const breakElements = element.querySelectorAll("[data-page-break='true']");
      const manualBreakPoints: number[] = [];
      breakElements.forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const yInCanvas = (rect.top - elementRect.top) * (canvas.height / elementRect.height);
        manualBreakPoints.push(Math.round(yInCanvas));
      });
      manualBreakPoints.sort((a, b) => a - b);
      console.log("✓ Manual break points:", manualBreakPoints.length, manualBreakPoints);

      // ─── Build page segments respecting hotel boundaries ───
      // A segment is [startY, endY] in canvas pixels. Each segment becomes one PDF page.
      const segments: Array<{ start: number; end: number }> = [];
      let currentY = 0;

      while (currentY < canvas.height) {
        const pageEnd = Math.min(currentY + pageHeightPx, canvas.height);

        // Check if any hotel card would be cut by this page boundary
        let adjustedEnd = pageEnd;
        for (const hp of hotelPositions) {
          // If the hotel starts on this page but ends on the next page → cut!
          if (hp.top >= currentY && hp.top < pageEnd && hp.bottom > pageEnd) {
            // End the page just before this hotel starts
            adjustedEnd = hp.top;
            break;
          }
        }

        // Also respect manual break points: if a manual break falls within this page, end there
        for (const bp of manualBreakPoints) {
          if (bp > currentY && bp < adjustedEnd) {
            adjustedEnd = bp;
            break;
          }
        }

        if (adjustedEnd - currentY > 10) {
          segments.push({ start: currentY, end: adjustedEnd });
        }
        currentY = adjustedEnd;
      }

      console.log("✓ Segments:", segments.length, segments);

      // ─── Create PDF ───
      // Pre-compute all segment images and heights
      const segmentData: Array<{ imgData: string; widthMm: number; heightMm: number }> = [];
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
        const segHeightMm = (segHeight * imgWidth) / canvas.width;
        segmentData.push({ imgData, widthMm: imgWidth, heightMm: segHeightMm });
      }

      // Create PDF with A4 format (210mm x 297mm) for all pages
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      // Add each segment as a page with A4 height
      for (let i = 0; i < segmentData.length; i++) {
        const seg = segmentData[i];
        if (i > 0) {
          pdf.addPage("a4");
        }
        // Scale image to fit A4 width (210mm) and maintain aspect ratio
        const scaledHeight = (pdfPageHeightMm * seg.heightMm) / pdfPageHeightMm;
        pdf.addImage(seg.imgData, "PNG", 0, 0, pdfWidthMm, Math.min(scaledHeight, pdfPageHeightMm), undefined, "FAST");
      }

      // Add clickable links for elements with data-pdf-link
      const linkElements = element.querySelectorAll("[data-pdf-link]");
      const totalPages = segments.length;

      linkElements.forEach((el) => {
        const link = (el as HTMLElement).dataset.pdfLink;
        if (!link) return;

        const rect = (el as HTMLElement).getBoundingClientRect();
        const yInCanvas = (rect.top - elementRect.top) * (canvas.height / elementRect.height);
        const xInCanvas = (rect.left - elementRect.left) * (canvas.width / elementRect.width);
        const wInCanvas = rect.width * (canvas.width / elementRect.width);
        const hInCanvas = rect.height * (canvas.height / elementRect.height);

        // Convert to mm
        const xMm = (xInCanvas / canvas.width) * imgWidth;
        const wMm = (wInCanvas / canvas.width) * imgWidth;
        const yMmFromTop = (yInCanvas / canvas.height) * ((canvas.height * imgWidth) / canvas.width);
        const hMm = (hInCanvas / canvas.height) * ((canvas.height * imgWidth) / canvas.width);

        // Find which page this link is on
        let pageNum = 0;
        let yOffset = 0;
        for (let i = 0; i < segments.length; i++) {
          if (yInCanvas >= segments[i].start && yInCanvas < segments[i].end) {
            pageNum = i;
            yOffset = (segments[i].start / canvas.height) * ((canvas.height * imgWidth) / canvas.width);
            break;
          }
        }

        const yOnPage = yMmFromTop - yOffset;

        if (pageNum < totalPages) {
          pdf.setPage(pageNum + 1);
          pdf.link(xMm, yOnPage, wMm, hMm, { url: link, pageNumber: undefined });
        }
      });

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
