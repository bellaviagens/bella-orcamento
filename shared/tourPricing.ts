import type { Tour } from "./budgetTypes";

export function getTourTravelerCount(tour: Pick<Tour, "travelerCount">, fallback = 1): number {
  const parsed = Math.round(Number(tour.travelerCount));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Math.max(1, Math.round(Number(fallback)) || 1);
}

export function calculateTourTotal(tour: Pick<Tour, "pricingMode" | "pricePerPerson" | "travelerCount" | "childPrice" | "childCount" | "totalPrice">, fallbackTravelers = 1): number {
  if (tour.pricingMode === "perPerson") {
    const adultTotal = Math.max(0, Number(tour.pricePerPerson) || 0) * getTourTravelerCount(tour, fallbackTravelers);
    const childTotal = Math.max(0, Number(tour.childPrice) || 0) * Math.max(0, Math.round(Number(tour.childCount) || 0));
    return adultTotal + childTotal;
  }

  return Math.max(0, Number(tour.totalPrice) || 0);
}

export function calculateTourProposalInstallment(total: number, installments: number | undefined): { count: number; value: number } {
  const count = Math.min(36, Math.max(1, Math.round(Number(installments) || 1)));
  return {
    count,
    value: Math.max(0, Number(total) || 0) / count,
  };
}
