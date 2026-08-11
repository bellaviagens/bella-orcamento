import { describe, expect, it } from "vitest";
import { calculateInstallmentWithDownpayment } from "./paymentCalculations";

describe("calculateInstallmentWithDownpayment", () => {
  it("deduz a entrada e reserva uma parcela para ela", () => {
    expect(calculateInstallmentWithDownpayment(6000, 6, 1000)).toMatchObject({
      downpaymentAmount: 1000,
      remainingBalance: 5000,
      remainingInstallments: 5,
      installmentValue: 1000,
    });
  });
});

