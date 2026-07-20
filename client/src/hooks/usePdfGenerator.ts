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

    try {
      // Step 1: Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Step 2: Create a temporary container
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = element.offsetWidth + "px";
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Step 3: Get all elements and apply computed styles as inline styles
      // This ensures html2canvas only sees RGB/HEX colors, not oklch/oklab
      const allElements = clonedElement.querySelectorAll("*");
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlEl);
        
        // Copy ALL computed styles to inline styles to bypass stylesheets
        // This is the key: html2canvas will use inline styles, not CSS rules
        for (let i = 0; i < computedStyle.length; i++) {
          const propName = computedStyle[i];
          const propValue = computedStyle.getPropertyValue(propName);
          
          // Skip if it contains oklch/oklab/color-mix
          if (propValue && (propValue.includes("oklch") || propValue.includes("oklab") || propValue.includes("color-mix"))) {
            // Replace with a safe fallback
            if (propName.includes("color") || propName.includes("background")) {
              htmlEl.style.setProperty(propName, "rgb(0, 0, 0)", "important");
            }
          } else if (propValue) {
            // Apply the computed style as inline
            try {
              htmlEl.style.setProperty(propName, propValue, "important");
            } catch (e) {
              // Some properties can't be set, that's OK
            }
          }
        }
        
        // Force outline to none
        htmlEl.style.outline = "none";
        htmlEl.style.outlineColor = "transparent";
      });

      console.log("✓ Applied all computed styles as inline styles");

      // Step 4: Remove all stylesheets to prevent html2canvas from parsing them
      // Store references to re-enable later
      const disabledSheets: CSSStyleSheet[] = [];
      for (let i = document.styleSheets.length - 1; i >= 0; i--) {
        const sheet = document.styleSheets[i];
        try {
          sheet.disabled = true;
          disabledSheets.push(sheet);
        } catch (e) {
          // Some sheets can't be disabled (cross-origin), that's OK
        }
      }
      console.log(`Disabled ${disabledSheets.length} stylesheets`);

      // Step 5: Capture the cloned element with html2canvas
      // With all styles as inline and no stylesheets, html2canvas should only see RGB/HEX
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: false,
      });

      if (!canvas) {
        throw new Error("Falha ao gerar canvas do PDF");
      }

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      let imgData: string;
      try {
        imgData = canvas.toDataURL("image/jpeg", 0.95);
      } catch (dataUrlErr) {
        console.error("toDataURL JPEG falhou, tentando PNG", dataUrlErr);
        imgData = canvas.toDataURL("image/png");
      }

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Step 6: Trigger download
      try {
        pdf.save(filename);
      } catch (downloadErr) {
        // Fallback: use blob URL if pdf.save() fails
        console.warn("pdf.save() falhou, usando blob URL", downloadErr);
        try {
          const blob = pdf.output("blob");
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (blobErr) {
          console.error("Blob fallback também falhou", blobErr);
          throw new Error("Erro ao exportar PDF: " + String(blobErr));
        }
      }
      
      console.log("✓ PDF gerado com sucesso!");
      return true;
    } catch (err) {
      console.error("Erro na geração do PDF:", err);
      throw new Error("Erro ao exportar PDF: " + String(err));
    } finally {
      // Step 7: Cleanup - remove temporary container and re-enable stylesheets
      const tempContainer = document.querySelector("div[style*='left: -9999px']");
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }

      // Re-enable all disabled stylesheets
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        if (sheet.disabled) {
          try {
            sheet.disabled = false;
          } catch (e) {
            // Ignore errors
          }
        }
      }
    }
  }, []);

  return { generatePdf };
}
