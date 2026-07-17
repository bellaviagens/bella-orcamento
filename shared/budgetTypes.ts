// Shared types for the Bella Viagens budget generator

export interface FlightSegment {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureCity: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalCity: string;
  arrivalTime: string;
  date: string;
  duration: string;
}

export interface Flight {
  id: string;
  type: "ida" | "volta";
  segments: FlightSegment[];
  isDirect: boolean;
  totalDuration: string;
  operatingAirline: string;
}

export interface HotelPriceByFare {
  total: number;
  perPerson: number;
}

export interface Hotel {
  id: string;
  name: string;
  stars: number;
  address: string;
  description: string;
  rating: number;
  ratingLabel: string;
  amenities: string[];
  photoUrl: string;
  prices: {
    basic: HotelPriceByFare;
    light: HotelPriceByFare;
    full: HotelPriceByFare;
  };
}

export interface TripInfo {
  destination: string;
  period: string;
  passengers: string;
  airline: string;
  introText: string;
}

export interface FareTier {
  name: string;
  carryOn: boolean;
  checkedBag: boolean;
  seatSelection: boolean;
  changes: boolean;
  flightPrice: number;
}

export interface FareComparison {
  basic: FareTier;
  light: FareTier;
  full: FareTier;
}

export interface BaggageItem {
  type: string;
  weight: string;
  priceAdvance: number;
  priceAirport: number;
}

export interface BudgetData {
  tripInfo: TripInfo;
  flights: Flight[];
  fareComparison: FareComparison;
  baggage: BaggageItem[];
  hotels: Hotel[];
}

export const defaultBudgetData: BudgetData = {
  tripInfo: {
    destination: "",
    period: "",
    passengers: "",
    airline: "",
    introText:
      "Prezadíssimos, segue comparativo de tarifas e hospedagem para sua viagem. Estamos à disposição para quaisquer esclarecimentos.",
  },
  flights: [],
  fareComparison: {
    basic: {
      name: "BASIC",
      carryOn: false,
      checkedBag: false,
      seatSelection: false,
      changes: false,
      flightPrice: 0,
    },
    light: {
      name: "LIGHT",
      carryOn: true,
      checkedBag: false,
      seatSelection: false,
      changes: false,
      flightPrice: 0,
    },
    full: {
      name: "FULL",
      carryOn: true,
      checkedBag: true,
      seatSelection: true,
      changes: true,
      flightPrice: 0,
    },
  },
  baggage: [
    { type: "Mala de Mão", weight: "12kg", priceAdvance: 0, priceAirport: 0 },
    { type: "1ª Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
    { type: "2ª Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
  ],
  hotels: [],
};
