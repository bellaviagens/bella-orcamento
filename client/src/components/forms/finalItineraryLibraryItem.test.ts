import { describe, expect, it } from "vitest";
import { finalItineraryEventToLibraryInput } from "./finalItineraryLibraryItem";

describe("finalItineraryEventToLibraryInput", () => {
  it("leva voucher, foto e dados extraídos do hotel para a Biblioteca", () => {
    const input = finalItineraryEventToLibraryInput({
      id: "hotel-1", day: 1, kind: "hotel", title: "Hotel Plaza", time: "", description: "Café incluso", linkUrl: "", photoUrl: "/manus-storage/hotel.jpg",
      hotelAddress: "Av. Providencia 100", hotelCheckIn: "2026-09-10", hotelCheckOut: "2026-09-14", hotelPhone: "+56 2 1234", hotelLocator: "ABC123", hotelGuestName: "Maria Silva",
      attachments: [{ id: "voucher-1", name: "voucher.pdf", url: "/manus-storage/voucher.pdf", contentType: "application/pdf", size: 200 }],
    }, "Santiago");

    expect(input).toMatchObject({ category: "hotel", folderName: "Hotéis", destination: "Santiago", phone: "+56 2 1234", imageUrl: "/manus-storage/hotel.jpg", documentUrl: "/manus-storage/voucher.pdf" });
    expect(input?.notes).toContain("Localizador: ABC123");
    expect(input?.notes).toContain("Hóspede principal: Maria Silva");
  });

  it("prepara transfer para edição posterior na Biblioteca", () => {
    const input = finalItineraryEventToLibraryInput({ id: "transfer-1", day: 1, kind: "transfer", title: "Andes Transfer", time: "14:00", description: "Motorista aguarda no desembarque", linkUrl: "https://wa.me/56900000000", photoUrl: "" }, "Santiago");
    expect(input).toMatchObject({ category: "transfer", folderName: "Transfers", name: "Andes Transfer", responsibleName: "Andes Transfer", linkUrl: "https://wa.me/56900000000" });
  });
});
