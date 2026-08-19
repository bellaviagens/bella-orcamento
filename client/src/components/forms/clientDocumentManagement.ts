import { getClientDocumentAlerts, type ClientDocumentAlert, type ClientDocumentDates } from "./clientDocumentAlerts";

export type ChecklistDocumentType = "passport" | "rg" | "visa" | "eta";
export type ClientAttachmentDocumentType = ChecklistDocumentType | "other";
export type ClientDocumentField = "passportNumber" | "rgNumber" | "visaNumber";

export type ClientAttachment = {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  passengerName?: string;
  documentType?: ChecklistDocumentType;
};

export type DestinationChecklistItem = {
  id: ChecklistDocumentType;
  label: string;
  fields: ClientDocumentField[];
  acceptedDocumentTypes: ChecklistDocumentType[];
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

export type PassengerChecklistItem = DestinationChecklistItem & { complete: boolean };
export type ClientDocumentValues = Partial<Record<ClientDocumentField, string | null | undefined>>;

const DOMESTIC_DESTINATION_PATTERN = /\b(brasil|brazil)\b/i;
const MERCOSUR_DESTINATIONS = ["argentina", "bolivia", "chile", "colombia", "equador", "ecuador", "paraguai", "peru", "uruguai", "venezuela"];
const FORMAL_VISA_DESTINATIONS = ["estados unidos", "united states", "eua", "usa", "australia", "china", "india", "cuba"];
const ELECTRONIC_AUTHORIZATION_DESTINATIONS = ["canada", "reino unido", "inglaterra", "escocia", "pais de gales", "united kingdom", "uk"];
const VISA_FREE_DESTINATIONS = ["alemanha", "austria", "belgica", "croacia", "dinamarca", "espanha", "eslovaquia", "eslovenia", "estonia", "finlandia", "franca", "grecia", "holanda", "hungria", "irlanda", "islandia", "italia", "japao", "letonia", "lituania", "luxemburgo", "malta", "noruega", "polonia", "portugal", "republica tcheca", "romenia", "suecia", "suica"];

function normalize(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasDestination(destination: string, destinations: string[]) {
  return destinations.some((country) => destination.includes(country));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysUntil(expiry: string, now: Date) {
  const [year, month, day] = expiry.split("-").map(Number);
  const expiresAt = new Date(year, month - 1, day);
  return Math.round((expiresAt.getTime() - startOfDay(now).getTime()) / 86_400_000);
}

function passportItem(): DestinationChecklistItem {
  return {
    id: "passport",
    label: "Passaporte",
    fields: ["passportNumber"],
    acceptedDocumentTypes: ["passport"],
    description: "Passaporte válido para o período da viagem.",
  };
}

function visaItem(description: string, label = "Visto de visitante"): DestinationChecklistItem {
  return {
    id: "visa",
    label,
    fields: ["visaNumber"],
    acceptedDocumentTypes: ["visa"],
    description,
  };
}

function electronicAuthorizationItem(description: string): DestinationChecklistItem {
  return {
    id: "eta",
    label: "Autorização eletrônica",
    fields: [],
    acceptedDocumentTypes: ["eta"],
    description,
  };
}

export function getDestinationDocumentationChecklist(destination?: string): DestinationChecklistItem[] {
  const normalizedDestination = normalize(destination);
  if (DOMESTIC_DESTINATION_PATTERN.test(normalizedDestination)) {
    return [{
      id: "rg",
      label: "RG ou documento de identificação",
      fields: ["rgNumber"],
      acceptedDocumentTypes: ["rg"],
      description: "Documento de identificação para viagem nacional.",
    }];
  }

  if (hasDestination(normalizedDestination, MERCOSUR_DESTINATIONS)) {
    return [{
      id: "passport",
      label: "Passaporte ou RG em bom estado",
      fields: ["passportNumber", "rgNumber"],
      acceptedDocumentTypes: ["passport", "rg"],
      description: "Para este destino sul-americano, confira se o RG atende às condições de entrada ou use passaporte válido. Não há regra base de visto turístico no sistema.",
    }];
  }

  if (hasDestination(normalizedDestination, FORMAL_VISA_DESTINATIONS)) {
    return [
      passportItem(),
      visaItem("Regra base: este destino requer visto de visitante para brasileiros. Confirme categoria, prazo e condições diretamente com a autoridade consular."),
    ];
  }

  if (hasDestination(normalizedDestination, ELECTRONIC_AUTHORIZATION_DESTINATIONS)) {
    const isCanada = normalizedDestination.includes("canada");
    return [
      passportItem(),
      electronicAuthorizationItem(isCanada
        ? "Canadá: registre a eTA quando o viajante for elegível; caso contrário, anexe o visto de visitante e confirme o requisito oficial."
        : "Reino Unido: registre a ETA aprovada antes do embarque e confirme o requisito oficial para a nacionalidade do passageiro."),
    ];
  }

  if (hasDestination(normalizedDestination, VISA_FREE_DESTINATIONS)) {
    return [
      passportItem(),
      visaItem("Turismo de curta duração costuma ser isento de visto para brasileiros neste destino. Confirme condições adicionais, como autorização eletrônica, antes da emissão.", "Visto ou autorização, se aplicável"),
    ];
  }

  return [
    passportItem(),
    visaItem("Confirme junto à autoridade oficial se há visto de turismo, autorização eletrônica ou outra exigência para este destino antes da viagem.", "Visto ou autorização, se aplicável"),
  ];
}

function inferredAttachmentDocumentType(attachment: ClientAttachment): ChecklistDocumentType | undefined {
  if (attachment.documentType) return attachment.documentType;
  const fileName = normalize(attachment.name);
  if (fileName.includes("passaporte")) return "passport";
  if (fileName.includes("visto")) return "visa";
  if (fileName.includes("eta") || fileName.includes("autoriz")) return "eta";
  if (/(^|[^a-z])rg([^a-z]|$)|identidade/.test(fileName)) return "rg";
  return undefined;
}

function samePassenger(first?: string, second?: string) {
  return normalize(first?.trim()) === normalize(second?.trim());
}

export function getPassengerDocumentationChecklist({
  destination,
  passengerName,
  primaryPassengerName,
  clientDocuments,
  attachments,
}: {
  destination?: string;
  passengerName: string;
  primaryPassengerName?: string;
  clientDocuments?: ClientDocumentValues;
  attachments: ClientAttachment[];
}): PassengerChecklistItem[] {
  const isPrimaryPassenger = samePassenger(passengerName, primaryPassengerName);
  return getDestinationDocumentationChecklist(destination).map((item) => {
    const fieldProvided = isPrimaryPassenger && item.fields.some((field) => Boolean(clientDocuments?.[field]?.trim()));
    const attachmentProvided = attachments.some((attachment) => {
      const attachedPassenger = attachment.passengerName?.trim() || primaryPassengerName;
      const documentType = inferredAttachmentDocumentType(attachment);
      if (!documentType) return false;
      return samePassenger(attachedPassenger, passengerName) && item.acceptedDocumentTypes.includes(documentType);
    });
    return { ...item, complete: fieldProvided || attachmentProvided };
  });
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
