import type { FinalItineraryEvent } from "@shared/budgetTypes";

/** Retorna a data planejada do dia, priorizando a data importada da Proposta. */
export function getFinalItineraryDayDate(events: FinalItineraryEvent[]) {
  return events
    .map((event) => event.proposalDayDate || event.flightDate || event.hotelCheckIn || event.hotelCheckOut)
    .find(Boolean);
}

/** Formata a data no mesmo padrão conciso de dia da semana usado na Proposta. */
export function formatFinalItineraryDayDate(date?: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }).format(parsed);
}
