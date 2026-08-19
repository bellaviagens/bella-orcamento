import { describe, expect, it } from "vitest";
import { getDestinationDocumentationChecklist, groupClientAttachments, summarizeClientDocumentAlerts } from "./clientDocumentManagement";

describe("client document management helpers", () => {
  it("organizes linked attachments by passenger while retaining legacy documents", () => {
    const groups = groupClientAttachments([
      { id: "1", name: "passaporte-ana.pdf", url: "/ana", contentType: "application/pdf", size: 1, passengerName: "Ana" },
      { id: "2", name: "rg-bruno.pdf", url: "/bruno", contentType: "application/pdf", size: 1, passengerName: "Bruno" },
      { id: "3", name: "visto.pdf", url: "/legacy", contentType: "application/pdf", size: 1 },
    ], "Cliente principal");

    expect(groups.map((group) => [group.passengerName, group.attachments.length])).toEqual([
      ["Ana", 1],
      ["Bruno", 1],
      ["Cliente principal", 1],
    ]);
  });

  it("uses RG for domestic destinations and passport plus visa for international destinations", () => {
    expect(getDestinationDocumentationChecklist("Maceió, Brasil").map((item) => item.id)).toEqual(["rg"]);
    expect(getDestinationDocumentationChecklist("Santiago, Chile").map((item) => item.id)).toEqual(["passport", "visa"]);
  });

  it("summarizes existing document alerts with client and days until expiration", () => {
    const alerts = summarizeClientDocumentAlerts([
      { name: "Ana", passportExpiresAt: "2026-01-20" },
      { name: "Bruno", rgExpiresAt: "2027-12-30" },
    ], "05/01/2026 - 10/01/2026", new Date("2026-01-10T10:00:00"));

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ clientName: "Ana", daysUntilExpiry: 10, alert: { document: "Passaporte" } });
  });
});
