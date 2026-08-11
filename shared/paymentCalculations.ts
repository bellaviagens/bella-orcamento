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

export interface InstallmentWithDownpayment {
  downpaymentAmount: number;
  remainingBalance: number;
  remainingInstallments: number;
  installmentValue: number;
}

export function calculateInstallmentWithDownpayment(
  total: number,
  installments: number,
  downpaymentAmount = 0,
): InstallmentWithDownpayment {
  const safeTotal = Math.max(0, total);
  const safeDownpayment = Math.min(Math.max(0, downpaymentAmount), safeTotal);
  const safeInstallments = Math.max(1, Math.floor(installments) || 1);
  const remainingBalance = safeTotal - safeDownpayment;
  const remainingInstallments = safeDownpayment > 0
    ? Math.max(1, safeInstallments - 1)
    : safeInstallments;

  return {
    downpaymentAmount: safeDownpayment,
    remainingBalance,
    remainingInstallments,
    installmentValue: remainingBalance / remainingInstallments,
  };
}
