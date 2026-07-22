import { Check, X, Plane, Briefcase, Luggage, Info } from "lucide-react";
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
  const flightTotal = includeAirfare ? fareComparison.tiers.reduce((sum, tier) => sum + tier.flightPrice, 0) : 0;
  const flightPerPerson = fareComparison.tiers.length > 0 ? flightTotal / fareComparison.tiers.length : 0;

  // Calculate total hotel price
  const hotelTotal = includeHotel ? hotels.reduce((sum, hotel) => {
    const effectivePrice = hotel.priceMode === "daily" && hotel.dailyPrice && hotel.nights
      ? hotel.dailyPrice * hotel.nights
      : hotel.totalPrice;
    return sum + effectivePrice;
  }, 0) : 0;

  // Installment calculation
  const installments = data.installments;
  const flightInstallments = installments?.flight || 1;
  const hotelInstallments = installments?.hotel || 1;

  const flightInstallmentValue = flightTotal > 0 ? flightTotal / flightInstallments : 0;
  const hotelInstallmentValue = hotelTotal > 0 ? hotelTotal / hotelInstallments : 0;

  const combinedTotal = flightTotal + hotelTotal;
  const combinedInstallments = Math.max(flightInstallments, hotelInstallments);
  const combinedInstallmentValue = combinedTotal > 0 ? combinedTotal / combinedInstallments : 0;

  return (
    <div
      id="pdf-document"
      className="bg-slate-50 mx-auto"
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

      {/* FARES SECTION - Only when flight is included AND (no hotels OR hotels are disabled) */}
      {fareComparison.tiers.length > 0 && includeAirfare && includeHotel === false && (
        <div className="px-8 py-4" {...(pageBreaks.fares ? { "data-page-break": "true" } : {})}>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(fareComparison.tiers.length, 3)}, 1fr)` }}>
            {fareComparison.tiers.map((tier) => {
              const totalPrice = tier.flightPrice;
              const perPersonPrice = tier.flightPrice / passengerCount;
              return (
                <div
                  key={tier.id}
                  className={`rounded-lg border-l-4 border border-slate-200 p-4 text-center shadow-sm ${
                    tier.highlighted ? "bg-amber-50 border-l-amber-400 border-amber-300" : "bg-white border-l-blue-400"
                  }`}
                >
                  <div className={`text-[10px] font-bold mb-2 uppercase tracking-wide ${tier.highlighted ? "text-amber-700" : "text-blue-700"}`}>
                    {tier.name}
                  </div>
                  <div className={`text-lg font-bold mb-1 ${tier.highlighted ? "text-amber-600" : "text-[#1a2e4a]"}`}>
                    {formatCurrency(totalPrice)}
                  </div>
                  <div className={`text-[9px] ${tier.highlighted ? "text-amber-600/70" : "text-slate-500"}`}>
                    {formatCurrency(perPersonPrice)} / pessoa
                  </div>
                  {tier.benefits && tier.benefits.length > 0 && (
                    <div className="text-[7px] text-slate-500 mt-2 pt-2 border-t border-slate-200 space-y-0.5">
                      {tier.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center justify-center gap-1">
                          <span>•</span>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HOTELS SECTION */}
      {hotels.length > 0 && includeHotel && (
        <div className="px-8 py-4" {...(pageBreaks.hotels ? { "data-page-break": "true" } : {})}>
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Opções de Hospedagem
          </h3>
          <div className="space-y-4">
            {hotels.map((hotel, idx) => {
              return (
                <div key={hotel.id} {...(hotel.startOnNewPage && idx > 0 ? { "data-page-break": "true" } : {})}>
                  <HotelCard
                    hotel={hotel}
                    index={idx}
                    tiers={fareComparison.tiers}
                    passengers={passengerCount}
                    includeAirfare={includeAirfare}
                    hotelPaymentMethods={installments?.hotelPaymentMethods}
                    flightPaymentMethods={installments?.paymentMethods}
                    combined={installments?.combined}
                    hotelInstallments={hotelInstallments}
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

      {/* INSTALLMENTS SECTION */}
      {(installments?.flight || installments?.hotel) && (
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
                            {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartao" : "PIX"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {includeHotel && installments?.hotel && hotelTotal > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Hotel</div>
                    <div className="text-xl font-bold text-[#1a2e4a]">
                      {hotelInstallments}x de {formatCurrency(hotelInstallmentValue)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Total: {formatCurrency(hotelTotal)}
                    </div>
                    {installments?.hotelPaymentMethods && installments.hotelPaymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {installments.hotelPaymentMethods.map((method) => (
                          <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartao" : "PIX"}
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

      {/* AVAILABILITY NOTE */}
      <div className="px-8 py-4">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
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
