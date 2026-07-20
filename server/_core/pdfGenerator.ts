import { Express } from "express";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { randomBytes } from "crypto";
import path from "path";

export function registerPdfRoutes(app: Express) {
  app.post("/api/pdf/generate", (req, res) => {
    try {
      const { html, filename = "orcamento-bella-viagens.pdf" } = req.body;

      if (!html || typeof html !== "string") {
        return res.status(400).json({ error: "HTML content is required" });
      }

      // Create a temporary HTML file
      const tempId = randomBytes(8).toString("hex");
      const tempHtmlPath = path.join("/tmp", `pdf-${tempId}.html`);
      const tempPdfPath = path.join("/tmp", `pdf-${tempId}.pdf`);

      try {
        // Write HTML to temporary file
        writeFileSync(tempHtmlPath, html, "utf-8");

        // Use WeasyPrint to generate PDF
        // WeasyPrint supports modern CSS including oklch/oklab
        execSync(`weasyprint "${tempHtmlPath}" "${tempPdfPath}"`, {
          stdio: "pipe",
          timeout: 30000,
        });

        // Read the generated PDF
        const pdfBuffer = readFileSync(tempPdfPath);

        // Send PDF to client
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
      } finally {
        // Cleanup temporary files
        try {
          unlinkSync(tempHtmlPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        try {
          unlinkSync(tempPdfPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
