import { useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf") => {
    const element = document.getElementById("pdf-document");
    if (!element) {
      console.error("PDF document element not found");
      return;
    }

    // Set background to white for capture
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = "#ffffff";

    // Hide external images temporarily to avoid CORS issues
    const images = element.querySelectorAll("img");
    const originalDisplays = new Map<HTMLImageElement, string>();
    images.forEach((img) => {
      if (img.src && (img.src.includes("http") || img.src.includes("//"))) {
        originalDisplays.set(img, img.style.display);
        img.style.display = "none";
      }
    });

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: false,
      });

      if (!canvas) {
        throw new Error("Canvas generation failed");
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
        console.error("toDataURL failed, trying PNG", dataUrlErr);
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
        console.warn("pdf.save() failed, using blob URL fallback", downloadErr);
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
      throw err;
    } finally {
      element.style.backgroundColor = originalBg;
      // Restore images
      originalDisplays.forEach((display, img) => {
        img.style.display = display;
      });
    }
  }, []);

  return { generatePdf };
}
