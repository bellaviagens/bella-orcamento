import { describe, expect, it } from "vitest";
import { hotelVoucherUpdates } from "./finalItineraryHotelVoucher";

const parsedVoucher = {
  hotelName: "Hotel Plaza Santiago",
  checkIn: "2026-09-10",
  checkOut: "2026-09-14",
  address: "Av. Providencia 1234, Santiago, Chile",
  neighborhood: "Providencia",
  phone: "+56 2 2345 6789",
  locatorCode: "RES-ABC123",
  guestName: "Maria da Silva",
};

describe("hotelVoucherUpdates", () => {
  it("preenche os detalhes de hospedagem encontrados no voucher", () => {
    const updates = hotelVoucherUpdates({ id: "hotel-1", day: 1, kind: "hotel", title: "Hospedagem", time: "", description: "", linkUrl: "", photoUrl: "" }, parsedVoucher);

    expect(updates).toMatchObject({
      title: "Hotel Plaza Santiago",
      hotelCheckIn: "2026-09-10",
      hotelCheckOut: "2026-09-14",
      hotelAddress: "Av. Providencia 1234, Santiago, Chile",
      hotelNeighborhood: "Providencia",
      hotelPhone: "+56 2 2345 6789",
      hotelLocator: "RES-ABC123",
      hotelGuestName: "Maria da Silva",
    });
    expect(updates.hotelMapUrl).toContain("google.com/maps/search");
  });

  it("preserva todos os dados já preenchidos pela consultora", () => {
    const updates = hotelVoucherUpdates({
      id: "hotel-1", day: 1, kind: "hotel", title: "Hotel já escolhido", time: "", description: "", linkUrl: "", photoUrl: "",
      hotelCheckIn: "2026-09-09", hotelCheckOut: "2026-09-15", hotelAddress: "Endereço digitado", hotelNeighborhood: "Bairro manual", hotelPhone: "11999990000", hotelLocator: "MANUAL", hotelGuestName: "Cliente Manual",
    }, parsedVoucher);

    expect(updates).toMatchObject({
      title: "Hotel já escolhido", hotelCheckIn: "2026-09-09", hotelCheckOut: "2026-09-15", hotelAddress: "Endereço digitado", hotelNeighborhood: "Bairro manual", hotelPhone: "11999990000", hotelLocator: "MANUAL", hotelGuestName: "Cliente Manual",
    });
  });
});
