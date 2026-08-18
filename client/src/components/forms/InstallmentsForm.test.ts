import { describe, expect, it } from "vitest";
import { toggleCollapsedPaymentSection } from "./InstallmentsForm";

describe("toggleCollapsedPaymentSection", () => {
  it("recolhe somente a forma de pagamento selecionada", () => {
    expect(toggleCollapsedPaymentSection([], "hotel")).toEqual(["hotel"]);
    expect(toggleCollapsedPaymentSection(["hotel"], "flight-cash")).toEqual(["hotel", "flight-cash"]);
  });

  it("expande novamente apenas a forma de pagamento selecionada", () => {
    expect(toggleCollapsedPaymentSection(["hotel", "flight-rate"], "hotel")).toEqual(["flight-rate"]);
  });
});
