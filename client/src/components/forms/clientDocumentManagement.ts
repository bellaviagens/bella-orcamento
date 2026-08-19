import { getClientDocumentAlerts, type ClientDocumentAlert, type ClientDocumentDates } from "./clientDocumentAlerts";

export type ClientAttachment = {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  passengerName?: string;
};

export type DestinationChecklistItem = {
  id: "passport" | "rg" | "visa";
  label: string;
  field: "passportNumber" | "rgNumber" | "visaNumber";
  description: string;
};

export type GroupedClientAttachments = {
  passengerName: string;
  attachments: ClientAttachment[];
};

export type ClientDocumentAlertSummary = {
  clientName: string;
  alert: ClientDocumentAlert;
  daysUntilExpiry: number;
};

const DOMESTIC_DESTINATION_PATTERN = /\b(brasil|brazil)\b/i;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(expiry: string, now: Date) {
  const [year, month, day] = expiry.split("-").map(Number);
  const expiresAt = new Date(year, month - 1, day);
  return Math.round((expiresAt.getTime() - startOfDay(now).getTime()) / 86_400_000);
}

export function getDestinationDocumentationChecklist(destination?: string): DestinationChecklistItem[] {
  if (DOMESTIC_DESTINATION_PATTERN.test(destination || "")) {
    return [{
      id: "rg",
      label: "RG ou documento de identificação",
      field: "rgNumber",
      description: "Documento de identificação para viagem nacional.",
    }];
  }

  return [
    {
      id: "passport",
      label: "Passaporte",
      field: "passportNumber",
      description: "Documento de viagem para destino internacional.",
    },
    {
      id: "visa",
      label: "Visto",
      field: "visaNumber",
      description: "Confirme se o destino exige visto para este passageiro.",
    },
  ];
}

export function groupClientAttachments(attachments: ClientAttachment[], fallbackPassengerName?: string): GroupedClientAttachments[] {
  const groups = new Map<string, ClientAttachment[]>();
  attachments.forEach((attachment) => {
    const passengerName = attachment.passengerName?.trim() || fallbackPassengerName?.trim() || "Documentos sem vínculo";
    groups.set(passengerName, [...(groups.get(passengerName) || []), attachment]);
  });
  return Array.from(groups, ([passengerName, groupedAttachments]) => ({ passengerName, attachments: groupedAttachments }));
}

export function summarizeClientDocumentAlerts(
  clients: Array<{ name: string } & ClientDocumentDates>,
  tripPeriod?: string,
  now = new Date(),
): ClientDocumentAlertSummary[] {
  return clients.flatMap((client) => getClientDocumentAlerts(client, tripPeriod, now).map((alert) => ({
    clientName: client.name,
    alert,
    daysUntilExpiry: daysUntil(alert.expiresAt, now),
  }))).sort((first, second) => first.daysUntilExpiry - second.daysUntilExpiry);
}
