export function calculateCombinedTotal(
  flightPricePerPerson: number,
  passengers: number,
  hotelTotal: number,
): number {
  return (flightPricePerPerson * passengers) + hotelTotal;
}

export interface HotelTotalInput {
  totalPrice: number;
  priceMode?: "total" | "daily";
  dailyPrice?: number;
  nights?: number;
}

export function calculateEffectiveHotelTotal(hotel: HotelTotalInput): number {
  return hotel.priceMode === "daily" && hotel.dailyPrice && hotel.nights
    ? hotel.dailyPrice * hotel.nights
    : hotel.totalPrice;
}

export function calculateCombinedInstallmentValue(
  flightPricePerPerson: number,
  passengers: number,
  hotelTotal: number,
  installments: number,
): number {
  const combinedTotal = calculateCombinedTotal(flightPricePerPerson, passengers, hotelTotal);
  return installments > 0 ? combinedTotal / installments : combinedTotal;
}
