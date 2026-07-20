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
        console.log(`[PDF] HTML written to ${tempHtmlPath}`);

        // Use WeasyPrint to generate PDF
        // WeasyPrint supports modern CSS including oklch/oklab
        try {
          execSync(`weasyprint "${tempHtmlPath}" "${tempPdfPath}"`, {
            stdio: "pipe",
            timeout: 30000,
          });
          console.log(`[PDF] PDF generated at ${tempPdfPath}`);
        } catch (execError) {
          console.error(`[PDF] WeasyPrint execution failed:`, execError);
          throw new Error(`WeasyPrint failed: ${execError instanceof Error ? execError.message : String(execError)}`);
        }

        // Read the generated PDF
        const pdfBuffer = readFileSync(tempPdfPath);
        console.log(`[PDF] PDF read successfully, size: ${pdfBuffer.length} bytes`);

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
      console.error("[PDF] Generation error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : "";
      console.error("[PDF] Stack:", errorStack);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: errorMessage,
      });
    }
  });
}
