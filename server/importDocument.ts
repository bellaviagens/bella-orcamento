import type { FileContent, ImageContent } from "./_core/llm";

export type ImportDocumentContent = FileContent | ImageContent;

export function isPdfDataUrl(value: string): boolean {
  return /^data:application\/pdf(?:;[^,]+)?,/i.test(value);
}

export function buildImportDocumentContent(dataUrl: string): ImportDocumentContent {
  if (isPdfDataUrl(dataUrl)) {
    return {
      type: "file_url",
      file_url: {
        url: dataUrl,
        mime_type: "application/pdf",
      },
    };
  }

  return {
    type: "image_url",
    image_url: {
      url: dataUrl,
      detail: "high",
    },
  };
}
