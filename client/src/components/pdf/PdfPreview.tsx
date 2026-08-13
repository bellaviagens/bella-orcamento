import { Check, X, Plane, Briefcase, Luggage, Info } from "lucide-react";
// Forma de pagamento integrada dentro de cada bloco de tarifa
import type { BudgetData } from "@shared/budgetTypes";
import { calculateInstallmentWithDownpayment } from "@shared/paymentCalculations";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";

// ===== MAPEAMENTO ESTÁTICO E FIXO DE ÍCONES (igual ao HotelCard) =====
const BENEFIT_ICON_MAP: Record<string, string> = {
  "bolsa ou mochila de ate 10kg": "🎒",
  "bolsa ou mochila de até 10kg": "🎒",
  "bolsa ou mochila": "🎒",
  "mala de mao": "🧳",
  "mala de mão": "🧳",
  "bagagem de mao": "🧳",
  "bagagem de mão": "🧳",
  "carry on": "🧳",
  "bagagem de 10 kg": "🧳",
  "bagagem de 10kg": "🧳",
  "bagagem de 12 kg": "🧳",
  "bagagem de 12kg": "🧳",
  "mala de 10kg": "🧳",
  "mala de 10 kg": "🧳",
  "mala de 12kg": "🧳",
  "mala de 12 kg": "🧳",
  "bagagem de 23 kg": "📦",
  "bagagem de 23kg": "📦",
  "mala de 23kg": "📦",
  "mala de 23 kg": "📦",
  "mala despachada": "📦",
  "checked bag": "📦",
  "bagagem despachada": "📦",
  "mala": "📦",
  "bagagem": "📦",
  "selecao de assento": "💺",
  "seleção de assento": "💺",
  "assento": "💺",
  "seat selection": "💺",
  "alteracao/reembolso sem taxa": "🔄",
  "alteração/reembolso sem taxa": "🔄",
  "alteracao/reembolso com taxa": "🔄",
  "alteração/reembolso com taxa": "🔄",
  "alteracoes": "🔄",
  "alterações": "🔄",
  "alteracoes/reembolso": "🔄",
  "alterações/reembolso": "🔄",
  "reembolso": "💰",
  "changes": "🔄",
  "embarque prioritario": "⚡",
  "embarque prioritário": "⚡",
  "check-in prioritario": "⚡",
  "check-in prioritário": "⚡",
  "check in prioritario": "⚡",
  "check in prioritário": "⚡",
  "embarque": "⚡",
  "check": "⚡",
  "priority boarding": "⚡",
  "priority check-in": "⚡",
};

function getBenefitIcon(benefit: string): string {
  const normalized = benefit.toLowerCase().trim();
  if (BENEFIT_ICON_MAP[normalized]) return BENEFIT_ICON_MAP[normalized];
  const noAccent = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, icon] of Object.entries(BENEFIT_ICON_MAP)) {
    const keyNoAccent = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (noAccent.includes(keyNoAccent) || keyNoAccent.includes(noAccent)) {
      return icon;
    }
  }
  return "🧳";
}

