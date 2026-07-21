import { useCallback } from "react";
import html2canvas from "html2canvas";
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

      // Clone the element
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Remove ALL style attributes and classes that might contain oklch
      const removeStylesRecursive = (el: Element) => {
        // Remove style attribute completely
        el.removeAttribute("style");
        // Remove all classes
        el.removeAttribute("class");
        
        for (const child of Array.from(el.children)) {
          removeStylesRecursive(child);
        }
      };
      removeStylesRecursive(clonedElement);

      // Create a temporary container with basic inline styles only
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "1200px";
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.style.color = "#000000";
      tempContainer.style.fontFamily = "Arial, sans-serif";
      tempContainer.style.fontSize = "14px";
      tempContainer.style.lineHeight = "1.5";
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Disable ALL stylesheets
      const stylesheets = Array.from(document.styleSheets) as CSSStyleSheet[];
      const originalDisabledStates = stylesheets.map(sheet => sheet.disabled);
      
      for (const sheet of stylesheets) {
        sheet.disabled = true;
      }

      try {
        // Use html2canvas to capture the element
        const canvas = await html2canvas(clonedElement, {
          allowTaint: true,
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
      } finally {
        // Re-enable all stylesheets to their original state
        for (let i = 0; i < stylesheets.length; i++) {
          stylesheets[i].disabled = originalDisabledStates[i];
        }
        
        // Clean up temporary container
        document.body.removeChild(tempContainer);
      }
    } catch (err) {
      console.error("❌ Erro na geração do PDF:", err);
      throw new Error("Erro ao exportar PDF: " + String(err));
    }
  }, []);

  return { generatePdf };
}
