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

      // Debug: check clone dimensions
      const cloneRect = clone.getBoundingClientRect();
      console.log("🔍 Clone dimensions:", clone.offsetWidth, "x", clone.offsetHeight, "| BoundingRect:", cloneRect.width, "x", cloneRect.height);
      console.log("🔍 Container dimensions:", captureContainer.offsetWidth, "x", captureContainer.offsetHeight);

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

      // If the content is shorter than one A4 page, just use one page
      const effectivePageHeightPx = canvas.height < pageHeightPx ? canvas.height : pageHeightPx;

      // Find all elements marked with data-page-break to use as break points
      const breakElements = element.querySelectorAll("[data-page-break='true']");
      const breakPoints: number[] = [];

      // Get the element's position on the page to calculate offsets
      const elementRect = element.getBoundingClientRect();

      breakElements.forEach((el) => {
        const rect = (el as HTMLElement).getBoundingClientRect();
        const yInCanvas = (rect.top - elementRect.top) * (canvas.height / elementRect.height);
        breakPoints.push(Math.round(yInCanvas));
      });

      // Sort break points
      breakPoints.sort((a, b) => a - b);

      console.log("✓ Break points found:", breakPoints.length, breakPoints);

      // Build page segments: each segment is [startY, endY] in canvas pixels
      const segments: Array<{ start: number; end: number }> = [];

      if (breakPoints.length === 0) {
        // No break points - use fixed A4 height
        let y = 0;
        while (y < canvas.height) {
          const end = Math.min(y + effectivePageHeightPx, canvas.height);
          if (end - y > 10) {
            segments.push({ start: y, end });
          }
          y += effectivePageHeightPx;
        }
      } else {
        // Use break points to create segments
        let currentY = 0;

        for (const bp of breakPoints) {
          // If there's content before the break point, fill with A4-height pages
          while (currentY + effectivePageHeightPx < bp) {
            segments.push({ start: currentY, end: currentY + effectivePageHeightPx });
            currentY += effectivePageHeightPx;
          }
          // Add the remaining content before the break point as a page
          if (bp > currentY) {
            segments.push({ start: currentY, end: bp });
          }
          currentY = bp;
        }

        // After the last break point, fill remaining content with A4-height pages
        while (currentY < canvas.height) {
          const end = Math.min(currentY + effectivePageHeightPx, canvas.height);
          if (end - currentY > 10) {
            segments.push({ start: currentY, end });
          }
          currentY += effectivePageHeightPx;
        }
      }

      console.log("✓ Segments:", segments.length, segments);

      // Create PDF
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
        format: "a4", // Use standard A4 format
      });

      // Add each segment as a page with A4 height
      for (let i = 0; i < segmentData.length; i++) {
        const seg = segmentData[i];
        if (i > 0) {
          pdf.addPage("a4"); // Add A4 page
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
          // Adicionar link com target="_blank" para abrir em nova página
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