interface PdfPreviewProps {
  data: BudgetData;
  includeAirfare?: boolean;
  includeHotel?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PdfPreview({ data, includeAirfare = true, includeHotel = true }: PdfPreviewProps) {
  const { tripInfo, flights, fareComparison, baggage, hotels } = data;
  const pageBreaks = data.pageBreaks || {};

  // Calculate total for installment display
  const passengerCount = parseInt(tripInfo.passengers) || 1;

  // Calculate total aéreo (flight) price
  // Each tier.flightPrice is per person, so multiply by passengerCount for total
  const flightTotal = includeAirfare ? fareComparison.tiers.reduce((sum, tier) => sum + (tier.flightPrice * passengerCount), 0) : 0;
  const flightPerPerson = fareComparison.tiers.length > 0 ? flightTotal / fareComparison.tiers.length / passengerCount : 0;

  // Calculate total hotel price
  const hotelTotal = includeHotel ? hotels.reduce((sum, hotel) => {
    const effectivePrice = hotel.priceMode === "daily" && hotel.dailyPrice && hotel.nights
      ? hotel.dailyPrice * hotel.nights
      : hotel.totalPrice;
    return sum + effectivePrice;
  }, 0) : 0;

  // Installment calculation
  const installments = data.installments;
  const flightCashPaymentMethods = installments?.flightCashPaymentMethods ?? installments?.paymentMethods ?? [];
  // Use flightInstallmentsWithRate if filled, otherwise use flight
  const flightInstallments = installments?.flightInstallmentsWithRate !== undefined ? installments.flightInstallmentsWithRate : (installments?.flight || 1);
  const hotelInstallments = installments?.hotel || 1;

  const flightTotalWithRate = installments?.flightMachineRate !== undefined
    ? flightTotal * (1 + installments.flightMachineRate / 100)
    : flightTotal;
  const flightBreakdown = calculateInstallmentWithDownpayment(
    flightTotalWithRate,
    flightInstallments,
    installments?.flightDownpayment ? installments.flightDownpaymentAmount : 0,
  );
  const hotelBreakdown = calculateInstallmentWithDownpayment(
    hotelTotal,
    hotelInstallments,
    installments?.hotelDownpayment ? installments.hotelDownpaymentAmount : 0,
  );
  const flightInstallmentValue = flightBreakdown.installmentValue;
  const hotelInstallmentValue = hotelBreakdown.installmentValue;

  const combinedTotal = flightTotalWithRate + hotelTotal;
  const combinedInstallments = flightInstallments;
  const combinedDownpayment = Boolean(
    installments?.flightDownpayment || installments?.combinedDownpayment,
  );
  const combinedDownpaymentAmount = installments?.flightDownpayment
    ? installments.flightDownpaymentAmount
    : installments?.combinedDownpayment
      ? installments.combinedDownpaymentAmount
      : 0;
  const combinedBreakdown = calculateInstallmentWithDownpayment(
    combinedTotal,
    combinedInstallments,
    combinedDownpaymentAmount,
  );
  const combinedInstallmentValue = combinedBreakdown.installmentValue;

  return (
    <div
      id="pdf-document"
      className="bg-slate-50 mx-auto flex flex-col min-h-screen"
      style={{ width: "100%", maxWidth: "1120px", fontFamily: "Inter, sans-serif" }}
    >
      {/* HEADER */}
      <div className="bg-[#1a2e4a] text-white px-4 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
            Bella Viagens e Milhas
          </h1>
          <p className="text-sm text-amber-400 font-medium tracking-wide mt-0.5">
            Acumule. Viaje. Viva.
          </p>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Comparativo de Tarifas & Hospedagem
          </h2>
          {tripInfo.destination && (
            <p className="text-sm text-white/80 mt-0.5">{tripInfo.destination}</p>
          )}
        </div>
      </div>

      {/* TRIP INFO BAR */}
      <div className="bg-slate-100 px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {tripInfo.destination && (
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Destino</div>
            <div className="font-medium text-[#1a2e4a]">{tripInfo.destination}</div>
          </div>
        )}
        {tripInfo.period && (
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Período</div>
            <div className="font-medium text-[#1a2e4a]">{tripInfo.period}</div>
          </div>
        )}
        {tripInfo.passengers && (
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Passageiros</div>
            <div className="font-medium text-[#1a2e4a]">{tripInfo.passengers}</div>
          </div>
        )}
        {tripInfo.airline && (
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Cia. Aérea</div>
            <div className="font-medium text-[#1a2e4a]">{tripInfo.airline}</div>
          </div>
        )}
      </div>

      {/* INTRO TEXT */}
      {tripInfo.introText && (
        <div className="px-4 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{tripInfo.introText}</p>
        </div>
      )}

      {/* FLIGHTS SECTION */}
      {flights.length > 0 && includeAirfare && (
        <div className="px-4 py-4" {...(pageBreaks.flights ? { "data-page-break": "true" } : {})}>
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Horários dos Voos Selecionados
          </h3>
          <div className="space-y-4">
            {flights.map((flight) => (
              <FlightCard key={flight.id} flight={flight} />
            ))}
          </div>
        </div>
      )}

