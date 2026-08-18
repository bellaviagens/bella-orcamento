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
  paymentNotes?: string; // Observações customizáveis para o bloco de formas de pagamento
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

export interface Tour {
  id: string;
  name: string;
  location: string;
  duration: string;
  description: string;
  totalPrice: number;
  pricingMode?: "perPerson" | "total";
  pricePerPerson?: number;
  travelerCount?: number;
  childPrice?: number;
  childCount?: number;
  notes?: string;
  pageUrl?: string;
  photosUrl?: string;
}

export interface TourProposal {
  title: string;
  introMessage: string;
  paymentDetails: string;
  clientName?: string;
  installments?: number;
  /** Densidade tipográfica escolhida para os cartões do resumo na capa. */
  coverSummaryFontSize?: "small" | "medium" | "large";
  /** Dias escolhidos manualmente para o resumo da capa; ausente mantém os seis primeiros dias. */
  coverSummaryDayIds?: string[];
}

/** Opção gastronômica pesquisada e validada pela consultora para uso no roteiro. */
export interface GastronomyOption {
  id: string;
  name: string;
  location: string;
  address: string;
  description: string;
  website?: string;
  mapsUrl: string;
  photoUrl?: string;
  rating?: number;
}

export type FinalItineraryEventKind = "arrival" | "transfer" | "hotel" | "flight" | "return" | "tour" | "custom";

export type FinalItineraryAttachmentDocumentType = "boarding_pass" | "ticket" | "itinerary" | "document";

export interface FinalItineraryAttachment {
  id: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
  passengerId?: string;
  /** Nome identificado diretamente no cartão de embarque, quando disponível. */
  passengerName?: string;
  /** Assento identificado diretamente no cartão de embarque, quando disponível. */
  seat?: string;
  /** Classificação identificada no documento anexado para apresentar o rótulo correto. */
  documentType?: FinalItineraryAttachmentDocumentType;
}

export interface FinalItineraryBaggageItem {
  id: string;
  label: string;
  packed: boolean;
}

export interface FinalItineraryPassenger {
  id: string;
  name: string;
  baggageChecklist?: FinalItineraryBaggageItem[];
}

export interface FinalItineraryUsefulLink {
  id: string;
  title: string;
  description: string;
  url: string;
}

export interface FinalItineraryWelcomeMessageTemplate {
  id: string;
  name: string;
  message: string;
}

export interface FinalItineraryEvent {
  id: string;
  day: number;
  kind: FinalItineraryEventKind;
  title: string;
  time: string;
  description: string;
  linkUrl: string;
  /** Link separado para endereço ou mapa, especialmente útil para restaurantes. */
  addressUrl?: string;
  photoUrl: string;
  /** Ícone ou imagem opcional exibido no resumo cronológico da capa. */
  summaryVisualUrl?: string;
  sourceFlightId?: string;
  sourceHotelId?: string;
  sourceTourId?: string;
  hotelAddress?: string;
  hotelMapUrl?: string;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  flightAirline?: string;
  flightNumber?: string;
  flightLocator?: string;
  flightDate?: string;
  flightDepartureAirport?: string;
  flightDepartureTime?: string;
  flightArrivalAirport?: string;
  flightArrivalTime?: string;
  flightDepartureTerminal?: string;
  flightDepartureGate?: string;
  flightArrivalTerminal?: string;
  attachments?: FinalItineraryAttachment[];
}

export interface FinalItinerary {
  enabled: boolean;
  title: string;
  introMessage: string;
  /** Imagem opcional do destino exibida na capa do roteiro. */
  coverImageUrl?: string;
  /** Define a densidade da capa gerada no preview e no PDF. */
  coverMode?: "compact" | "detailed";
  essentialInfo?: string;
  emergencyContacts?: string;
  /** Modelos salvos para reaproveitar mensagens de abertura. */
  welcomeMessageTemplates?: FinalItineraryWelcomeMessageTemplate[];
  /** Texto editável enviado junto ao link compartilhável. */
  shareMessage?: string;
  shareToken?: string;
  shareExpiresAt?: string;
  passengers?: FinalItineraryPassenger[];
  usefulLinks?: FinalItineraryUsefulLink[];
  events: FinalItineraryEvent[];
}

export type ItineraryActivityKind = "tour" | "flight" | "meal" | "custom";

export interface ItineraryActivity {
  id: string;
  kind: ItineraryActivityKind;
  title: string;
  time: string;
  description: string;
  linkUrl: string;
  /** Link separado para o endereço/mapa, usado nas opções gastronômicas. */
  addressUrl?: string;
  photoUrl: string;
  ticketUrl?: string;
  importantNotes?: string;
  tourId?: string;
  flightId?: string;
}

export interface ItineraryDay {
  id: string;
  day: number;
  title: string;
  tourId?: string;
  notes: string;
  /** Data ISO para organizar e apresentar os compromissos do dia. */
  date?: string;
  /** Atividades do mesmo dia. Ausente em propostas antigas, que seguem usando os campos legados acima. */
  activities?: ItineraryActivity[];
}

export interface QuotationActivity {
  name: string;
  date: string;
  description: string;
  location?: string;
  duration?: string;
  pageUrl?: string;
  photosUrl?: string;
}

