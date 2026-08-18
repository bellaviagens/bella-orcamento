import { describe, expect, it } from "vitest";
import { formatBrazilianCurrencyInput, parseBrazilianCurrencyInput } from "./installmentsCashValue";

describe("valor à vista em reais", () => {
  it("converte valores digitados em formatos brasileiros para número", () => {
    expect(parseBrazilianCurrencyInput("R$ 4.000,00")).toBe(4000);
    expect(parseBrazilianCurrencyInput("4000,50")).toBe(4000.5);
    expect(parseBrazilianCurrencyInput("4000")).toBe(4000);
  });

  it("apresenta o valor à vista em reais", () => {
    expect(formatBrazilianCurrencyInput(4000)).toBe("R$ 4.000,00");
  });
});
