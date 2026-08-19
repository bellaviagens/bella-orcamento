import { describe, expect, it } from "vitest";
import { getDestinationDocumentationChecklist, getPassengerDocumentationChecklist, groupClientAttachments, summarizeClientDocumentAlerts } from "./clientDocumentManagement";

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
});
