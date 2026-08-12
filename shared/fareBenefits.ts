export interface FareBenefitGroups {
  bagages?: string[];
  checkIns?: string[];
  changes?: string[];
  customBenefits?: string[];
  benefits?: string[];
}

export const FARE_BAGGAGE_OPTIONS = [
  "Bolsa ou mochila de até 10kg",
  "Bagagem de 12 kg",
  "Bagagem de 23 kg",
] as const;

export function collectFareBenefits({
  bagages = [],
  checkIns = [],
  changes = [],
  customBenefits = [],
}: FareBenefitGroups): string[] {
  return [...bagages, ...checkIns, ...changes, ...customBenefits]
    .map((benefit) => benefit.trim())
    .filter(Boolean);
}

export function reconcileFareBenefits(
  previous: FareBenefitGroups,
  next: FareBenefitGroups,
): string[] {
  const selectedBefore = collectFareBenefits(previous);
  const customBenefits = (previous.benefits || []).filter(
    (benefit) => !selectedBefore.includes(benefit),
  );

  return collectFareBenefits({
    bagages: next.bagages,
    checkIns: next.checkIns,
    changes: next.changes,
    customBenefits,
  });
}
