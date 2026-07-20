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
      // Debug: Scan all elements for oklch/oklab in computed styles
      const allElements = element.querySelectorAll("*");
      const problematicElements: Array<{
        element: string;
        tag: string;
        id: string;
        classes: string;
        property: string;
        value: string;
      }> = [];

      allElements.forEach((el) => {
        const computedStyle = window.getComputedStyle(el);
        
        // Check all CSS properties
        for (let i = 0; i < computedStyle.length; i++) {
          const propName = computedStyle[i];
          const propValue = computedStyle.getPropertyValue(propName);
          
          if (propValue && (propValue.includes("oklch") || propValue.includes("oklab") || propValue.includes("color-mix"))) {
            problematicElements.push({
              element: el.outerHTML.substring(0, 100),
              tag: el.tagName,
              id: (el as HTMLElement).id || "N/A",
              classes: (el as HTMLElement).className || "N/A",
              property: propName,
              value: propValue,
            });
            
            console.warn(`Found oklch/oklab in ${el.tagName}#${(el as HTMLElement).id}.${(el as HTMLElement).className}:`, propName, "=", propValue);
          }
        }
      });

      if (problematicElements.length > 0) {
        console.error("PROBLEMATIC ELEMENTS FOUND:", problematicElements);
        throw new Error(`Encontrados ${problematicElements.length} elementos com oklch/oklab: ${JSON.stringify(problematicElements)}`);
      }

      console.log("✓ Nenhum elemento com oklch/oklab encontrado");

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Create a temporary container
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = element.offsetWidth + "px";
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Override all computed colors to HEX values
      const allClonedElements = clonedElement.querySelectorAll("*");
      allClonedElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlEl);
        
        // Get computed color values
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        const borderColor = computedStyle.borderColor;
        
        // Apply inline styles to override any oklch
        if (color && color !== "rgba(0, 0, 0, 0)") {
          htmlEl.style.color = color;
        }
        if (backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)") {
          htmlEl.style.backgroundColor = backgroundColor;
        }
        if (borderColor && borderColor !== "rgba(0, 0, 0, 0)") {
          htmlEl.style.borderColor = borderColor;
        }
      });

      // Capture the cloned element
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

      // Trigger download
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
      return true;
    } catch (err) {
      console.error("Erro na geração do PDF:", err);
      throw new Error("Erro ao exportar PDF: " + String(err));
    } finally {
      // Remove temporary container
      const tempContainer = document.querySelector("div[style*='left: -9999px']");
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
    }
  }, []);

  return { generatePdf };
}
