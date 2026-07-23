import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { defaultBudgetData, type BudgetData, type Flight, type Hotel, type FareTier } from "@shared/budgetTypes";
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
  addFareTier: (tier: Omit<FareTier, "id">) => void;
  updateFareTier: (id: string, tier: Partial<FareTier>) => void;
  removeFareTier: (id: string) => void;
  updateBaggage: (index: number, field: string, value: string | number) => void;
  updateInstallments: (field: "flight" | "hotel" | "combined" | "hotelDownpayment" | "hotelDownpaymentAmount" | "flightDownpayment" | "flightDownpaymentAmount" | "combinedDownpayment" | "combinedDownpaymentAmount", value: number | boolean | undefined) => void;
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
    setBudget((prev) => ({
      ...prev,
      fareComparison: {
        ...prev.fareComparison,
        tiers: prev.fareComparison.tiers.map((t) => {
          if (t.id === id) {
            const updated = { ...t, ...updates };
            // Recalcular benefícios se algum checkbox foi alterado
            if (
              updates.carryOn !== undefined ||
              updates.checkedBag !== undefined ||
              updates.seatSelection !== undefined ||
              updates.changes !== undefined
            ) {
              updated.benefits = calculateBenefits(updated);
            }
            return updated;
          }
          return t;
        }),
      },
    }));
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

  const updateInstallments = useCallback((field: "flight" | "hotel" | "combined" | "hotelDownpayment" | "hotelDownpaymentAmount" | "flightDownpayment" | "flightDownpaymentAmount" | "combinedDownpayment" | "combinedDownpaymentAmount", value: number | boolean | undefined) => {
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
