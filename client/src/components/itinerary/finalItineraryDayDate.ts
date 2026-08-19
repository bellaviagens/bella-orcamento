import type { FinalItineraryEvent } from "@shared/budgetTypes";

/** Retorna a data planejada do dia, priorizando a data importada da Proposta. */
export function getFinalItineraryDayDate(events: FinalItineraryEvent[]) {
  return events
    .map((event) => event.proposalDayDate || event.flightDate || event.hotelCheckIn || event.hotelCheckOut)
    .find(Boolean);
}

/** Formata a data completa no padrão exibido nos cabeçalhos do Roteiro Final. */
export function formatFinalItineraryDayDate(date?: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const formatted = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(parsed).replace(", ", " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
