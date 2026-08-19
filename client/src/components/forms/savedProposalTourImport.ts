import { getItineraryDayActivities } from "@/contexts/BudgetContext";
import type { BudgetData, FinalItineraryEvent } from "@shared/budgetTypes";

export function savedProposalTourEvents(
  sourceBudget: Pick<BudgetData, "tours" | "itinerary">,
  proposalId: string,
  existingEvents: FinalItineraryEvent[],
): FinalItineraryEvent[] {
  const importedSourceIds = new Set(existingEvents.map((event) => event.sourceTourId).filter(Boolean));
  const fallbackDay = Math.max(0, ...existingEvents.map((event) => event.day)) + 1;

  return sourceBudget.tours.flatMap((tour) => {
    const sourceTourId = `saved-proposal:${proposalId}:${tour.id}`;
    if (importedSourceIds.has(sourceTourId)) return [];

    const itineraryMatch = sourceBudget.itinerary
      .map((day) => ({ day, activity: getItineraryDayActivities(day).find((activity) => activity.tourId === tour.id) }))
      .find((match) => Boolean(match.activity))
      || sourceBudget.itinerary
        .filter((day) => day.tourId === tour.id)
        .map((day) => ({ day, activity: getItineraryDayActivities(day)[0] }))
        .at(0);
    const sourceActivity = itineraryMatch?.activity;
    const description = [
      tour.description,
      sourceActivity?.description && sourceActivity.description !== tour.description ? sourceActivity.description : "",
      tour.notes ? `Informações adicionais: ${tour.notes}` : "",
      sourceActivity?.importantNotes ? `Importante: ${sourceActivity.importantNotes}` : "",
      sourceActivity?.ticketUrl ? `Ingresso: ${sourceActivity.ticketUrl}` : "",
    ].filter(Boolean).join("\n\n");

    return [{
      id: crypto.randomUUID(),
      day: itineraryMatch?.day.day || fallbackDay,
      proposalDayDate: itineraryMatch?.day.date || "",
      kind: "tour" as const,
      title: tour.name,
      time: sourceActivity?.time || "",
      description,
      linkUrl: tour.pageUrl || "",
      addressUrl: sourceActivity?.addressUrl || "",
      photoUrl: sourceActivity?.photoUrl || tour.photosUrl || "",
      sourceTourId,
    }];
  });
}
