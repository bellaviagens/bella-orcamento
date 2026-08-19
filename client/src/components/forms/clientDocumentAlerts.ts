export type ClientDocumentDates = {
  passportExpiresAt?: string | null;
  rgExpiresAt?: string | null;
  visaExpiresAt?: string | null;
};

export type ClientDocumentAlert = { kind: "expired" | "trip-risk"; document: "Passaporte" | "RG" | "Visto"; expiresAt: string; message: string };

const parseDate = (value?: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function getTripEndDate(period?: string) {
  const matches = (period || "").match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g) || [];
  const latest = matches.map((item) => {
    const [day, month, year] = item.split("/").map(Number);
    return new Date(year, month - 1, day, 12);
  }).sort((a, b) => b.getTime() - a.getTime())[0];
  return latest || null;
}

export function getClientDocumentAlerts(documents: ClientDocumentDates, tripPeriod?: string, now = new Date()) {
  const tripEnd = getTripEndDate(tripPeriod);
  const definitions: Array<[ClientDocumentAlert["document"], string | null | undefined]> = [["Passaporte", documents.passportExpiresAt], ["RG", documents.rgExpiresAt], ["Visto", documents.visaExpiresAt]];
  return definitions.flatMap<ClientDocumentAlert>(([document, value]) => {
    const expires = parseDate(value);
    if (!expires) return [];
    const expiresAt = value as string;
    if (expires.getTime() < now.getTime()) return [{ kind: "expired" as const, document, expiresAt, message: `${document} vencido em ${expires.toLocaleDateString("pt-BR")}.` }];
    if (tripEnd && expires.getTime() < tripEnd.getTime()) return [{ kind: "trip-risk" as const, document, expiresAt, message: `${document} vence em ${expires.toLocaleDateString("pt-BR")} antes do retorno previsto.` }];
    if (tripEnd && document !== "RG") {
      const recommendedExpiry = new Date(tripEnd);
      recommendedExpiry.setMonth(recommendedExpiry.getMonth() + 6);
      if (expires.getTime() < recommendedExpiry.getTime()) return [{ kind: "trip-risk" as const, document, expiresAt, message: `${document} vence em ${expires.toLocaleDateString("pt-BR")} e pode não atender à validade mínima exigida após o retorno.` }];
    }
    return [];
  });
}
