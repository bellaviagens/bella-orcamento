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

      // Use html2canvas-pro which supports oklch/oklab colors natively
      const canvas = await html2canvas(element, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        imageTimeout: 0,
      });

      console.log("✓ Canvas gerado com sucesso");

      // Get canvas dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF, handling multiple pages if needed
      const imgData = canvas.toDataURL("image/png");
      while (heightLeft >= 0) {
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position = heightLeft - imgHeight;
        }
      }

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
