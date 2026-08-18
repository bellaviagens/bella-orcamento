import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { defaultBudgetData, type BudgetData, type FinalItinerary, type FinalItineraryEvent, type FinalItineraryEventKind, type Flight, type GastronomyOption, type Hotel, type FareTier, type ItineraryActivity, type ItineraryDay, type QuotationActivity, type Tour, type TourProposal } from "@shared/budgetTypes";
import type { CombinedPaymentCondition, CombinedPaymentStep } from "@shared/combinedPaymentPlan";
import { reconcileFareBenefits } from "@shared/fareBenefits";
import { nanoid } from "nanoid";

interface BudgetContextType {
  budget: BudgetData;
  updateTripInfo: (field: string, value: string) => void;
  addFlight: (flight: Flight) => void;
  updateFlight: (id: string, flight: Flight) => void;
  removeFlight: (id: string) => void;
  addHotel: (hotel: Hotel) => void;
  updateHotel: (id: string, hotel: Hotel) => void;
  removeHotel: (id: string) => void;
  duplicateHotel: (id: string) => void;
  reorderHotels: (hotels: Hotel[]) => void;
  addTour: (tour: Tour) => void;
  updateTour: (id: string, tour: Tour) => void;
  removeTour: (id: string) => void;
  duplicateTour: (id: string) => void;
  reorderTours: (tours: Tour[]) => void;
  saveGastronomyOption: (option: GastronomyOption) => void;
  removeGastronomyOption: (id: string) => void;
  addGastronomyToDay: (dayId: string, optionId: string) => void;
  addGastronomyToUsefulTips: (optionId: string) => void;
  addItineraryDay: () => void;
  importItineraryFromQuotation: (activities: QuotationActivity[], quotationUrl: string) => void;
  addItineraryActivity: (dayId: string, activity?: Partial<ItineraryActivity>) => void;
  updateItineraryActivity: (dayId: string, activityId: string, updates: Partial<ItineraryActivity>) => void;
  removeItineraryActivity: (dayId: string, activityId: string) => void;
  reorderItineraryActivities: (dayId: string, activities: ItineraryActivity[]) => void;
  moveItineraryActivity: (sourceDayId: string, activityId: string, targetDayId: string) => void;
  updateTourProposal: (updates: Partial<TourProposal>) => void;
  resetTourProposal: () => void;
  replaceBudget: (budget: BudgetData) => void;
  updateFinalItinerary: (updates: Partial<FinalItinerary>) => void;
  addFinalItineraryEvent: (event?: Partial<FinalItineraryEvent>) => void;
  updateFinalItineraryEvent: (id: string, updates: Partial<FinalItineraryEvent>) => void;
  removeFinalItineraryEvent: (id: string) => void;
  reorderFinalItineraryEvents: (events: FinalItineraryEvent[]) => void;
  addFlightToFinalItinerary: (flightId: string) => void;
  addHotelToFinalItinerary: (hotelId: string) => void;
  addTourToFinalItinerary: (tourId: string) => void;
  updateItineraryDay: (id: string, updates: Partial<ItineraryDay>) => void;
  removeItineraryDay: (id: string) => void;
  reorderItineraryDays: (days: ItineraryDay[]) => void;
  addFareTier: (tier: Omit<FareTier, "id">) => void;
  updateFareTier: (id: string, tier: Partial<FareTier>) => void;
  removeFareTier: (id: string) => void;
  updateBaggage: (index: number, field: string, value: string | number) => void;
  updateInstallments: (field: "flight" | "hotel" | "combined" | "combinedInstallments" | "combinedPaymentSteps" | "hotelDownpayment" | "hotelDownpaymentAmount" | "flightDownpayment" | "flightDownpaymentAmount" | "combinedDownpayment" | "combinedDownpaymentAmount" | "observations" | "flightCashPrice" | "flightCashPaymentMethods" | "flightMachineRate" | "flightInstallmentsWithRate" | "showCashOption", value: number | boolean | string | string[] | Array<CombinedPaymentCondition | CombinedPaymentStep> | undefined) => void;
  updatePaymentMethods: (methods: string[]) => void;
  updateHotelPaymentMethods: (methods: string[]) => void;
  updatePageBreaks: (field: "flights" | "hotels" | "baggage" | "payment", value: boolean) => void;
  resetBudget: () => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

function calculateBenefits(tier: FareTier): string[] {
  const benefits = [];
  if (tier.carryOn) benefits.push("Mala de Mão");
  if (tier.checkedBag) benefits.push("Mala Despachada");
  if (tier.seatSelection) benefits.push("Seleção de Assento");
  if (tier.changes) benefits.push("Alterações/Reembolso");
  return benefits;
}

export function updateFareTierInBudget(
  budget: BudgetData,
  id: string,
  updates: Partial<FareTier>,
): BudgetData {
  return {
    ...budget,
    fareComparison: {
      ...budget.fareComparison,
      tiers: budget.fareComparison.tiers.map((tier) => {
        if (tier.id !== id) return tier;

        const updated = { ...tier, ...updates };
        const updatedCollections = updates.bagages !== undefined || updates.checkIns !== undefined || updates.changes !== undefined;
        const legacyFieldsUpdated = (
          updates.carryOn !== undefined ||
          updates.checkedBag !== undefined ||
          updates.seatSelection !== undefined ||
          updates.changes !== undefined
        );

        if (updates.benefits === undefined && updatedCollections) {
          updated.benefits = reconcileFareBenefits(tier, updated);
        } else if (updates.benefits === undefined && legacyFieldsUpdated) {
          updated.benefits = calculateBenefits(updated);
        }

        return updated;
      }),
    },
  };
}

export function duplicateHotelInBudget(budget: BudgetData, id: string): BudgetData {
  const sourceIndex = budget.hotels.findIndex((hotel) => hotel.id === id);
  if (sourceIndex === -1) return budget;

  const sourceHotel = budget.hotels[sourceIndex];
  const duplicate: Hotel = {
    ...sourceHotel,
    id: nanoid(),
    name: `${sourceHotel.name} (cópia)`,
    amenities: [...sourceHotel.amenities],
    prices: Object.fromEntries(
      Object.entries(sourceHotel.prices).map(([tierId, price]) => [tierId, { ...price }]),
    ),
  };

  return {
    ...budget,
    hotels: [
      ...budget.hotels.slice(0, sourceIndex + 1),
      duplicate,
      ...budget.hotels.slice(sourceIndex + 1),
    ],
  };
}

export function reorderHotelsInBudget(budget: BudgetData, hotels: Hotel[]): BudgetData {
  return { ...budget, hotels };
}

export function duplicateTourInBudget(budget: BudgetData, id: string): BudgetData {
  const sourceIndex = budget.tours.findIndex((tour) => tour.id === id);
  if (sourceIndex === -1) return budget;

  const sourceTour = budget.tours[sourceIndex];
  const duplicate: Tour = {
    ...sourceTour,
    id: nanoid(),
    name: `${sourceTour.name} (cópia)`,
  };

  return {
    ...budget,
    tours: [
      ...budget.tours.slice(0, sourceIndex + 1),
      duplicate,
      ...budget.tours.slice(sourceIndex + 1),
    ],
  };
}

export function reorderToursInBudget(budget: BudgetData, tours: Tour[]): BudgetData {
  return { ...budget, tours };
}

export function reorderItineraryDaysInBudget(budget: BudgetData, days: ItineraryDay[]): BudgetData {
  return {
    ...budget,
    itinerary: days.map((day, index) => ({ ...day, day: index + 1 })),
  };
}

export function getItineraryDayActivities(day: ItineraryDay): ItineraryActivity[] {
  if (day.activities !== undefined) return day.activities;

  return [{
    id: `${day.id}-legacy-activity`,
    kind: day.tourId ? "tour" : "custom",
    title: day.title || "Dia livre",
    time: "",
    description: day.notes || "",
    linkUrl: "",
    photoUrl: "",
    ticketUrl: "",
    importantNotes: "",
    tourId: day.tourId,
  }];
}

export function addItineraryActivityToBudget(
  budget: BudgetData,
  dayId: string,
  activity: Partial<ItineraryActivity> = {},
): BudgetData {
  return {
    ...budget,
    itinerary: budget.itinerary.map((day) => {
      if (day.id !== dayId) return day;
      const nextActivity: ItineraryActivity = {
        id: nanoid(),
        kind: activity.kind || "custom",
        title: activity.title || "Novo compromisso",
        time: activity.time || "",
        description: activity.description || "",
        linkUrl: activity.linkUrl || "",
        addressUrl: activity.addressUrl || "",
        photoUrl: activity.photoUrl || "",
        ticketUrl: activity.ticketUrl || "",
        importantNotes: activity.importantNotes || "",
        tourId: activity.tourId,
        flightId: activity.flightId,
      };
      return { ...day, activities: [...getItineraryDayActivities(day), nextActivity] };
    }),
  };
}

export function addGastronomyToDayInBudget(budget: BudgetData, dayId: string, optionId: string): BudgetData {
  const option = (budget.gastronomyOptions || []).find((item) => item.id === optionId);
  if (!option) return budget;

  return addItineraryActivityToBudget(budget, dayId, {
    kind: "meal",
    title: option.name,
    description: option.description || [option.location, option.address].filter(Boolean).join(" • "),
    linkUrl: option.website || "",
    addressUrl: option.mapsUrl,
    photoUrl: option.photoUrl || "",
    importantNotes: option.address ? `Local: ${option.address}` : "",
  });
}

export function addGastronomyToUsefulTipsInBudget(budget: BudgetData, optionId: string): BudgetData {
  const option = (budget.gastronomyOptions || []).find((item) => item.id === optionId);
  if (!option) return budget;
  const url = option.website || option.mapsUrl;
  const title = `Gastronomia — ${option.name}`;
  if ((budget.finalItinerary.usefulLinks || []).some((item) => item.url === url && item.title === title)) return budget;

  return {
    ...budget,
    finalItinerary: {
      ...budget.finalItinerary,
      usefulLinks: [
        ...(budget.finalItinerary.usefulLinks || []),
        { id: nanoid(), title, description: [option.location, option.address, option.description].filter(Boolean).join(" • "), url },
      ],
    },
  };
}

export function updateItineraryActivityInBudget(
  budget: BudgetData,
  dayId: string,
  activityId: string,
  updates: Partial<ItineraryActivity>,
): BudgetData {
  return {
    ...budget,
    itinerary: budget.itinerary.map((day) => (
      day.id === dayId
        ? { ...day, activities: getItineraryDayActivities(day).map((activity) => activity.id === activityId ? { ...activity, ...updates } : activity) }
        : day
    )),
  };
}

export function removeItineraryActivityFromBudget(budget: BudgetData, dayId: string, activityId: string): BudgetData {
  return {
    ...budget,
    itinerary: budget.itinerary.map((day) => (
      day.id === dayId
        ? { ...day, activities: getItineraryDayActivities(day).filter((activity) => activity.id !== activityId) }
        : day
    )),
  };
}

export function reorderItineraryActivitiesInBudget(budget: BudgetData, dayId: string, activities: ItineraryActivity[]): BudgetData {
  return {
    ...budget,
    itinerary: budget.itinerary.map((day) => day.id === dayId ? { ...day, activities } : day),
  };
}

export function moveItineraryActivityBetweenDaysInBudget(
  budget: BudgetData,
  sourceDayId: string,
  activityId: string,
  targetDayId: string,
): BudgetData {
  if (sourceDayId === targetDayId) return budget;

  const sourceDay = budget.itinerary.find((day) => day.id === sourceDayId);
  const targetDay = budget.itinerary.find((day) => day.id === targetDayId);
  if (!sourceDay || !targetDay) return budget;

  const sourceActivities = getItineraryDayActivities(sourceDay);
  const activity = sourceActivities.find((item) => item.id === activityId);
  if (!activity) return budget;

  return {
    ...budget,
    itinerary: budget.itinerary.map((day) => {
      if (day.id === sourceDayId) {
        return { ...day, activities: sourceActivities.filter((item) => item.id !== activityId) };
      }
      if (day.id === targetDayId) {
        return { ...day, activities: [...getItineraryDayActivities(day), activity] };
      }
      return day;
    }),
  };
}

function formatQuotationDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function formatQuotationWeekday(date: string): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function importQuotationActivitiesIntoBudget(
  budget: BudgetData,
  activities: QuotationActivity[],
  quotationUrl: string,
): BudgetData {
  const existingTours = new Map(
    budget.tours.map((tour) => [`${tour.name.trim().toLocaleLowerCase("pt-BR")}|${tour.pageUrl || ""}`, tour]),
  );
  const toursById = new Map(budget.tours.map((tour) => [tour.id, tour]));
  const newDaysByDate = new Map<string, ItineraryDay>();

  const chronologicalActivities = [...activities].sort((first, second) => (
    first.date.localeCompare(second.date) || first.name.localeCompare(second.name, "pt-BR")
  ));
  const importedTravelerCount = Math.max(1, Number.parseInt(budget.tripInfo.passengers, 10) || 1);

  for (const activity of chronologicalActivities) {
    const name = activity.name.trim();
    if (!name) continue;

    const pageUrl = activity.pageUrl?.trim() || quotationUrl;
    const tourKey = `${name.toLocaleLowerCase("pt-BR")}|${pageUrl}`;
    const existingTour = existingTours.get(tourKey);
    const tour: Tour = existingTour
      ? {
        ...existingTour,
        location: activity.location?.trim() || existingTour.location,
        duration: activity.duration?.trim() || existingTour.duration,
        description: activity.description.trim() || existingTour.description,
        pageUrl,
        photosUrl: activity.photosUrl?.trim() || existingTour.photosUrl,
      }
      : {
        id: nanoid(),
        name,
        location: activity.location?.trim() || "",
        duration: activity.duration?.trim() || "",
        description: activity.description.trim(),
        totalPrice: 0,
        pricingMode: "perPerson" as const,
        pricePerPerson: 0,
        travelerCount: importedTravelerCount,
        notes: "",
        pageUrl,
        photosUrl: activity.photosUrl?.trim() || "",
    };
    if (existingTour) {
      existingTours.set(tourKey, tour);
    } else {
      existingTours.set(tourKey, tour);
    }
    toursById.set(tour.id, tour);

    const alreadyInItinerary = budget.itinerary.some((day) => getItineraryDayActivities(day).some((item) => item.tourId === tour.id))
      || Array.from(newDaysByDate.values()).some((day) => day.activities?.some((item) => item.tourId === tour.id));
    if (!alreadyInItinerary) {
      const importedDay = newDaysByDate.get(activity.date) || {
        id: nanoid(),
        day: 0,
        date: activity.date,
        title: `${formatQuotationWeekday(activity.date)} — ${formatQuotationDate(activity.date)}`,
        notes: "",
        activities: [],
      };
      importedDay.activities = [
        ...(importedDay.activities || []),
        {
          id: nanoid(),
          kind: "tour",
          title: name,
          time: "",
          description: activity.description.trim(),
          linkUrl: pageUrl,
          photoUrl: activity.photosUrl?.trim() || "",
          ticketUrl: "",
          importantNotes: "",
          tourId: tour.id,
        },
      ];
      newDaysByDate.set(activity.date, importedDay);
    }
  }

  return {
    ...budget,
    tours: Array.from(toursById.values()),
    itinerary: [...budget.itinerary, ...Array.from(newDaysByDate.values())].map((day, index) => ({ ...day, day: index + 1 })),
  };
}

export function resetTourProposalInBudget(budget: BudgetData): BudgetData {
  return {
    ...budget,
    tours: [],
    gastronomyOptions: [],
    itinerary: [],
    tourProposal: {
      title: "Proposta de passeios",
      introMessage: "",
      paymentDetails: "",
      clientName: "",
      installments: 1,
    },
  };
}

function nextFinalItineraryDay(events: FinalItineraryEvent[]) {
  return Math.max(0, ...events.map((event) => event.day)) + 1;
}

function formatFlightForFinalItinerary(flight: Flight) {
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  if (!firstSegment || !lastSegment) return "Informações do voo a confirmar.";
  const flightReference = firstSegment.flightNumber ? `${firstSegment.airline} ${firstSegment.flightNumber}` : firstSegment.airline;
  const route = `${firstSegment.departureCity || firstSegment.departureAirport} → ${lastSegment.arrivalCity || lastSegment.arrivalAirport}`;
  const schedule = [firstSegment.date, firstSegment.departureTime && `saída ${firstSegment.departureTime}`, lastSegment.arrivalTime && `chegada ${lastSegment.arrivalTime}`].filter(Boolean).join(" • ");
  return [flightReference, route, schedule].filter(Boolean).join("\n");
}

export function addFinalItineraryEventToBudget(budget: BudgetData, event: Partial<FinalItineraryEvent> = {}): BudgetData {
  const currentEvents = budget.finalItinerary.events;
  const newEvent: FinalItineraryEvent = {
    id: nanoid(),
    day: event.day || nextFinalItineraryDay(currentEvents),
    kind: event.kind || "custom",
    title: event.title || "Novo compromisso",
    time: event.time || "",
    description: event.description || "",
    linkUrl: event.linkUrl || "",
    addressUrl: event.addressUrl || "",
    photoUrl: event.photoUrl || "",
    summaryVisualUrl: event.summaryVisualUrl || "",
    sourceFlightId: event.sourceFlightId,
    sourceHotelId: event.sourceHotelId,
    sourceTourId: event.sourceTourId,
    hotelAddress: event.hotelAddress || "",
    hotelMapUrl: event.hotelMapUrl || "",
    hotelCheckIn: event.hotelCheckIn || "",
    hotelCheckOut: event.hotelCheckOut || "",
    flightAirline: event.flightAirline || "",
    flightNumber: event.flightNumber || "",
    flightDate: event.flightDate || "",
    flightDepartureAirport: event.flightDepartureAirport || "",
    flightDepartureTime: event.flightDepartureTime || "",
    flightArrivalAirport: event.flightArrivalAirport || "",
    flightArrivalTime: event.flightArrivalTime || "",
    flightDepartureTerminal: event.flightDepartureTerminal || "",
    flightArrivalTerminal: event.flightArrivalTerminal || "",
    attachments: event.attachments || [],
  };
  return {
    ...budget,
    finalItinerary: {
      ...budget.finalItinerary,
      enabled: true,
      events: [...currentEvents, newEvent],
    },
  };
}

export function addFlightToFinalItineraryInBudget(budget: BudgetData, flightId: string): BudgetData {
  const flight = budget.flights.find((item) => item.id === flightId);
  if (!flight || budget.finalItinerary.events.some((event) => event.sourceFlightId === flightId)) return budget;
  const firstSegment = flight.segments[0];
  const isOutbound = flight.type === "ida";
  return addFinalItineraryEventToBudget(budget, {
    day: isOutbound ? 1 : nextFinalItineraryDay(budget.finalItinerary.events),
    kind: isOutbound ? "flight" : "return",
    title: isOutbound ? "Voo de ida" : "Voo de retorno",
    time: firstSegment?.departureTime || "",
    description: formatFlightForFinalItinerary(flight),
    sourceFlightId: flightId,
    flightAirline: firstSegment?.airline || flight.operatingAirline || "",
    flightNumber: firstSegment?.flightNumber || "",
    flightDate: firstSegment?.date || "",
    flightDepartureAirport: firstSegment?.departureAirport || "",
    flightDepartureTime: firstSegment?.departureTime || "",
    flightArrivalAirport: flight.segments[flight.segments.length - 1]?.arrivalAirport || "",
    flightArrivalTime: flight.segments[flight.segments.length - 1]?.arrivalTime || "",
  });
}

export function addHotelToFinalItineraryInBudget(budget: BudgetData, hotelId: string): BudgetData {
  const hotel = budget.hotels.find((item) => item.id === hotelId);
  if (!hotel || budget.finalItinerary.events.some((event) => event.sourceHotelId === hotelId)) return budget;
  return addFinalItineraryEventToBudget(budget, {
    day: 1,
    kind: "hotel",
    title: `Hospedagem — ${hotel.name}`,
    description: [hotel.address, hotel.description].filter(Boolean).join("\n"),
    linkUrl: hotel.hotelUrl || "",
    photoUrl: hotel.photoUrl || "",
    sourceHotelId: hotelId,
    hotelAddress: hotel.address || "",
    hotelMapUrl: hotel.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}` : "",
  });
}

export function addTourToFinalItineraryInBudget(budget: BudgetData, tourId: string): BudgetData {
  const tour = budget.tours.find((item) => item.id === tourId);
  if (!tour || budget.finalItinerary.events.some((event) => event.sourceTourId === tourId)) return budget;
  const itineraryDay = budget.itinerary.find((day) => day.tourId === tourId);
  return addFinalItineraryEventToBudget(budget, {
    day: itineraryDay?.day || nextFinalItineraryDay(budget.finalItinerary.events),
    kind: "tour",
    title: tour.name,
    description: tour.description,
    linkUrl: tour.pageUrl || "",
    photoUrl: tour.photosUrl || "",
    sourceTourId: tourId,
  });
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budget, setBudget] = useState<BudgetData>(defaultBudgetData);

  const updateTripInfo = useCallback((field: string, value: string) => {
    setBudget((prev) => ({
      ...prev,
      tripInfo: { ...prev.tripInfo, [field]: value },
    }));
  }, []);

  const addFlight = useCallback((flight: Flight) => {
    setBudget((prev) => ({
      ...prev,
      flights: [...prev.flights, flight],
    }));
  }, []);

  const updateFlight = useCallback((id: string, flight: Flight) => {
    setBudget((prev) => ({
      ...prev,
      flights: prev.flights.map((f) => (f.id === id ? flight : f)),
    }));
  }, []);

  const removeFlight = useCallback((id: string) => {
    setBudget((prev) => ({
      ...prev,
      flights: prev.flights.filter((f) => f.id !== id),
    }));
  }, []);

  const addHotel = useCallback((hotel: Hotel) => {
    setBudget((prev) => ({
      ...prev,
      hotels: [...prev.hotels, hotel],
    }));
  }, []);

  const updateHotel = useCallback((id: string, hotel: Hotel) => {
    setBudget((prev) => ({
      ...prev,
      hotels: prev.hotels.map((h) => (h.id === id ? hotel : h)),
    }));
  }, []);

  const removeHotel = useCallback((id: string) => {
    setBudget((prev) => ({
      ...prev,
      hotels: prev.hotels.filter((h) => h.id !== id),
    }));
  }, []);

  const duplicateHotel = useCallback((id: string) => {
    setBudget((prev) => duplicateHotelInBudget(prev, id));
  }, []);

  const reorderHotels = useCallback((hotels: Hotel[]) => {
    setBudget((prev) => reorderHotelsInBudget(prev, hotels));
  }, []);

  const addTour = useCallback((tour: Tour) => {
    setBudget((prev) => ({ ...prev, tours: [...prev.tours, tour] }));
  }, []);

  const updateTour = useCallback((id: string, tour: Tour) => {
    setBudget((prev) => ({
      ...prev,
      tours: prev.tours.map((currentTour) => currentTour.id === id ? tour : currentTour),
      itinerary: prev.itinerary.map((day) => (
        day.tourId === id ? { ...day, title: tour.name } : day
      )),
    }));
  }, []);

  const removeTour = useCallback((id: string) => {
    setBudget((prev) => ({
      ...prev,
      tours: prev.tours.filter((tour) => tour.id !== id),
      itinerary: prev.itinerary.map((day) => (
        day.tourId === id ? { ...day, tourId: undefined } : day
      )),
    }));
  }, []);

  const duplicateTour = useCallback((id: string) => {
    setBudget((prev) => duplicateTourInBudget(prev, id));
  }, []);

  const reorderTours = useCallback((tours: Tour[]) => {
    setBudget((prev) => reorderToursInBudget(prev, tours));
  }, []);

  const saveGastronomyOption = useCallback((option: GastronomyOption) => {
    setBudget((prev) => {
      const current = prev.gastronomyOptions || [];
      const exists = current.some((item) => item.id === option.id);
      return { ...prev, gastronomyOptions: exists ? current.map((item) => item.id === option.id ? option : item) : [...current, option] };
    });
  }, []);

  const removeGastronomyOption = useCallback((id: string) => {
    setBudget((prev) => ({ ...prev, gastronomyOptions: (prev.gastronomyOptions || []).filter((option) => option.id !== id) }));
  }, []);

  const addGastronomyToDay = useCallback((dayId: string, optionId: string) => {
    setBudget((prev) => addGastronomyToDayInBudget(prev, dayId, optionId));
  }, []);

  const addGastronomyToUsefulTips = useCallback((optionId: string) => {
    setBudget((prev) => addGastronomyToUsefulTipsInBudget(prev, optionId));
  }, []);

  const addItineraryDay = useCallback(() => {
    setBudget((prev) => {
      const nextDay = Math.max(0, ...prev.itinerary.map((day) => day.day)) + 1;
      return {
        ...prev,
        itinerary: [
          ...prev.itinerary,
          { id: nanoid(), day: nextDay, title: "Dia livre", notes: "", activities: [] },
        ],
      };
    });
  }, []);

  const importItineraryFromQuotation = useCallback((activities: QuotationActivity[], quotationUrl: string) => {
    setBudget((prev) => importQuotationActivitiesIntoBudget(prev, activities, quotationUrl));
  }, []);

  const addItineraryActivity = useCallback((dayId: string, activity: Partial<ItineraryActivity> = {}) => {
    setBudget((prev) => addItineraryActivityToBudget(prev, dayId, activity));
  }, []);

  const updateItineraryActivity = useCallback((dayId: string, activityId: string, updates: Partial<ItineraryActivity>) => {
    setBudget((prev) => updateItineraryActivityInBudget(prev, dayId, activityId, updates));
  }, []);

  const removeItineraryActivity = useCallback((dayId: string, activityId: string) => {
    setBudget((prev) => removeItineraryActivityFromBudget(prev, dayId, activityId));
  }, []);

  const reorderItineraryActivities = useCallback((dayId: string, activities: ItineraryActivity[]) => {
    setBudget((prev) => reorderItineraryActivitiesInBudget(prev, dayId, activities));
  }, []);

  const moveItineraryActivity = useCallback((sourceDayId: string, activityId: string, targetDayId: string) => {
    setBudget((prev) => moveItineraryActivityBetweenDaysInBudget(prev, sourceDayId, activityId, targetDayId));
  }, []);

  const updateTourProposal = useCallback((updates: Partial<TourProposal>) => {
    setBudget((prev) => ({
      ...prev,
      tourProposal: { ...prev.tourProposal, ...updates },
    }));
  }, []);

  const resetTourProposal = useCallback(() => {
    setBudget((prev) => resetTourProposalInBudget(prev));
  }, []);

  const replaceBudget = useCallback((nextBudget: BudgetData) => {
    setBudget(nextBudget);
  }, []);

  const updateFinalItinerary = useCallback((updates: Partial<FinalItinerary>) => {
    setBudget((prev) => ({ ...prev, finalItinerary: { ...prev.finalItinerary, ...updates } }));
  }, []);

  const addFinalItineraryEvent = useCallback((event?: Partial<FinalItineraryEvent>) => {
    setBudget((prev) => addFinalItineraryEventToBudget(prev, event));
  }, []);

  const updateFinalItineraryEvent = useCallback((id: string, updates: Partial<FinalItineraryEvent>) => {
    setBudget((prev) => ({ ...prev, finalItinerary: { ...prev.finalItinerary, events: prev.finalItinerary.events.map((event) => event.id === id ? { ...event, ...updates } : event) } }));
  }, []);

  const removeFinalItineraryEvent = useCallback((id: string) => {
    setBudget((prev) => ({ ...prev, finalItinerary: { ...prev.finalItinerary, events: prev.finalItinerary.events.filter((event) => event.id !== id) } }));
  }, []);

  const reorderFinalItineraryEvents = useCallback((events: FinalItineraryEvent[]) => {
    setBudget((prev) => ({ ...prev, finalItinerary: { ...prev.finalItinerary, events } }));
  }, []);

  const addFlightToFinalItinerary = useCallback((flightId: string) => setBudget((prev) => addFlightToFinalItineraryInBudget(prev, flightId)), []);
  const addHotelToFinalItinerary = useCallback((hotelId: string) => setBudget((prev) => addHotelToFinalItineraryInBudget(prev, hotelId)), []);
  const addTourToFinalItinerary = useCallback((tourId: string) => setBudget((prev) => addTourToFinalItineraryInBudget(prev, tourId)), []);

  const updateItineraryDay = useCallback((id: string, updates: Partial<ItineraryDay>) => {
    setBudget((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day) => day.id === id ? { ...day, ...updates } : day),
    }));
  }, []);

  const removeItineraryDay = useCallback((id: string) => {
    setBudget((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((day) => day.id !== id),
    }));
  }, []);

  const reorderItineraryDays = useCallback((days: ItineraryDay[]) => {
    setBudget((prev) => reorderItineraryDaysInBudget(prev, days));
  }, []);

  const addFareTier = useCallback((tier: Omit<FareTier, "id">) => {
    setBudget((prev) => ({
      ...prev,
      fareComparison: {
        ...prev.fareComparison,
        tiers: [...prev.fareComparison.tiers, { ...tier, id: nanoid() }],
      },
    }));
  }, []);

  const updateFareTier = useCallback((id: string, updates: Partial<FareTier>) => {
    setBudget((prev) => updateFareTierInBudget(prev, id, updates));
  }, []);

  const removeFareTier = useCallback((id: string) => {
    setBudget((prev) => ({
      ...prev,
      fareComparison: {
        ...prev.fareComparison,
        tiers: prev.fareComparison.tiers.filter((t) => t.id !== id),
      },
    }));
  }, []);

  const updateBaggage = useCallback((index: number, field: string, value: string | number) => {
    setBudget((prev) => ({
      ...prev,
      baggage: prev.baggage.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  }, []);

  const updateInstallments = useCallback((field: "flight" | "hotel" | "combined" | "combinedInstallments" | "combinedPaymentSteps" | "hotelDownpayment" | "hotelDownpaymentAmount" | "flightDownpayment" | "flightDownpaymentAmount" | "combinedDownpayment" | "combinedDownpaymentAmount" | "observations" | "flightCashPrice" | "flightCashPaymentMethods" | "flightMachineRate" | "flightInstallmentsWithRate" | "showCashOption", value: number | boolean | string | string[] | Array<CombinedPaymentCondition | CombinedPaymentStep> | undefined) => {
    setBudget((prev) => ({
      ...prev,
      installments: {
        ...prev.installments,
        [field]: value,
      },
    }));
  }, []);

  const updatePaymentMethods = useCallback((methods: string[]) => {
    setBudget((prev) => ({
      ...prev,
      installments: {
        ...prev.installments,
        paymentMethods: methods,
      },
    }));
  }, []);

  const updateHotelPaymentMethods = useCallback((methods: string[]) => {
    setBudget((prev) => ({
      ...prev,
      installments: {
        ...prev.installments,
        hotelPaymentMethods: methods,
      },
    }));
  }, []);

  const updatePageBreaks = useCallback((field: "flights" | "hotels" | "baggage" | "payment", value: boolean) => {
    setBudget((prev) => ({
      ...prev,
      pageBreaks: {
        ...prev.pageBreaks,
        [field]: value,
      },
    }));
  }, []);

  const resetBudget = useCallback(() => {
    setBudget(defaultBudgetData);
  }, []);

  return (
    <BudgetContext.Provider
      value={{
        budget,
        updateTripInfo,
        addFlight,
        updateFlight,
        removeFlight,
        addHotel,
        updateHotel,
        removeHotel,
        duplicateHotel,
        reorderHotels,
        addTour,
        updateTour,
        removeTour,
        duplicateTour,
        reorderTours,
        saveGastronomyOption,
        removeGastronomyOption,
        addGastronomyToDay,
        addGastronomyToUsefulTips,
        addItineraryDay,
        importItineraryFromQuotation,
        addItineraryActivity,
        updateItineraryActivity,
        removeItineraryActivity,
        reorderItineraryActivities,
        moveItineraryActivity,
        updateTourProposal,
        resetTourProposal,
        replaceBudget,
        updateFinalItinerary,
        addFinalItineraryEvent,
        updateFinalItineraryEvent,
        removeFinalItineraryEvent,
        reorderFinalItineraryEvents,
        addFlightToFinalItinerary,
        addHotelToFinalItinerary,
        addTourToFinalItinerary,
        updateItineraryDay,
        removeItineraryDay,
        reorderItineraryDays,
        addFareTier,
        updateFareTier,
        removeFareTier,
        updateBaggage,
        updateInstallments,
        updatePaymentMethods,
        updateHotelPaymentMethods,
        updatePageBreaks,
        resetBudget,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
