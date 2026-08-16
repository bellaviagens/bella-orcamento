export type CombinedPaymentMethod = "cartao" | "pix" | "dinheiro";

export interface CombinedPaymentStep {
  id: string;
  amount: number;
  installments: number;
  paymentMethod: CombinedPaymentMethod;
  cardRate?: number;
}

export interface CalculatedCombinedPaymentStep extends CombinedPaymentStep {
  appliedAmount: number;
  installmentValue: number;
  remainingBalance: number;
  totalWithRate: number;
}

export function calculateCombinedPaymentPlan(
  total: number,
  steps: CombinedPaymentStep[] = [],
): CalculatedCombinedPaymentStep[] {
  const referenceTotal = Math.max(0, total);

  return steps.reduce<CalculatedCombinedPaymentStep[]>((plan, step) => {
    const requestedAmount = Math.max(0, Number(step.amount) || 0);
    if (requestedAmount === 0) return plan;

    const installments = Math.max(1, Math.floor(Number(step.installments) || 1));
    const cardRate = step.paymentMethod === "cartao" ? Math.max(0, Number(step.cardRate) || 0) : 0;
    const totalWithRate = requestedAmount * (1 + cardRate / 100);

    plan.push({
      ...step,
      amount: requestedAmount,
      installments,
      cardRate,
      appliedAmount: requestedAmount,
      installmentValue: totalWithRate / installments,
      totalWithRate,
      remainingBalance: Math.max(0, referenceTotal - requestedAmount),
    });

    return plan;
  }, []);
}
