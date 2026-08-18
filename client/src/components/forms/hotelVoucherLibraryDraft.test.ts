import { describe, expect, it } from "vitest";
import { hotelVoucherLibraryDraft, mergeHotelVoucherLibraryDraft } from "./hotelVoucherLibraryDraft";
import { EMPTY_LIBRARY_DRAFT } from "./travelLibraryEditorState";

describe("hotelVoucherLibraryDraft", () => {
  it("preenche um novo hotel de Biblioteca com os dados explicitamente lidos no voucher", () => {
    const draft = hotelVoucherLibraryDraft({ hotelName: "Hotel Plaza", checkIn: "2026-09-10", checkOut: "2026-09-14", address: "Rua Central 10, Providencia, Santiago, Chile", neighborhood: "Providencia", phone: "+56 2 2222 2222", locatorCode: "ABC123", guestName: "Maria Silva" }, { destination: "Santiago, Chile", city: "Santiago", country: "Chile" }, "/manus-storage/voucher.pdf");

    expect(draft).toMatchObject({ category: "hotel", folderName: "Hotéis Santiago", name: "Hotel Plaza", neighborhood: "Providencia", phone: "+56 2 2222 2222", documentUrl: "/manus-storage/voucher.pdf" });
    expect(draft.notes).toContain("Localizador: ABC123");
  });

  it("preserva dados preenchidos manualmente ao importar um voucher", () => {
    const draft = mergeHotelVoucherLibraryDraft({ ...EMPTY_LIBRARY_DRAFT, category: "hotel", name: "Nome manual", neighborhood: "Bairro manual", notes: "Observação manual" }, { hotelName: "Hotel Plaza", checkIn: "", checkOut: "", address: "", neighborhood: "Providencia", phone: "", locatorCode: "", guestName: "" }, { destination: "Santiago, Chile", city: "Santiago", country: "Chile" }, "/manus-storage/voucher.pdf");

    expect(draft.name).toBe("Nome manual");
    expect(draft.neighborhood).toBe("Bairro manual");
    expect(draft.notes).toBe("Observação manual");
    expect(draft.documentUrl).toBe("/manus-storage/voucher.pdf");
  });
});