      {/* FARES SECTION - Show when flight is included and NO hotels */}
      {fareComparison.tiers.length > 0 && includeAirfare && !includeHotel && (
        <div className="px-4 py-4" {...(pageBreaks.fares ? { "data-page-break": "true" } : {})}>
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Comparativo de Tarifas
          </h3>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", width: "100%", flexWrap: "nowrap" }}>
            {fareComparison.tiers.slice(0, 2).map((tier) => {
              const totalPrice = tier.flightPrice * passengerCount;
              const perPersonPrice = tier.flightPrice;
              const cashPrice = installments?.flightCashPrice && installments.flightCashPrice > 0
                ? installments.flightCashPrice
                : totalPrice;
              return (
                <div
                  key={tier.id}
                  data-pdf-keep-together="true"
                  style={{ width: "270px", maxWidth: "270px", flexShrink: 0, boxSizing: "border-box" }}
                    className={`rounded-lg border p-2 shadow-sm ${
                    tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  {/* Informações da tarifa e opcionais em colunas laterais, como nos cards com hotel */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "4px", paddingBottom: "4px" }}>
                    <div style={{ flex: "0 0 100px", minWidth: 0 }}>
                      <div
                        className="font-bold mb-1 leading-tight"
                        style={{ fontSize: "11px", color: tier.highlighted ? "#b45309" : "#1d4ed8", overflowWrap: "anywhere" }}
                      >
                        {`Com Aéreo ${tier.name}`}
                      </div>
                      <div
                        className="font-bold mb-0.5"
                        style={{ fontSize: "15px", color: tier.highlighted ? "#d97706" : "#2563eb" }}
                      >
                        {formatCurrency(totalPrice)}
                      </div>
                      <div
                        style={{ fontSize: "10px", color: tier.highlighted ? "#d97706" : "#2563eb", opacity: 0.7 }}
                      >
                        {formatCurrency(perPersonPrice)} / pessoa
                      </div>
                    </div>

                    {tier.benefits && tier.benefits.length > 0 && (
                      <div style={{ display: "flex", flex: "1 1 0%", minWidth: 0, flexWrap: "wrap", columnGap: "4px", rowGap: "2px", alignContent: "flex-start" }}>
                        {tier.benefits.map((benefit, idx) => {
                          const icon = getBenefitIcon(benefit);
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "2px", lineHeight: "1.1", whiteSpace: "nowrap" }}>
                              <span style={{ fontSize: "10px", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                              <span style={{ fontSize: "8.5px", color: "#475569" }}>{benefit}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* FORMA DE PAGAMENTO */}
                  <div className="mt-1 pt-1 border-t border-slate-200" data-pdf-keep-together="true">
                    <div className="text-[9px] font-semibold text-slate-600 uppercase mb-1">Forma de Pagamento</div>
                    <div className="flex gap-2 text-[9px]">
                      {/* Aéreo Parcelado */}
                      <div className="flex-1">
                        <div className="font-semibold text-[9px] uppercase text-slate-500 mb-0.5">Aéreo Parcelado</div>
                        <div className="font-bold text-[11px] text-slate-700">
                          {(() => {
                            if (installments?.flightMachineRate !== undefined && installments?.flightInstallmentsWithRate !== undefined) {
                              const rate = installments.flightMachineRate / 100;
                              const withRate = totalPrice * (1 + rate);
                              const breakdown = calculateInstallmentWithDownpayment(
                                withRate,
                                flightInstallments,
                                installments.flightDownpayment ? installments.flightDownpaymentAmount : 0,
                              );
                              return breakdown.downpaymentAmount > 0
                                ? `1 entrada de ${formatCurrency(breakdown.downpaymentAmount)} + ${breakdown.remainingInstallments}x de ${formatCurrency(breakdown.installmentValue)}`
                                : `${flightInstallments}x de ${formatCurrency(breakdown.installmentValue)}`;
                            } else {
                              const breakdown = calculateInstallmentWithDownpayment(
                                totalPrice,
                                flightInstallments,
                                installments?.flightDownpayment ? installments.flightDownpaymentAmount : 0,
                              );
                              return breakdown.downpaymentAmount > 0
                                ? `1 entrada de ${formatCurrency(breakdown.downpaymentAmount)} + ${breakdown.remainingInstallments}x de ${formatCurrency(breakdown.installmentValue)}`
                                : `${flightInstallments}x de ${formatCurrency(breakdown.installmentValue)}`;
                            }
                          })()}
                        </div>
                        {installments?.flightMachineRate !== undefined && (
                          <div className="mt-0.5 text-[9px] text-slate-500">
                            Taxa da maquininha: {installments.flightMachineRate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                          </div>
                        )}
                        {installments?.paymentMethods?.includes("cartao") && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">Cartão</span>
                          </div>
                        )}
                      </div>
                      
                      {/* À Vista */}
                      {installments?.showCashOption && (
                        <div className="flex-1 border-l border-slate-200 pl-2">
                          <div className="font-semibold text-[9px] uppercase text-slate-500 mb-0.5">Aéreo À Vista</div>
                          <div className="font-bold text-[11px] text-slate-700">1x de {formatCurrency(cashPrice)}</div>
                          {(flightCashPaymentMethods.includes("dinheiro") || flightCashPaymentMethods.includes("pix")) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {flightCashPaymentMethods.includes("dinheiro") && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">Dinheiro</span>
                              )}
                              {flightCashPaymentMethods.includes("pix") && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">PIX</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HOTELS SECTION */}
      {hotels.length > 0 && includeHotel && (
        <div className="px-4 py-8" {...(pageBreaks.hotels ? { "data-page-break": "true" } : {})}>
          <div data-pdf-keep-together="true" data-pdf-hotel-heading-group="true">
            <h3
              className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Opções de Hospedagem
            </h3>
            <div data-hotel-card="true" className="pb-8 border-b-4 border-slate-100 last:border-b-0">
              <HotelCard
                hotel={hotels[0]}
                index={0}
                tiers={fareComparison.tiers}
                passengers={passengerCount}
                includeAirfare={includeAirfare}
                includeHotel={includeHotel}
                hotelPaymentMethods={installments?.hotelPaymentMethods}
                flightPaymentMethods={installments?.paymentMethods}
                combined={installments?.combined}
                hotelInstallments={hotelInstallments}
                hotelDownpayment={installments?.hotelDownpayment}
                hotelDownpaymentAmount={installments?.hotelDownpaymentAmount}
                flightInstallments={flightInstallments}
                flightDownpayment={installments?.flightDownpayment}
                flightDownpaymentAmount={installments?.flightDownpaymentAmount}
                flightMachineRate={installments?.flightMachineRate}
                combinedInstallments={combinedInstallments}
                combinedDownpayment={combinedDownpayment}
                combinedDownpaymentAmount={combinedDownpaymentAmount}
                showCashOption={installments?.showCashOption}
                cashValue={installments?.flightCashPrice}
                cashPaymentMethods={flightCashPaymentMethods}
                observations={installments?.observations}
              />
            </div>
          </div>
          {hotels.length > 1 && (
            <div className="mt-8 space-y-8">
              {hotels.slice(1).map((hotel, idx) => {
                const hotelIndex = idx + 1;
                return (
                  <div key={hotel.id} data-hotel-card="true" className="pb-8 border-b-4 border-slate-100 last:border-b-0" {...(hotel.startOnNewPage ? { "data-page-break": "true" } : {})}>
                    <HotelCard
                      hotel={hotel}
                      index={hotelIndex}
                      tiers={fareComparison.tiers}
                      passengers={passengerCount}
                      includeAirfare={includeAirfare}
                      includeHotel={includeHotel}
                      hotelPaymentMethods={installments?.hotelPaymentMethods}
                      flightPaymentMethods={installments?.paymentMethods}
                      combined={installments?.combined}
                      hotelInstallments={hotelInstallments}
                      hotelDownpayment={installments?.hotelDownpayment}
                      hotelDownpaymentAmount={installments?.hotelDownpaymentAmount}
                      flightInstallments={flightInstallments}
                      flightDownpayment={installments?.flightDownpayment}
                      flightDownpaymentAmount={installments?.flightDownpaymentAmount}
                      flightMachineRate={installments?.flightMachineRate}
                      combinedInstallments={combinedInstallments}
                      combinedDownpayment={combinedDownpayment}
                      combinedDownpaymentAmount={combinedDownpaymentAmount}
                      showCashOption={installments?.showCashOption}
                      cashValue={installments?.flightCashPrice}
                      cashPaymentMethods={flightCashPaymentMethods}
                      observations={installments?.observations}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {installments?.observations && (
        <div className="px-4 pb-4">
          <div data-pdf-keep-together="true" className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-slate-700">
            {installments.observations}
          </div>
        </div>
      )}

      {/* BAGGAGE GUIDE */}
      {baggage.some((b) => b.priceAdvance > 0 || b.priceAirport > 0) && (
        <div className="px-4 py-4" {...(pageBreaks.baggage ? { "data-page-break": "true" } : {})}>
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Guia Prático de Bagagens (Avulsas)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {baggage.map((b, i) => {
              const Icon = i === 0 ? Briefcase : i === 1 ? Luggage : Luggage;
              return (
                <div key={i} className="rounded-xl border border-slate-200 p-4 text-center">
                  <Icon className="h-8 w-8 text-[#1a2e4a] mx-auto mb-2" />
                  <div className="text-sm font-bold text-[#1a2e4a]">{b.type}</div>
                  <div className="text-xs text-slate-500 mb-3">{b.weight}</div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">
                      Antecipado: <span className="font-bold text-[#1a2e4a]">{formatCurrency(b.priceAdvance)}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Aeroporto: <span className="font-bold text-[#1a2e4a]">{formatCurrency(b.priceAirport)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* As formas de pagamento de somente aéreo ficam dentro de cada card de tarifa. */}

      {/* SPACER - Push content up */}
      <div className="flex-grow"></div>

      {/* AVAILABILITY NOTE - Before footer (rodapé da primeira página) */}
      <div className="px-4 py-2">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600 leading-tight">
            <span className="font-bold text-[#1a2e4a]">Nota:</span> Os valores apresentados neste orçamento estão sujeitos a alteração sem aviso prévio, conforme disponibilidade e variação cambial. A confirmação da reserva está condicionada ao pagamento e emissão dentro do prazo de validade informado.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#1a2e4a] text-white px-4 py-4 mt-8">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/70">
            Bella Viagens e Milhas | Acumule. Viaje. Viva.
          </p>
          <p className="text-xs text-white/70">
            Orçamento válido por 7 dias
          </p>
        </div>
      </div>
    </div>
  );
}
