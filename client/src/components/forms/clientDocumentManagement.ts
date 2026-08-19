import { getClientDocumentAlerts, type ClientDocumentAlert, type ClientDocumentDates } from "./clientDocumentAlerts";

export type ChecklistDocumentType = "passport" | "rg" | "visa" | "eta";
export type ClientAttachmentDocumentType = ChecklistDocumentType | "other";
export type DocumentApprovalStatus = "pending" | "approved" | "denied" | "not-required";
export type ClientDocumentField = "passportNumber" | "rgNumber" | "visaNumber";

export type ClientAttachment = {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  passengerName?: string;
  documentType?: ChecklistDocumentType;
  expiresAt?: string;
  approvalStatus?: DocumentApprovalStatus;
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
export type ClientDocumentValues = Partial<Record<ClientDocumentField, string | null | undefined> & ClientDocumentDates>;
export type PassengerDocumentStatus = "ready" | "missing" | "awaiting-approval" | "denied" | "expired" | "near-expiry";
export type PassengerDocumentReportItem = PassengerChecklistItem & {
  status: PassengerDocumentStatus;
  expiresAt?: string;
  approvalStatus?: DocumentApprovalStatus;
  message: string;
};
export type PassengerDocumentReport = {
  passengerName: string;
  items: PassengerDocumentReportItem[];
  pendingCount: number;
  attentionCount: number;
};

const DOMESTIC_DESTINATION_PATTERN = /\b(brasil|brazil)\b/i;
const MERCOSUR_DESTINATIONS = ["argentina", "bolivia", "chile", "colombia", "equador", "ecuador", "paraguai", "peru", "uruguai", "venezuela"];
const FORMAL_VISA_DESTINATIONS = ["estados unidos", "united states", "eua", "usa", "australia", "china", "india", "cuba"];
const ELECTRONIC_AUTHORIZATION_DESTINATIONS = ["canada", "reino unido", "inglaterra", "escocia", "pais de gales", "united kingdom", "uk"];
const VISA_FREE_DESTINATIONS = ["alemanha", "austria", "belgica", "croacia", "dinamarca", "espanha", "eslovaquia", "eslovenia", "estonia", "finlandia", "franca", "grecia", "holanda", "hungria", "irlanda", "islandia", "italia", "japao", "letonia", "lituania", "luxemburgo", "malta", "noruega", "polonia", "portugal", "republica tcheca", "romenia", "suecia", "suica"];
const APPROVAL_REQUIRED_TYPES: ChecklistDocumentType[] = ["visa", "eta"];

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

function validDate(value?: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
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

function attachmentsForPassengerItem({ attachments, item, passengerName, primaryPassengerName }: {
  attachments: ClientAttachment[];
  item: DestinationChecklistItem;
  passengerName: string;
  primaryPassengerName?: string;
}) {
  return attachments.filter((attachment) => {
    const attachedPassenger = attachment.passengerName?.trim() || primaryPassengerName;
    const documentType = inferredAttachmentDocumentType(attachment);
    return Boolean(documentType && samePassenger(attachedPassenger, passengerName) && item.acceptedDocumentTypes.includes(documentType));
  });
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
    const attachmentProvided = attachmentsForPassengerItem({ attachments, item, passengerName, primaryPassengerName }).length > 0;
    return { ...item, complete: fieldProvided || attachmentProvided };
  });
}

