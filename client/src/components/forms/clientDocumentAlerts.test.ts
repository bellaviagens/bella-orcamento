import { describe, expect, it } from "vitest";
import { getClientDocumentAlerts, getTripEndDate } from "./clientDocumentAlerts";

describe("alertas de documentos de clientes", () => {
  it("identifica a última data informada no período da viagem", () => {
    expect(getTripEndDate("15/01/2027 à 31/01/2027")?.toISOString().slice(0, 10)).toBe("2027-01-31");
  });

  it("alerta quando o documento vence antes do retorno", () => {
    expect(getClientDocumentAlerts({ passportExpiresAt: "2027-01-20" }, "15/01/2027 à 31/01/2027", new Date("2026-01-01T12:00:00"))).toEqual([expect.objectContaining({ kind: "trip-risk", document: "Passaporte" })]);
  });

  it("alerta quando passaporte vence dentro de seis meses após o retorno", () => {
    expect(getClientDocumentAlerts({ passportExpiresAt: "2027-05-30" }, "15/01/2027 à 31/01/2027", new Date("2026-01-01T12:00:00"))).toEqual([expect.objectContaining({ kind: "trip-risk", document: "Passaporte" })]);
  });
});
