import type { FinalItineraryEvent } from "@shared/budgetTypes";

export type HotelVoucherData = {
  hotelName: string;
  checkIn: string;
  checkOut: string;
  address: string;
  phone: string;
  locatorCode: string;
  guestName: string;
};

function keepOnlyWhenEmpty(existingValue: string | undefined, parsedValue: string) {
  return existingValue?.trim() ? existingValue : parsedValue.trim();
}

function shouldReplaceGenericHotelTitle(title: string) {
  return !title.trim() || /^(hotel|hospedagem|sua hospedagem)$/i.test(title.trim());
}

/**
 * Converte os dados encontrados no voucher em atualizações do evento.
 * Dados já digitados pela consultora sempre têm prioridade.
 */
export function hotelVoucherUpdates(event: FinalItineraryEvent, parsed: HotelVoucherData): Partial<FinalItineraryEvent> {
  const hotelAddress = keepOnlyWhenEmpty(event.hotelAddress, parsed.address);
  const hotelCheckIn = keepOnlyWhenEmpty(event.hotelCheckIn, parsed.checkIn);
  const hotelCheckOut = keepOnlyWhenEmpty(event.hotelCheckOut, parsed.checkOut);

  return {
    title: shouldReplaceGenericHotelTitle(event.title) && parsed.hotelName.trim() ? parsed.hotelName.trim() : event.title,
    hotelAddress,
    hotelCheckIn,
    hotelCheckOut,
    hotelPhone: keepOnlyWhenEmpty(event.hotelPhone, parsed.phone),
    hotelLocator: keepOnlyWhenEmpty(event.hotelLocator, parsed.locatorCode),
    hotelGuestName: keepOnlyWhenEmpty(event.hotelGuestName, parsed.guestName),
    hotelMapUrl: event.hotelMapUrl?.trim() || (hotelAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotelAddress)}` : ""),
  };
}
