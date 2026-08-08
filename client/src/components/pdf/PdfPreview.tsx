import { Check, X, Plane, Briefcase, Luggage, Info } from "lucide-react";
// Forma de pagamento integrada dentro de cada bloco de tarifa
import type { BudgetData } from "@shared/budgetTypes";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";

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
  // Use flightInstallmentsWithRate if filled, otherwise use flight
  const flightInstallments = installments?.flightInstallmentsWithRate !== undefined ? installments.flightInstallmentsWithRate : (installments?.flight || 1);
  const hotelInstallments = installments?.hotel || 1;

  const flightInstallmentValue = flightTotal > 0 ? flightTotal / flightInstallments : 0;
  const hotelInstallmentValue = hotelTotal > 0 ? hotelTotal / hotelInstallments : 0;

  const combinedTotal = flightTotal + hotelTotal;
  const combinedInstallments = Math.max(flightInstallments, hotelInstallments);
  const combinedInstallmentValue = combinedTotal > 0 ? combinedTotal / combinedInstallments : 0;

  return (
    <div
      id="pdf-document"
      className="bg-slate-50 mx-auto flex flex-col min-h-screen"
      style={{ width: "100%", maxWidth: "800px", fontFamily: "Inter, sans-serif" }}
    >
      {/* HEADER */}
      <div className="bg-[#1a2e4a] text-white px-8 py-6 flex items-center justify-between">
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
      <div className="bg-slate-100 px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        <div className="px-8 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">{tripInfo.introText}</p>
        </div>
      )}

      {/* FLIGHTS SECTION */}
      {flights.length > 0 && includeAirfare && (
        <div className="px-8 py-4" {...(pageBreaks.flights ? { "data-page-break": "true" } : {})}>
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

      {/* FARES SECTION - Show when flight is included */}
      {fareComparison.tiers.length > 0 && includeAirfare && (
        <div className="px-8 py-4" {...(pageBreaks.fares ? { "data-page-break": "true" } : {})}>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(fareComparison.tiers.length, 3)}, 1fr)` }}>
            {fareComparison.tiers.map((tier) => {
              const totalPrice = tier.flightPrice * passengerCount;
              const perPersonPrice = tier.flightPrice;
              return (
                <div
                  key={tier.id}
                  className={`rounded-lg border p-2 shadow-sm ${
                    tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200"
                  }`}
                >
                  {/* Title in one line */}
                  <div className={`text-[9px] font-bold mb-1 uppercase whitespace-nowrap ${tier.highlighted ? "text-amber-700" : "text-blue-700"}`}>
                    {tier.name}
                  </div>
                  
                  {/* Price info */}
                  <div className={`text-sm font-bold mb-0.5 ${tier.highlighted ? "text-amber-600" : "text-blue-600"}`}>
                    {formatCurrency(totalPrice)}
                  </div>
                  <div className={`text-[8px] mb-2 ${tier.highlighted ? "text-amber-600/70" : "text-blue-600/70"}`}>
                    {formatCurrency(perPersonPrice)} / pessoa
                  </div>
                  
                  {/* Benefits with icons - max 3 per line */}
                  {tier.benefits && tier.benefits.length > 0 && (
                    <div className="text-[8px] text-slate-500 flex flex-wrap gap-1">
                      {tier.benefits.map((benefit, idx) => {
                        const benefitIcons: Record<string, string> = {
                          "mala de mao": "🧳",
                          "mala despachada": "📦",
                          "selecao de assento": "💺",
                          "alteracoes": "🔄",
                          "reembolso": "💰",
                          "carry on": "🧳",
                          "checked bag": "📦",
                          "seat selection": "💺",
                          "changes": "🔄",
                        };
                        const benefitLower = benefit.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        const icon = Object.entries(benefitIcons).find(([key]) => benefitLower.includes(key))?.[1] || "✓";
                        // Max 3 items per line
                        const isLineBreak = idx > 0 && idx % 3 === 0;
                        return (
                          <div key={idx} className={`flex items-center gap-0.5 ${isLineBreak ? "basis-full" : ""}`}>
                            <span>{icon}</span>
                            <span>{benefit}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* FORMA DE PAGAMENTO - dentro de cada tarifa */}
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-[8px] font-semibold text-slate-600 uppercase mb-2">Forma de Pagamento</div>
                    <div className="flex gap-2 text-[8px]">
                      {/* Aéreo Parcelado - SEMPRE */}
                      <div className="flex-1">
                        <div className="font-bold text-slate-700">
                          {(() => {
                            // Use flightInstallments which is already set correctly above
                            if (installments?.flightMachineRate !== undefined && installments?.flightInstallmentsWithRate !== undefined) {
                              const rate = installments.flightMachineRate / 100;
                              const withRate = totalPrice * (1 + rate);
                              const installmentValue = withRate / flightInstallments;
                              return `${flightInstallments}x de ${formatCurrency(installmentValue)}`;
                            } else {
                              return `${flightInstallments}x de ${formatCurrency(totalPrice / flightInstallments)}`;
                            }
                          })()}
                        </div>
                      </div>
                      
                      {/* OU */}
                      {installments?.showCashOption && (
                        <>
                          <div className="text-slate-400 font-bold">ou</div>
                          {/* Aéreo À Vista - APENAS SE MARCADO */}
                          <div className="flex-1">
                            <div className="font-bold text-slate-700">
                              1x de {formatCurrency(totalPrice)}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Observations for flight-only section */}
          {installments?.observations && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-slate-700">
              {installments.observations}
            </div>
          )}
        </div>
      )}

      {/* HOTELS SECTION */}
      {hotels.length > 0 && includeHotel && (
        <div className="px-8 py-8" {...(pageBreaks.hotels ? { "data-page-break": "true" } : {})}>
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Opções de Hospedagem
          </h3>
          <div className="space-y-8">
            {hotels.map((hotel, idx) => {
              return (
                <div key={hotel.id} data-hotel-card="true" className="pb-8 border-b-4 border-slate-100 last:border-b-0" {...(hotel.startOnNewPage && idx > 0 ? { "data-page-break": "true" } : {})}>
                  <HotelCard
                    hotel={hotel}
                    index={idx}
                    tiers={fareComparison.tiers}
                    passengers={passengerCount}
                    includeAirfare={includeAirfare}
                    includeHotel={includeHotel}
                    hotelPaymentMethods={installments?.hotelPaymentMethods}
                    flightPaymentMethods={installments?.paymentMethods}
                    combined={installments?.combined}
                    hotelInstallments={installments?.hotel || 1}
                    hotelDownpayment={installments?.hotelDownpayment}
                    hotelDownpaymentAmount={installments?.hotelDownpaymentAmount}
                    flightInstallments={installments?.flight || 1}
                    flightDownpayment={installments?.flightDownpayment}
                    flightDownpaymentAmount={installments?.flightDownpaymentAmount}
                    combinedInstallments={Math.max(installments?.flight || 1, installments?.hotel || 1)}
                    combinedDownpayment={installments?.combinedDownpayment}
                    combinedDownpaymentAmount={installments?.combinedDownpaymentAmount}
                    observations={installments?.observations}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BAGGAGE GUIDE */}
      {baggage.some((b) => b.priceAdvance > 0 || b.priceAirport > 0) && (
        <div className="px-8 py-4" {...(pageBreaks.baggage ? { "data-page-break": "true" } : {})}>
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

      {/* INSTALLMENTS SECTION - Only for flights when hotels are not included */}
      {includeAirfare && !includeHotel && (installments?.flight || installments?.hotel) && (
        <div className="px-8 py-4" {...(pageBreaks.payment ? { "data-page-break": "true" } : {})}>
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Formas de Pagamento
          </h3>
          <div className="space-y-3">
            {installments?.combined ? (
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <div className="text-sm font-semibold text-[#1a2e4a] mb-2">
                  Parcelamento Total: Aéreo + Hotel
                </div>
                <div className="text-2xl font-bold text-[#1a2e4a]">
                  {combinedInstallments}x de {formatCurrency(combinedInstallmentValue)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Valor total: {formatCurrency(combinedTotal)}
                </div>
                {installments?.paymentMethods && installments.paymentMethods.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {installments.paymentMethods.map((method) => (
                      <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {includeAirfare && installments?.flight && flightTotal > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Aéreo</div>
                    <div className="text-xl font-bold text-[#1a2e4a]">
                      {flightInstallments}x de {formatCurrency(flightInstallmentValue)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Total: {formatCurrency(flightTotal)}
                    </div>
                    {installments?.paymentMethods && installments.paymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {installments.paymentMethods.map((method) => (
                          <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {includeAirfare && installments?.flightCashPrice && installments?.flightMachineRate !== undefined && installments?.flightInstallmentsWithRate && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Aéreo</div>
                    <div className="text-xl font-bold text-[#1a2e4a]">
                      {(() => {
                        const cashPrice = installments.flightCashPrice;
                        const rate = installments.flightMachineRate / 100;
                        const withRate = cashPrice * (1 + rate);
                        const installmentValue = withRate / installments.flightInstallmentsWithRate;
                        return `${installments.flightInstallmentsWithRate}x de ${formatCurrency(installmentValue)}`;
                      })()}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {(() => {
                        const cashPrice = installments.flightCashPrice;
                        const rate = installments.flightMachineRate / 100;
                        const withRate = cashPrice * (1 + rate);
                        return `Total: ${formatCurrency(withRate)}`;
                      })()}
                    </div>
                    {installments?.paymentMethods && installments.paymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {installments.paymentMethods.map((method) => (
                          <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* SPACER - Push content up */}
      <div className="flex-grow"></div>

      {/* AVAILABILITY NOTE - Before footer (rodapé da primeira página) */}
      <div className="px-8 py-2">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-600 leading-tight">
            <span className="font-bold text-[#1a2e4a]">Nota:</span> Os valores apresentados neste orçamento estão sujeitos a alteração sem aviso prévio, conforme disponibilidade e variação cambial. A confirmação da reserva está condicionada ao pagamento e emissão dentro do prazo de validade informado.
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-[#1a2e4a] text-white px-8 py-4 mt-8">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/70">
            Bella Viagens e Milhas | Acumule. Viaje. Viva.
          </p>
          <p className="text-xs text-white/70">Página 1</p>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({
  label,
  tiers,
  field,
}: {
  label: string;
  tiers: any[];
  field: "carryOn" | "checkedBag" | "seatSelection" | "changes";
}) {
  return (
    <>
      <div className="border-t border-slate-200 p-3 text-xs font-medium text-slate-600">{label}</div>
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`border-t border-slate-200 p-3 flex items-center justify-center ${
            tier.highlighted ? "bg-amber-400/10" : ""
          }`}
        >
          {tier[field] ? (
            <Check className={`h-4 w-4 ${tier.highlighted ? "text-amber-600" : "text-green-600"}`} />
          ) : (
            <X className="h-4 w-4 text-slate-300" />
          )}
        </div>
      ))}
    </>
  );
}
