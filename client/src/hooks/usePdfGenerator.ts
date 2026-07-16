import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf") => {
    const element = document.getElementById("pdf-document");
    if (!element) {
      console.error("PDF document element not found");
      throw new Error("Elemento do PDF não encontrado");
    }

    // Create a deep clone of the element
    const clonedElement = element.cloneNode(true) as HTMLElement;

    // Sanitize all elements to remove oklch colors
    const sanitizeElement = (el: Element) => {
      // Remove style attribute entirely to avoid oklch parsing
      el.removeAttribute("style");

      // Walk through all children
      for (let i = 0; i < el.children.length; i++) {
        sanitizeElement(el.children[i]);
      }
    };

    sanitizeElement(clonedElement);

    // Create a temporary container
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = "1280px"; // Match typical PDF width
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    try {
      // Capture canvas with sanitized element
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        imageTimeout: 10000,
      });

      if (!canvas) {
        throw new Error("Falha ao gerar canvas do PDF");
      }

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      // Convert canvas to image
      let imgData: string;
      try {
        imgData = canvas.toDataURL("image/jpeg", 0.95);
      } catch (err) {
        console.warn("JPEG conversion failed, trying PNG", err);
        imgData = canvas.toDataURL("image/png");
      }

      // Add pages to PDF
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      try {
        pdf.save(filename);
      } catch (err) {
        // Fallback to blob URL
        console.warn("pdf.save() failed, using blob URL fallback", err);
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      return true;
    } catch (err) {
      console.error("PDF generation error:", err);
      throw new Error("Erro ao exportar PDF: " + String(err));
    } finally {
      // Clean up temporary container
      document.body.removeChild(tempContainer);
    }
  }, []);

  return { generatePdf };
}
