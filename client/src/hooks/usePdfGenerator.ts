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

    // Set background to white for capture
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = "#ffffff";

    // Remove oklch colors by cloning and converting to hex
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Convert oklch colors to hex equivalents
    const convertOklchToHex = (oklchColor: string): string => {
      // Simple mapping of common oklch colors used in the app
      const oklchMap: Record<string, string> = {
        "oklch(0.184 0.077 262.1)": "#1a2e4a", // dark blue
        "oklch(0.965 0.004 262.1)": "#f8fafc", // slate-50
        "oklch(0.902 0.008 262.1)": "#f1f5f9", // slate-100
        "oklch(0.835 0.013 262.1)": "#e2e8f0", // slate-200
        "oklch(0.747 0.022 262.1)": "#cbd5e1", // slate-300
        "oklch(0.664 0.033 262.1)": "#94a3b8", // slate-400
        "oklch(0.577 0.045 262.1)": "#64748b", // slate-500
        "oklch(0.506 0.053 262.1)": "#475569", // slate-600
        "oklch(0.431 0.062 262.1)": "#334155", // slate-700
        "oklch(0.353 0.069 262.1)": "#1e293b", // slate-800
        "oklch(0.271 0.068 262.1)": "#0f172a", // slate-900
      };

      // Check if it's an oklch color
      if (oklchColor.includes("oklch")) {
        return oklchMap[oklchColor] || "#000000";
      }
      return oklchColor;
    };

    // Walk through all elements and convert oklch colors
    const walkElements = (el: Element) => {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      const borderColor = style.borderColor;

      if (bgColor && bgColor.includes("oklch")) {
        (el as HTMLElement).style.backgroundColor = convertOklchToHex(bgColor);
      }
      if (textColor && textColor.includes("oklch")) {
        (el as HTMLElement).style.color = convertOklchToHex(textColor);
      }
      if (borderColor && borderColor.includes("oklch")) {
        (el as HTMLElement).style.borderColor = convertOklchToHex(borderColor);
      }

      // Recursively process children
      for (let i = 0; i < el.children.length; i++) {
        walkElements(el.children[i]);
      }
    };

    walkElements(clonedElement);

    // Hide external images temporarily to avoid CORS issues
    const images = clonedElement.querySelectorAll("img");
    const originalDisplays = new Map<HTMLImageElement, string>();
    images.forEach((img) => {
      if (img.src && (img.src.includes("http") || img.src.includes("//"))) {
        originalDisplays.set(img, img.style.display);
        img.style.display = "none";
      }
    });

    try {
      // Create a temporary container to hold the cloned element
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

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
      element.style.backgroundColor = originalBg;
    }
  }, []);

  return { generatePdf };
}
