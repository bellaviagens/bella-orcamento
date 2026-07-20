import { useCallback } from "react";

export function usePdfGenerator() {
  const generatePdf = useCallback(async (filename: string = "orcamento-bella-viagens.pdf") => {
    const element = document.getElementById("pdf-document");
    if (!element) {
      console.error("PDF document element not found");
      throw new Error("Elemento do PDF não encontrado");
    }

    try {
      // Clone the element
      const clonedElement = element.cloneNode(true) as HTMLElement;

      // Create a complete HTML document with all stylesheets
      const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orçamento - Bella Viagens</title>
  <style>
    ${Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          // Cross-origin stylesheets can't be accessed
          return "";
        }
      })
      .join("\n")}
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;

      console.log("✓ Enviando HTML para servidor para gerar PDF");

      // Send HTML to server for PDF generation
      const response = await fetch("/api/pdf/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: htmlContent,
          filename: filename,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar PDF no servidor");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("✓ PDF gerado com sucesso!");
      return true;
    } catch (err) {
      console.error("Erro na geração do PDF:", err);
      throw new Error("Erro ao exportar PDF: " + String(err));
    }
  }, []);

  return { generatePdf };
}
