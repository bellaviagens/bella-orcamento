import { describe, expect, it } from "vitest";
import { buildPassengerDocumentReminder, buildWhatsAppReminderUrl, getConsolidatedPassengerDocumentReports, getDestinationDocumentationChecklist, getPassengerDocumentationChecklist, groupClientAttachments, summarizeClientDocumentAlerts } from "./clientDocumentManagement";

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

  it("applies documentation rules that identify domestic, Mercosur, visa and electronic authorization destinations", () => {
    expect(getDestinationDocumentationChecklist("Maceió, Brasil").map((item) => item.id)).toEqual(["rg"]);
    expect(getDestinationDocumentationChecklist("Santiago, Chile")[0]).toMatchObject({ id: "passport", acceptedDocumentTypes: ["passport", "rg"] });
    expect(getDestinationDocumentationChecklist("Orlando, Estados Unidos").map((item) => item.id)).toEqual(["passport", "visa"]);
    expect(getDestinationDocumentationChecklist("Londres, Reino Unido").map((item) => item.id)).toEqual(["passport", "eta"]);
    expect(getDestinationDocumentationChecklist("Toronto, Canadá")[1].description).toContain("eTA");
    expect(getDestinationDocumentationChecklist("Paris, França")[1]).toMatchObject({ id: "visa", label: "Visto ou autorização, se aplicável" });
  });

  it("generates independent checklist completion for the primary passenger and each companion", () => {
    const attachments = [
      { id: "ana-passport", name: "passaporte-ana.pdf", url: "/ana", contentType: "application/pdf", size: 1, passengerName: "Ana", documentType: "passport" as const },
      { id: "bruno-visa", name: "visto-bruno.pdf", url: "/bruno", contentType: "application/pdf", size: 1, passengerName: "Bruno", documentType: "visa" as const },
    ];

    const anaChecklist = getPassengerDocumentationChecklist({
      destination: "Orlando, Estados Unidos",
      passengerName: "Ana",
      primaryPassengerName: "Ana",
      clientDocuments: { passportNumber: "AB123" },
      attachments,
    });
    const brunoChecklist = getPassengerDocumentationChecklist({
      destination: "Orlando, Estados Unidos",
      passengerName: "Bruno",
      primaryPassengerName: "Ana",
      clientDocuments: { passportNumber: "AB123" },
      attachments,
    });

    expect(anaChecklist.map((item) => [item.id, item.complete])).toEqual([["passport", true], ["visa", false]]);
    expect(brunoChecklist.map((item) => [item.id, item.complete])).toEqual([["passport", false], ["visa", true]]);
  });

  it("summarizes existing document alerts with client and days until expiration", () => {
    const alerts = summarizeClientDocumentAlerts([
      { name: "Ana", passportExpiresAt: "2026-01-20" },
      { name: "Bruno", rgExpiresAt: "2027-12-30" },
    ], "05/01/2026 - 10/01/2026", new Date("2026-01-10T10:00:00"));

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ clientName: "Ana", daysUntilExpiry: 10, alert: { document: "Passaporte" } });
  });

  it("reports missing, pending approval and expiring documents independently by passenger", () => {
    const reports = getConsolidatedPassengerDocumentReports({
      destination: "Orlando, Estados Unidos",
      passengerNames: ["Ana", "Bruno"],
      primaryPassengerName: "Ana",
      clientDocuments: { passportNumber: "AB123", passportExpiresAt: "2026-02-15" },
      attachments: [
        { id: "ana-visa", name: "visto-ana.pdf", url: "/ana-visa", contentType: "application/pdf", size: 1, passengerName: "Ana", documentType: "visa", approvalStatus: "pending", expiresAt: "2027-06-30" },
        { id: "bruno-visa", name: "visto-bruno.pdf", url: "/bruno-visa", contentType: "application/pdf", size: 1, passengerName: "Bruno", documentType: "visa", approvalStatus: "approved", expiresAt: "2027-06-30" },
      ],
      now: new Date("2026-01-20T10:00:00"),
    });

    expect(reports[0]).toMatchObject({ passengerName: "Ana", pendingCount: 1, attentionCount: 1 });
    expect(reports[0].items.map((item) => [item.id, item.status])).toEqual([["passport", "near-expiry"], ["visa", "awaiting-approval"]]);
    expect(reports[1]).toMatchObject({ passengerName: "Bruno", pendingCount: 1, attentionCount: 0 });
    expect(reports[1].items.map((item) => [item.id, item.status])).toEqual([["passport", "missing"], ["visa", "ready"]]);
  });

  it("builds a WhatsApp reminder with the passenger's outstanding documents", () => {
    const reports = getConsolidatedPassengerDocumentReports({
      destination: "Orlando, Estados Unidos",
      passengerNames: ["Ana"],
      primaryPassengerName: "Ana",
      attachments: [],
      now: new Date("2026-08-19T12:00:00"),
    });

    const message = buildPassengerDocumentReminder({ passengerName: "Ana", destination: "Orlando, Estados Unidos", items: reports[0].items });
    expect(message).toContain("Olá, Ana");
    expect(message).toContain("Passaporte");
    expect(buildWhatsAppReminderUrl("(11) 99999-9999", message)).toContain("https://wa.me/5511999999999?text=");
  });
});