export function getPassengerDocumentReport({
  destination,
  passengerName,
  primaryPassengerName,
  clientDocuments,
  attachments,
  now = new Date(),
}: {
  destination?: string;
  passengerName: string;
  primaryPassengerName?: string;
  clientDocuments?: ClientDocumentValues;
  attachments: ClientAttachment[];
  now?: Date;
}): PassengerDocumentReport {
  const isPrimaryPassenger = samePassenger(passengerName, primaryPassengerName);
  const items = getPassengerDocumentationChecklist({ destination, passengerName, primaryPassengerName, clientDocuments, attachments }).map((item) => {
    const matchingAttachments = attachmentsForPassengerItem({ attachments, item, passengerName, primaryPassengerName });
    const approvalAttachment = matchingAttachments.find((attachment) => APPROVAL_REQUIRED_TYPES.includes(inferredAttachmentDocumentType(attachment) || item.id));
    const expirationCandidates = [
      ...matchingAttachments.map((attachment) => attachment.expiresAt),
      ...(isPrimaryPassenger && item.id === "passport" ? [clientDocuments?.passportExpiresAt] : []),
      ...(isPrimaryPassenger && item.id === "rg" ? [clientDocuments?.rgExpiresAt] : []),
      ...(isPrimaryPassenger && item.id === "visa" ? [clientDocuments?.visaExpiresAt] : []),
    ].filter(validDate) as string[];
    const expiresAt = expirationCandidates.sort()[0];
    const approvalStatus = approvalAttachment?.approvalStatus;
    let status: PassengerDocumentStatus = item.complete ? "ready" : "missing";
    let message = item.complete ? "Documento informado." : "Documento obrigatório pendente.";

    if (item.complete && APPROVAL_REQUIRED_TYPES.includes(item.id) && approvalStatus === "denied") {
      status = "denied";
      message = "Solicitação não aprovada. Revise o documento e a elegibilidade.";
    } else if (item.complete && APPROVAL_REQUIRED_TYPES.includes(item.id) && approvalStatus === "pending") {
      status = "awaiting-approval";
      message = "Documento anexado, aguardando aprovação.";
    }

    if (expiresAt) {
      const remainingDays = daysUntil(expiresAt, now);
      if (remainingDays < 0) {
        status = "expired";
        message = `Documento vencido em ${new Date(`${expiresAt}T12:00:00`).toLocaleDateString("pt-BR")}.`;
      } else if (remainingDays <= 90 && status === "ready") {
        status = "near-expiry";
        message = `Validade próxima: vence em ${new Date(`${expiresAt}T12:00:00`).toLocaleDateString("pt-BR")} (${remainingDays} dias).`;
      }
    }

    return { ...item, status, expiresAt, approvalStatus, message };
  });
  return {
    passengerName,
    items,
    pendingCount: items.filter((item) => ["missing", "awaiting-approval", "denied"].includes(item.status)).length,
    attentionCount: items.filter((item) => ["expired", "near-expiry"].includes(item.status)).length,
  };
}

export function getConsolidatedPassengerDocumentReports({
  destination,
  passengerNames,
  primaryPassengerName,
  clientDocuments,
  attachments,
  now,
}: {
  destination?: string;
  passengerNames: string[];
  primaryPassengerName?: string;
  clientDocuments?: ClientDocumentValues;
  attachments: ClientAttachment[];
  now?: Date;
}) {
  return passengerNames.map((passengerName) => getPassengerDocumentReport({
    destination,
    passengerName,
    primaryPassengerName,
    clientDocuments,
    attachments,
    now,
  }));
}

export function buildPassengerDocumentReminder({
  passengerName,
  destination,
  items,
}: {
  passengerName: string;
  destination?: string;
  items: PassengerDocumentReportItem[];
}) {
  const outstandingItems = items.filter((item) => item.status !== "ready");
  const destinationLabel = destination?.trim() || "a viagem";
  if (!outstandingItems.length) {
    return `Olá, ${passengerName}! Sua documentação para ${destinationLabel} está regular. Qualquer dúvida, estamos à disposição.`;
  }

  const lines = outstandingItems.map((item) => `• ${item.label}: ${item.message}`);
  return [
    `Olá, ${passengerName}! Identificamos pendências ou pontos de atenção na sua documentação para ${destinationLabel}:`,
    ...lines,
    "Por favor, envie ou atualize os documentos assim que possível. Em caso de dúvida, conte conosco.",
  ].join("\n");
}

export function buildWhatsAppReminderUrl(whatsapp: string, message: string) {
  const digits = whatsapp.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
