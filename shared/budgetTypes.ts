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
  hotelUrl?: string; // Booking, Airbnb, etc
  totalPrice: number; // Preço total do hotel (para toda a hospedagem)
  prices: Record<string, HotelPriceByFare>; // tierId -> prices
}

export interface TripInfo {
  destination: string;
  period: string;
  passengers: string;
  airline: string;
  introText: string;
}

export interface FareTier {
  id: string;
  name: string;
  bagageType?: string; // Bagagem de mão, 10kg, 23kg
  checkInType?: string; // Embarque prioritário, Check-in prioritário
  changes?: string; // Alteração/Reembolso sem taxa, com taxa
  flightPrice: number;
  highlighted?: boolean; // para destacar uma tarifa
  paymentMethods?: string[]; // Cartão, Dinheiro, PIX
  installments?: number; // Número de parcelas
  benefits?: string[]; // benefícios da tarifa para exibir no orçamento
  // Manter compatibilidade com dados antigos
  carryOn?: boolean;
  checkedBag?: boolean;
  seatSelection?: boolean;
}

export interface FareComparison {
  tiers: FareTier[];
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
    tiers: [],
  },
  baggage: [
    { type: "Mala de Mão", weight: "12kg", priceAdvance: 0, priceAirport: 0 },
    { type: "1ª Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
    { type: "2ª Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
  ],
  hotels: [],
};