export interface BudgetData {
  tripInfo: TripInfo;
  flights: Flight[];
  fareComparison: FareComparison;
  baggage: BaggageItem[];
  hotels: Hotel[];
  tours: Tour[];
  /** Catálogo opcional de restaurantes e experiências gastronômicas da viagem. */
  gastronomyOptions?: GastronomyOption[];
  itinerary: ItineraryDay[];
  tourProposal: TourProposal;
  finalItinerary: FinalItinerary;
  installments?: {
    flight?: number; // Parcelamento do aéreo
    hotel?: number; // Parcelamento do hotel
    combined?: boolean; // Se true, soma aéreo + hotel e divide pelas parcelas
    combinedInstallments?: number; // Parcelamento próprio quando aéreo + hotel são somados
    combinedPaymentSteps?: Array<
      import("./combinedPaymentPlan").CombinedPaymentCondition | import("./combinedPaymentPlan").CombinedPaymentStep
    >; // Condições independentes, cada uma com suas formas internas de pagamento
    paymentMethods?: string[]; // Formas de pagamento do aéreo: "dinheiro", "cartao", "pix"
    hotelPaymentMethods?: string[]; // Formas de pagamento do hotel: "dinheiro", "cartao", "pix"
    hotelDownpayment?: boolean; // Se true, tem entrada no hotel
    hotelDownpaymentAmount?: number; // Valor da entrada do hotel
    flightDownpayment?: boolean; // Se true, tem entrada no aéreo
    flightDownpaymentAmount?: number; // Valor da entrada do aéreo
    combinedDownpayment?: boolean; // Se true, tem entrada quando parcelar tudo junto
    combinedDownpaymentAmount?: number; // Valor da entrada quando parcelar tudo junto
    observations?: string; // Observações customizáveis para o parcelamento (aparece em todos os blocos)
    // Calculadora de taxas para aéreo
    flightCashPrice?: number; // Valor à vista do aéreo (para calcular com taxa)
    flightCashPaymentMethods?: string[]; // Formas de pagamento da condição aérea à vista: "dinheiro", "pix"
    flightMachineRate?: number; // Taxa da maquininha em % (ex: 2.5 para 2.5%)
    flightInstallmentsWithRate?: number; // Número de parcelas com taxa
    showCashOption?: boolean; // Se true, mostra a opção de pagamento à vista no PDF
  };
  pageBreaks?: {
    flights?: boolean; // Iniciar voos em nova página
    fares?: boolean; // Iniciar tarifas em nova página
    hotels?: boolean; // Iniciar hotéis em nova página
    baggage?: boolean; // Iniciar bagagem em nova página
    payment?: boolean; // Iniciar pagamento em nova página
  };
}

export const DEFAULT_FINAL_ITINERARY_WELCOME_MESSAGE = "Olá! Seja bem-vindo(a) ao seu roteiro de viagem. Reunimos abaixo horários, documentos e contatos importantes para que você aproveite cada momento com tranquilidade.";
export const DEFAULT_FINAL_ITINERARY_SHARE_MESSAGE = "Olá! Preparamos seu roteiro de viagem com os horários, documentos e contatos importantes.";
export const DEFAULT_FINAL_ITINERARY_WELCOME_TEMPLATES: FinalItineraryWelcomeMessageTemplate[] = [
  { id: "welcome-standard", name: "Viagem padrão", message: DEFAULT_FINAL_ITINERARY_WELCOME_MESSAGE },
  { id: "welcome-honeymoon", name: "Lua de mel", message: "Olá, casal! É uma alegria fazer parte deste momento tão especial. Preparamos o roteiro da sua lua de mel com carinho, para que vocês aproveitem cada experiência com tranquilidade." },
  { id: "welcome-family", name: "Viagem em família", message: "Olá, família! Preparamos este roteiro para que todos aproveitem a viagem com conforto, organização e momentos inesquecíveis juntos." },
];

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
    { type: "Mala de Mão", weight: "12kg", priceAdvance: 0, priceAirport: 0 },
    { type: "Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
    { type: "2ª Mala Despachada", weight: "23kg", priceAdvance: 0, priceAirport: 0 },
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
  tours: [],
  gastronomyOptions: [],
  itinerary: [],
  tourProposal: {
    title: "Proposta de passeios",
    introMessage: "",
    paymentDetails: "",
    coverSummaryFontSize: "medium",
  },
  finalItinerary: {
    enabled: false,
    title: "Roteiro final da viagem",
    introMessage: DEFAULT_FINAL_ITINERARY_WELCOME_MESSAGE,
    coverImageUrl: "",
    coverMode: "detailed",
    essentialInfo: "",
    emergencyContacts: "",
    welcomeMessageTemplates: DEFAULT_FINAL_ITINERARY_WELCOME_TEMPLATES.map((template) => ({ ...template })),
    shareMessage: DEFAULT_FINAL_ITINERARY_SHARE_MESSAGE,
    passengers: [],
    events: [],
  },
  installments: {
    flight: 4,
    hotel: 10,
    combined: false,
    paymentMethods: ["dinheiro", "cartao", "pix"],
    hotelPaymentMethods: ["dinheiro", "cartao", "pix"],
  },
};
