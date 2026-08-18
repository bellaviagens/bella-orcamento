import { describe, expect, it } from "vitest";
import { EMPTY_LIBRARY_DRAFT } from "./travelLibraryEditorState";
import { mergeTravelServiceDocumentDraft, travelServiceDocumentDraft } from "./travelServiceDocumentDraft";

const parsedTransfer = { name: "Transfer Andes", description: "Traslado privativo aeroporto-hotel.", address: "Aeroporto de Santiago", neighborhood: "Pudahuel", phone: "+56 9 1111-2222", website: "https://transfer.example.com", priceNote: "R$ 320 por veículo", contactName: "Andes Transfers", responsibleName: "Carlos Silva", whatsapp: "+56 9 1111-2222" };

describe("travelServiceDocumentDraft", () => {
  it("preenche um transfer com os dados explicitamente lidos no documento", () => {
    const draft = travelServiceDocumentDraft("transfer", parsedTransfer, { destination: "Santiago, Chile", city: "Santiago", country: "Chile" }, "/manus-storage/transfer.pdf");

    expect(draft).toMatchObject({ category: "transfer", folderName: "Transfers Santiago", name: "Transfer Andes", neighborhood: "Pudahuel", responsibleName: "Carlos Silva", documentUrl: "/manus-storage/transfer.pdf" });
    expect(draft.notes).toContain("Valor: R$ 320 por veículo");
  });

  it("preserva dados preenchidos manualmente ao importar um print de passeio", () => {
    const draft = mergeTravelServiceDocumentDraft({ ...EMPTY_LIBRARY_DRAFT, category: "tour", name: "Nome manual", linkUrl: "https://manual.example.com", notes: "Observação manual" }, "tour", { ...parsedTransfer, name: "Passeio Valle Nevado", website: "https://passeio.example.com" }, { destination: "Santiago, Chile", city: "Santiago", country: "Chile" }, "/manus-storage/passeio.png", "/manus-storage/passeio.png");

    expect(draft.category).toBe("tour");
    expect(draft.name).toBe("Nome manual");
    expect(draft.linkUrl).toBe("https://manual.example.com");
    expect(draft.notes).toBe("Observação manual");
    expect(draft.documentUrl).toBe("/manus-storage/passeio.png");
  });
});
