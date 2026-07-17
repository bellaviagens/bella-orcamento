import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function removeOklabOklchFromStylesheets(): void {
  // Remove todas as regras CSS que contêm oklab ou oklch
  const stylesheets = document.styleSheets;
  
  for (let i = 0; i < stylesheets.length; i++) {
    try {
      const sheet = stylesheets[i] as CSSStyleSheet;
      const rules = sheet.cssRules || sheet.rules;
      
      // Iterar de trás para frente para evitar problemas de índice
      for (let j = rules.length - 1; j >= 0; j--) {
        const rule = rules[j];
        
        // Verificar se é uma regra de estilo
        if (rule instanceof CSSStyleRule) {
          const style = rule.style.cssText;
          if (style.includes("oklab") || style.includes("oklch")) {
            // Remover a regra
            sheet.deleteRule(j);
          }
        }
        // Verificar se é uma media query ou outra regra de grupo
        else if (rule instanceof CSSGroupingRule) {
          const groupRules = rule.cssRules || [];
          for (let k = groupRules.length - 1; k >= 0; k--) {
            const groupRule = groupRules[k];
            if (groupRule instanceof CSSStyleRule) {
              const style = groupRule.style.cssText;
              if (style.includes("oklab") || style.includes("oklch")) {
                rule.deleteRule(k);
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignorar erros de CORS ou acesso negado
      console.warn("Não foi possível acessar stylesheet:", e);
    }
  }
}

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf") => {
    const element = document.getElementById("pdf-document");
    if (!element) {
      console.error("PDF document element not found");
      throw new Error("Elemento do PDF não encontrado");
    }

    // Remover regras CSS com oklab/oklch antes de clonar
    removeOklabOklchFromStylesheets();

    // Clonar elemento para não alterar o original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = "absolute";
    clonedElement.style.left = "-9999px";
    document.body.appendChild(clonedElement);

    // Set background to white for capture
    const originalBg = clonedElement.style.backgroundColor;
    clonedElement.style.backgroundColor = "#ffffff";

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
