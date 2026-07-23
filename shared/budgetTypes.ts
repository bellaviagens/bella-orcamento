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
  priceMode?: "total" | "daily"; // Se "daily", usa dailyPrice * nights
  dailyPrice?: number; // Preço por diária
  nights?: number; // Número de diárias
  startOnNewPage?: boolean; // Se true, começa em nova página no PDF
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
  bagages?: string[]; // Múltiplas opções de bagagem
  checkIns?: string[]; // Múltiplas opções de check-in
  changes?: string[]; // Múltiplas opções de alteração/reembolso
  flightPrice: number;
  highlighted?: boolean; // para destacar uma tarifa
  paymentMethods?: string[]; // Cartão, Dinheiro, PIX
  installments?: number; // Número de parcelas
  benefits?: string[]; // benefícios da tarifa para exibir no orçamento
  // Manter compatibilidade com dados antigos
  carryOn?: boolean;
  checkedBag?: boolean;
  seatSelection?: boolean;
  bagageType?: string;
  checkInType?: string;
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
  installments?: {
    flight?: number; // Parcelamento do aéreo
    hotel?: number; // Parcelamento do hotel
    combined?: boolean; // Se true, soma aéreo + hotel e divide pelas parcelas
    paymentMethods?: string[]; // Formas de pagamento do aéreo: "dinheiro", "cartao", "pix"
    hotelPaymentMethods?: string[]; // Formas de pagamento do hotel: "dinheiro", "cartao", "pix"
  };
  pageBreaks?: {
    flights?: boolean; // Iniciar voos em nova página
    fares?: boolean; // Iniciar tarifas em nova página
    hotels?: boolean; // Iniciar hotéis em nova página
    baggage?: boolean; // Iniciar bagagem em nova página
    payment?: boolean; // Iniciar pagamento em nova página
  };
}

export const defaultBudgetData: BudgetData = {
  tripInfo: {
    destination: "Santiago, Chile",
    period: "15/01 - 22/01",
    passengers: "2",
    airline: "LATAM",
    introText:
      "Prezadíssimos, segue comparativo de tarifas e hospedagem para sua viagem. Estamos à disposição para quaisquer esclarecimentos.",
  },
  flights: [
    {
      id: "flight-1",
      type: "ida",
      segments: [
        {
          airline: "LATAM",
          flightNumber: "LA 501",
          departureAirport: "GIG",
          departureCity: "Rio de Janeiro",
          departureTime: "14:00",
          arrivalAirport: "SCL",
          arrivalCity: "Santiago",
          arrivalTime: "18:30",
          date: "15/01/2026",
          duration: "4h 30m",
        },
      ],
      isDirect: true,
      totalDuration: "4h 30m",
      operatingAirline: "LATAM",
    },
  ],
  fareComparison: {
    tiers: [
      {
        id: "tier-1",
        name: "Basica",
        flightPrice: 2500,
        highlighted: false,
        carryOn: true,
        checkedBag: false,
        seatSelection: false,
        changes: [],
        benefits: ["Mala de Mao"],
      },
      {
        id: "tier-2",
        name: "Plus",
        flightPrice: 3500,
        highlighted: true,
        carryOn: true,
        checkedBag: true,
        seatSelection: true,
        changes: ["Alteracoes/Reembolso"],
        benefits: ["Mala de Mao", "Mala Despachada", "Selecao de Assento", "Alteracoes/Reembolso"],
      },
    ],
  },
  baggage: [
    { type: "Mala de Mao 12kg", weight: "", priceAdvance: 0, priceAirport: 0 },
    { type: "Mala Despachada 23kg", weight: "", priceAdvance: 0, priceAirport: 0 },
    { type: "2a Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
  ],
  hotels: [
    {
      id: "hotel-1",
      name: "Hotel Presidente",
      stars: 4,
      address: "Av. Bernardo O'Higgins 1570, Santiago",
      description: "Hotel de luxo no coracao de Santiago",
      rating: 8.5,
      ratingLabel: "Excelente",
      amenities: ["WiFi Gratis", "Piscina", "Academia", "Restaurante"],
      photoUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500",
      hotelUrl: "https://www.booking.com",
      totalPrice: 5500,
      prices: {},
      priceMode: "total",
      nights: 7,
    },
    {
      id: "hotel-2",
      name: "Hotel Lastarria",
      stars: 3,
      address: "Calle Lastarria 50, Santiago",
      description: "Hotel boutique no bairro artistico",
      rating: 8.0,
      ratingLabel: "Muito Bom",
      amenities: ["WiFi Gratis", "Bar", "Cafe"],
      photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
      hotelUrl: "https://www.booking.com",
      totalPrice: 3800,
      prices: {},
      priceMode: "total",
      nights: 7,
    },
  ],
  installments: {
    flight: 4,
    hotel: 10,
    combined: false,
    paymentMethods: ["dinheiro", "cartao", "pix"],
    hotelPaymentMethods: ["dinheiro", "cartao", "pix"],
  },
};
