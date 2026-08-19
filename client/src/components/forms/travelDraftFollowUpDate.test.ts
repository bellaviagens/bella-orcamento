import { describe, expect, it } from "vitest";
import { followUpDateToInput, followUpInputToDate, formatFollowUpDate } from "./travelDraftFollowUpDate";

describe("travelDraftFollowUpDate", () => {
  it("converte a data informada no campo para uma data persistível sem deslocar o dia", () => {
    const result = followUpInputToDate("2026-08-28");
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(7);
    expect(result?.getDate()).toBe(28);
  });

  it("formata a data persistida para o campo de retorno", () => {
    expect(followUpDateToInput(new Date("2026-08-28T12:00:00"))).toBe("2026-08-28");
  });

  it("apresenta a data de retorno no formato brasileiro", () => {
    expect(formatFollowUpDate(new Date("2026-08-28T12:00:00"))).toBe("28/08/2026");
  });

  it("não aceita valores de data incompletos", () => {
    expect(followUpInputToDate("28/08/2026")).toBeNull();
  });
});
