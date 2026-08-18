import type { TravelLibraryDraft } from "./travelLibraryEditorState";
import { EMPTY_LIBRARY_DRAFT } from "./travelLibraryEditorState";
import type { HotelVoucherData } from "./finalItineraryHotelVoucher";
import type { TravelLibraryLocation } from "./travelLibraryLocation";

function voucherNotes(voucher: HotelVoucherData) {
  return [
    voucher.address && `Endereço: ${voucher.address}`,
    voucher.checkIn && `Check-in: ${voucher.checkIn}`,
    voucher.checkOut && `Check-out: ${voucher.checkOut}`,
    voucher.locatorCode && `Localizador: ${voucher.locatorCode}`,
    voucher.guestName && `Hóspede principal: ${voucher.guestName}`,
  ].filter(Boolean).join("\n");
}

/** Preenche um novo cadastro de hotel com informações explícitas do PDF ou print anexado. */
export function hotelVoucherLibraryDraft(voucher: HotelVoucherData, location: TravelLibraryLocation, documentUrl: string, imageUrl = ""): TravelLibraryDraft {
  return {
    ...EMPTY_LIBRARY_DRAFT,
    ...location,
    category: "hotel",
    folderName: location.city ? `Hotéis ${location.city}` : "Hotéis",
    name: voucher.hotelName.trim(),
    neighborhood: voucher.neighborhood.trim(),
    phone: voucher.phone.trim(),
    imageUrl,
    documentUrl,
    notes: voucherNotes(voucher),
  };
}

/** Combina dados do voucher com um cadastro em edição, sem apagar preenchimentos já informados. */
export function mergeHotelVoucherLibraryDraft(current: TravelLibraryDraft, voucher: HotelVoucherData, location: TravelLibraryLocation, documentUrl: string, imageUrl = ""): TravelLibraryDraft {
  const extracted = hotelVoucherLibraryDraft(voucher, location, documentUrl, imageUrl);
  return {
    ...extracted,
    category: "hotel",
    destination: current.destination.trim() || extracted.destination,
    country: current.country.trim() || extracted.country,
    city: current.city.trim() || extracted.city,
    neighborhood: current.neighborhood.trim() || extracted.neighborhood,
    folderName: current.folderName.trim() || extracted.folderName,
    name: current.name.trim() || extracted.name,
    contactName: current.contactName.trim() || extracted.contactName,
    phone: current.phone.trim() || extracted.phone,
    linkUrl: current.linkUrl.trim() || extracted.linkUrl,
    imageUrl: current.imageUrl.trim() || extracted.imageUrl,
    notes: current.notes.trim() || extracted.notes,
    documentUrl,
  };
}
