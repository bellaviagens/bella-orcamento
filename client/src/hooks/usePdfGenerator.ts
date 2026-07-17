import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function removeOklabOklchFromElement(element: HTMLElement): void {
  // Remover atributos style que contenham oklab/oklch
  const allElements = element.querySelectorAll("*");
  
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const style = htmlEl.getAttribute("style");
    
    if (style && (style.includes("oklab") || style.includes("oklch"))) {
      // Remover o atributo style se contiver oklab/oklch
      htmlEl.removeAttribute("style");
    }
  });
  
  // Também remover do elemento raiz
  const rootStyle = element.getAttribute("style");
  if (rootStyle && (rootStyle.includes("oklab") || rootStyle.includes("oklch"))) {
    element.removeAttribute("style");
  }
}

function createCleanStylesheet(): HTMLStyleElement {
  // Criar um novo stylesheet que copia apenas as regras sem oklab/oklch
  const style = document.createElement("style");
  let cssText = "";
  
  const stylesheets = document.styleSheets;
  
  for (let i = 0; i < stylesheets.length; i++) {
    try {
      const sheet = stylesheets[i] as CSSStyleSheet;
      const rules = sheet.cssRules || sheet.rules;
      
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        
        if (rule instanceof CSSStyleRule) {
          const cssRule = rule.cssText;
          if (!cssRule.includes("oklab") && !cssRule.includes("oklch")) {
            cssText += cssRule + "\n";
          }
        }
      }
    } catch (e) {
      // Ignorar erros de CORS ou acesso negado
    }
  }
  
  style.textContent = cssText;
  return style;
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
    clonedElement.style.top = "-9999px";
    document.body.appendChild(clonedElement);

    // Criar um container para o clone com estilos limpos
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.appendChild(clonedElement);
    document.body.appendChild(container);

    // Adicionar stylesheet limpo ao container
    const cleanStyle = createCleanStylesheet();
    container.appendChild(cleanStyle);

    // Set background to white for capture
    const originalBg = clonedElement.style.backgroundColor;
    clonedElement.style.backgroundColor = "#ffffff";

    // Remover atributos style com oklab/oklch do clone
    removeOklabOklchFromElement(clonedElement);

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
      // Remove container com clone
      document.body.removeChild(container);
    }
  }, []);

  return { generatePdf };
}
