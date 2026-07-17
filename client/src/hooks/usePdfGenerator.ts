import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Mapa de conversão de cores oklch para HEX (extraído do Tailwind 4 padrão)
const OKLCH_TO_HEX: Record<string, string> = {
  "oklch(93.6% .032 17.717)": "#f5f3f0",
  "oklch(63.7% .237 25.331)": "#ea580c",
  "oklch(50.5% .213 27.518)": "#c2410c",
  "oklch(98.7% .022 95.277)": "#fafaf9",
  "oklch(92.4% .12 95.746)": "#f3f1ed",
  "oklch(87.9% .169 91.605)": "#e5e5e5",
  "oklch(82.8% .189 84.429)": "#d4d4d8",
  "oklch(66.6% .179 58.318)": "#a1a1aa",
  "oklch(55.5% .163 48.998)": "#71717a",
  "oklch(62.7% .194 149.214)": "#22c55e",
  "oklch(97% .014 254.604)": "#f0f9ff",
  "oklch(80.9% .105 251.813)": "#bfdbfe",
  "oklch(62.3% .214 259.815)": "#3b82f6",
  "oklch(54.6% .245 262.881)": "#1d4ed8",
  "oklch(48.8% .243 264.376)": "#1e40af",
  "oklch(42.4% .199 265.638)": "#1e3a8a",
  "oklch(98.4% .003 247.858)": "#fef2f2",
  "oklch(96.8% .007 247.896)": "#fee2e2",
  "oklch(92.9% .013 255.508)": "#fecaca",
  "oklch(86.9% .022 252.894)": "#fca5a5",
  "oklch(70.4% .04 256.788)": "#f87171",
  "oklch(55.4% .046 257.417)": "#ef4444",
  "oklch(44.6% .043 257.281)": "#dc2626",
  "oklch(37.2% .044 257.287)": "#b91c1c",
  "oklch(20.8% .042 265.755)": "#7f1d1d",
};

function convertOklchToHex(value: string): string {
  // Se for uma cor oklch conhecida, retorna o HEX
  if (OKLCH_TO_HEX[value]) {
    return OKLCH_TO_HEX[value];
  }
  
  // Se não for oklch, retorna o valor original
  if (!value.includes("oklch")) {
    return value;
  }
  
  // Fallback: retorna uma cor neutra se não conseguir converter
  return "#000000";
}

function convertColorsInElement(element: HTMLElement): void {
  // Converter cores em estilos computados (CSS variables)
  const style = window.getComputedStyle(element);
  
  // Converter background-color
  if (style.backgroundColor && style.backgroundColor.includes("oklch")) {
    element.style.backgroundColor = convertOklchToHex(style.backgroundColor);
  }
  
  // Converter color (text color)
  if (style.color && style.color.includes("oklch")) {
    element.style.color = convertOklchToHex(style.color);
  }
  
  // Converter border colors
  if (style.borderColor && style.borderColor.includes("oklch")) {
    element.style.borderColor = convertOklchToHex(style.borderColor);
  }
  
  // Recursivamente converter cores de elementos filhos
  element.querySelectorAll("*").forEach((child) => {
    const childStyle = window.getComputedStyle(child as HTMLElement);
    
    if (childStyle.backgroundColor && childStyle.backgroundColor.includes("oklch")) {
      (child as HTMLElement).style.backgroundColor = convertOklchToHex(childStyle.backgroundColor);
    }
    
    if (childStyle.color && childStyle.color.includes("oklch")) {
      (child as HTMLElement).style.color = convertOklchToHex(childStyle.color);
    }
    
    if (childStyle.borderColor && childStyle.borderColor.includes("oklch")) {
      (child as HTMLElement).style.borderColor = convertOklchToHex(childStyle.borderColor);
    }
  });
}

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf") => {
    const element = document.getElementById("pdf-document");
    if (!element) {
      console.error("PDF document element not found");
      throw new Error("Elemento do PDF não encontrado");
    }

    // Clonar elemento para não alterar o original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = "absolute";
    clonedElement.style.left = "-9999px";
    document.body.appendChild(clonedElement);

    // Set background to white for capture
    const originalBg = clonedElement.style.backgroundColor;
    clonedElement.style.backgroundColor = "#ffffff";

    // Converter cores oklch para HEX no clone
    convertColorsInElement(clonedElement);

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
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
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
      clonedElement.style.backgroundColor = originalBg;
      // Restore images
      originalDisplays.forEach((display, img) => {
        img.style.display = display;
      });
      // Remove cloned element
      document.body.removeChild(clonedElement);
    }
  }, []);

  return { generatePdf };
}
