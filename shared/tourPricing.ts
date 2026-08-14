import type { Tour } from "./budgetTypes";

export function getTourTravelerCount(tour: Pick<Tour, "travelerCount">, fallback = 1): number {
  const parsed = Math.round(Number(tour.travelerCount));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Math.max(1, Math.round(Number(fallback)) || 1);
}

export function calculateTourTotal(tour: Pick<Tour, "pricingMode" | "pricePerPerson" | "travelerCount" | "totalPrice">, fallbackTravelers = 1): number {
  if (tour.pricingMode === "perPerson") {
    return Math.max(0, Number(tour.pricePerPerson) || 0) * getTourTravelerCount(tour, fallbackTravelers);
  }

  return Math.max(0, Number(tour.totalPrice) || 0);
}
