import type { ItineraryDay } from "@shared/budgetTypes";

export interface ProposalArrivalConflict {
  dayId: string;
  dayNumber: number;
  activityId: string;
  activityTitle: string;
  activityTime: string;
}

function toComparableTime(value?: string) {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Retorna passeios do dia de chegada que iniciam antes da previsão de chegada ao hotel. */
export function getProposalArrivalConflicts(
  itinerary: ItineraryDay[],
  arrivalDate?: string,
  hotelArrivalTime?: string,
): ProposalArrivalConflict[] {
  const comparableArrival = toComparableTime(hotelArrivalTime);
  if (!arrivalDate || comparableArrival === null) return [];

  return itinerary.flatMap((day) => {
    if (day.date !== arrivalDate) return [];
    return (day.activities || []).flatMap((activity) => {
      const comparableActivity = toComparableTime(activity.time);
      if (comparableActivity === null || comparableActivity >= comparableArrival) return [];
      return [{
        dayId: day.id,
        dayNumber: day.day,
        activityId: activity.id,
        activityTitle: activity.title || "Passeio sem título",
        activityTime: activity.time,
      }];
    });
  });
}
