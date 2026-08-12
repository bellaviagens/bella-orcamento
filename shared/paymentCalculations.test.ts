import { describe, expect, it } from "vitest";
import { calculateInstallmentWithDownpayment } from "./paymentCalculations";

describe("calculateInstallmentWithDownpayment", () => {
  it("deduz a entrada sem reduzir a quantidade de parcelas informada", () => {
    expect(calculateInstallmentWithDownpayment(6000, 6, 1000)).toMatchObject({
      downpaymentAmount: 1000,
      remainingBalance: 5000,
      remainingInstallments: 6,
      installmentValue: 833.3333333333334,
    });
  });
});
