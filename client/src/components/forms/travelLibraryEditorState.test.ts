import { describe, expect, it } from "vitest";
import { libraryItemToDraft } from "./travelLibraryEditorState";

describe("libraryItemToDraft", () => {
  it("preenche o editor com os dados de um item salvo, inclusive voucher e contato", () => {
    expect(libraryItemToDraft({
      category: "hotel",
      folderName: "Hotéis centro",
      name: "Hotel Plaza",
      destination: "Santiago",
      country: "Chile",
      city: "Santiago",
      neighborhood: "Las Condes",
      contactName: "Recepção",
      phone: "+56 2 1234 5678",
      documentUrl: "/manus-storage/voucher.pdf",
      notes: "Check-in às 15h",
    })).toMatchObject({
      category: "hotel",
      name: "Hotel Plaza",
      country: "Chile",
      neighborhood: "Las Condes",
      documentUrl: "/manus-storage/voucher.pdf",
      notes: "Check-in às 15h",
    });
  });

  it("converte campos nulos em campos vazios editáveis", () => {
    const draft = libraryItemToDraft({ category: "transfer", folderName: "Transfers", name: "Andes Transfer", destination: null, country: null, city: null });
    expect(draft.destination).toBe("");
    expect(draft.phone).toBe("");
    expect(draft.documentUrl).toBe("");
  });
});
