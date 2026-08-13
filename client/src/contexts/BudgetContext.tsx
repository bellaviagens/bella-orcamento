import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { defaultBudgetData, type BudgetData, type Flight, type Hotel, type FareTier, type ItineraryDay, type Tour } from "@shared/budgetTypes";
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
  addItineraryDay: () => void;
  updateItineraryDay: (id: string, updates: Partial<ItineraryDay>) => void;
  removeItineraryDay: (id: string) => void;
  reorderItineraryDays: (days: ItineraryDay[]) => void;
  addFareTier: (tier: Omit<FareTier, "id">) => void;
  updateFareTier: (id: string, tier: Partial<FareTier>) => void;
  removeFareTier: (id: string) => void;
  updateBaggage: (index: number, field: string, value: string | number) => void;
  updateInstallments: (field: "flight" | "hotel" | "combined" | "hotelDownpayment" | "hotelDownpaymentAmount" | "flightDownpayment" | "flightDownpaymentAmount" | "combinedDownpayment" | "combinedDownpaymentAmount" | "observations" | "flightCashPrice" | "flightCashPaymentMethods" | "flightMachineRate" | "flightInstallmentsWithRate" | "showCashOption", value: number | boolean | string | string[] | undefined) => void;
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

  const addItineraryDay = useCallback(() => {
    setBudget((prev) => {
      const nextDay = Math.max(0, ...prev.itinerary.map((day) => day.day)) + 1;
      return {
        ...prev,
        itinerary: [
          ...prev.itinerary,
          { id: nanoid(), day: nextDay, title: "Dia livre", notes: "" },
        ],
      };
    });
  }, []);

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

  const updateInstallments = useCallback((field: "flight" | "hotel" | "combined" | "hotelDownpayment" | "hotelDownpaymentAmount" | "flightDownpayment" | "flightDownpaymentAmount" | "combinedDownpayment" | "combinedDownpaymentAmount" | "observations" | "flightCashPrice" | "flightCashPaymentMethods" | "flightMachineRate" | "flightInstallmentsWithRate" | "showCashOption", value: number | boolean | string | string[] | undefined) => {
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
        addItineraryDay,
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
