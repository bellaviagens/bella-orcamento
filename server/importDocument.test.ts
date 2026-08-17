import { describe, expect, it } from "vitest";
import { buildImportDocumentContent, isPdfDataUrl } from "./importDocument";

describe("importDocument", () => {
  it("identifica data URLs de PDF", () => {
    expect(isPdfDataUrl("data:application/pdf;base64,JVBERi0xLjQ=")).toBe(true);
    expect(isPdfDataUrl("data:image/png;base64,iVBORw0KGgo=")).toBe(false);
  });

  it("envia PDF como arquivo para a leitura assistida", () => {
    expect(buildImportDocumentContent("data:application/pdf;base64,JVBERi0xLjQ=")).toEqual({
      type: "file_url",
      file_url: {
        url: "data:application/pdf;base64,JVBERi0xLjQ=",
        mime_type: "application/pdf",
      },
    });
  });

  it("mantém imagens no formato de visão já utilizado", () => {
    expect(buildImportDocumentContent("data:image/webp;base64,UklGRg==")).toEqual({
      type: "image_url",
      image_url: {
        url: "data:image/webp;base64,UklGRg==",
        detail: "high",
      },
    });
  });
});
