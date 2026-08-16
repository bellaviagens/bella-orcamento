export type CombinedPaymentMethod = "cartao" | "pix" | "dinheiro";

export interface CombinedPaymentStep {
  id: string;
  amount: number;
  installments: number;
  paymentMethod: CombinedPaymentMethod;
}

export interface CalculatedCombinedPaymentStep extends CombinedPaymentStep {
  appliedAmount: number;
  installmentValue: number;
  remainingBalance: number;
}

export function calculateCombinedPaymentPlan(
  total: number,
  steps: CombinedPaymentStep[] = [],
): CalculatedCombinedPaymentStep[] {
  let remainingBalance = Math.max(0, total);

  return steps.reduce<CalculatedCombinedPaymentStep[]>((plan, step) => {
    const requestedAmount = Math.max(0, Number(step.amount) || 0);
    if (requestedAmount === 0 || remainingBalance === 0) return plan;

    const appliedAmount = Math.min(requestedAmount, remainingBalance);
    const installments = Math.max(1, Math.floor(Number(step.installments) || 1));
    remainingBalance -= appliedAmount;

    plan.push({
      ...step,
      amount: requestedAmount,
      installments,
      appliedAmount,
      installmentValue: appliedAmount / installments,
      remainingBalance,
    });

    return plan;
  }, []);
}
