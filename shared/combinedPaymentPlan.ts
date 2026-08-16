export type CombinedPaymentMethod = "cartao" | "pix" | "dinheiro";

/** Uma forma interna dentro de uma condição de pagamento. */
export interface CombinedPaymentStep {
  id: string;
  amount: number;
  installments: number;
  paymentMethod: CombinedPaymentMethod;
  cardRate?: number;
  /** Cor escolhida para identificar esta forma no formulário e no PDF. */
  color?: string;
}

/** Uma condição apresentada ao cliente, composta por uma ou mais formas. */
export interface CombinedPaymentCondition {
  id: string;
  steps: CombinedPaymentStep[];
  /** Título opcional exibido ao cliente no lugar de "Pagamento N". */
  label?: string;
}

export interface CalculatedCombinedPaymentStep extends CombinedPaymentStep {
  installmentValue: number;
  totalWithRate: number;
}

export interface CalculatedCombinedPaymentCondition extends CombinedPaymentCondition {
  steps: CalculatedCombinedPaymentStep[];
  total: number;
}

type CombinedPaymentPlanInput = CombinedPaymentCondition | CombinedPaymentStep;

function isCondition(input: CombinedPaymentPlanInput): input is CombinedPaymentCondition {
  return "steps" in input && Array.isArray(input.steps);
}

/** Mantém leitura de rascunhos anteriores que possuíam uma forma por condição. */
export function normalizeCombinedPaymentConditions(
  entries: CombinedPaymentPlanInput[] = [],
): CombinedPaymentCondition[] {
  return entries.map((entry) => {
    if (isCondition(entry)) {
      return { ...entry, steps: entry.steps };
    }

    return { id: entry.id, steps: [entry] };
  });
}

/**
 * Calcula condições independentes. O total do orçamento não é descontado
 * entre condições: cada uma representa uma alternativa completa ao cliente.
 */
export function calculateCombinedPaymentPlan(
  _referenceTotal: number,
  entries: CombinedPaymentPlanInput[] = [],
): CalculatedCombinedPaymentCondition[] {
  return normalizeCombinedPaymentConditions(entries).map((condition) => {
    const steps = condition.steps.reduce<CalculatedCombinedPaymentStep[]>((plan, step) => {
      const amount = Math.max(0, Number(step.amount) || 0);
      if (amount === 0) return plan;

      const installments = Math.max(1, Math.floor(Number(step.installments) || 1));
      const cardRate = step.paymentMethod === "cartao" ? Math.max(0, Number(step.cardRate) || 0) : 0;
      const totalWithRate = amount * (1 + cardRate / 100);

      plan.push({
        ...step,
        amount,
        installments,
        cardRate,
        installmentValue: totalWithRate / installments,
        totalWithRate,
      });
      return plan;
    }, []);

    return {
      ...condition,
      steps,
      total: steps.reduce((sum, step) => sum + step.totalWithRate, 0),
    };
  });
}
