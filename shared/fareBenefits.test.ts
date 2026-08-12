import { describe, expect, it } from "vitest";
import { collectFareBenefits, FARE_BAGGAGE_OPTIONS, reconcileFareBenefits } from "./fareBenefits";

describe("collectFareBenefits", () => {
  it("mantém a bagagem de 12 kg e os opcionais personalizados no preview", () => {
    expect(collectFareBenefits({
      bagages: ["Bagagem de 12 kg"],
      checkIns: ["Check-in prioritário"],
      customBenefits: ["Acesso à sala VIP"],
    })).toEqual([
      "Bagagem de 12 kg",
      "Check-in prioritário",
      "Acesso à sala VIP",
    ]);
  });

  it("disponibiliza Bagagem de 12 kg como o padrão exibido no formulário", () => {
    expect(FARE_BAGGAGE_OPTIONS).toContain("Bagagem de 12 kg");
    expect(FARE_BAGGAGE_OPTIONS).not.toContain("Bagagem de 10 kg");
  });

  it("atualiza benefícios de uma tarifa existente e preserva seus opcionais personalizados", () => {
    expect(reconcileFareBenefits(
      {
        bagages: ["Bagagem de 10 kg"],
        checkIns: ["Check-in prioritário"],
        benefits: ["Bagagem de 10 kg", "Check-in prioritário", "Acesso à sala VIP"],
      },
      {
        bagages: ["Bagagem de 12 kg"],
        checkIns: ["Check-in prioritário"],
      },
    )).toEqual([
      "Bagagem de 12 kg",
      "Check-in prioritário",
      "Acesso à sala VIP",
    ]);
  });

  it("remove itens vazios após a edição de um opcional", () => {
    expect(collectFareBenefits({
      bagages: ["  Bagagem de 12 kg  "],
      changes: [""],
    })).toEqual(["Bagagem de 12 kg"]);
  });
});
