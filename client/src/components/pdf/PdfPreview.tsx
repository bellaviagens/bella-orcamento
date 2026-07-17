import { useBudget } from "@/contexts/BudgetContext";
import { Briefcase, Luggage } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { Hotel, FareTier } from "@shared/budgetTypes";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PdfPreview({ includeAirfare }: { includeAirfare: boolean }) {
  const { budget } = useBudget();
  const { tripInfo, flights, hotels, fareComparison, baggage } = budget;
  const { tiers } = fareComparison;

  const passengers = parseInt(tripInfo.passengers) || 1;

  return (
    <div id="pdf-document" className="bg-white text-slate-800 min-h-screen flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div className="bg-[#1a2e4a] text-white px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Bella Viagens e Milhas
            </h1>
            <p className="text-amber-400 text-sm tracking-wide">Acumule. Viaje. Viva.</p>
          </div>
          <div className="text-right text-xs text-slate-300">
            <div>{tripInfo.destination}</div>
            <div>{tripInfo.period}</div>
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="bg-[#1a2e4a] text-white px-8 py-4">
        <h2 className="text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
          Comparativo de Tarifas & Hospedagem
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          {tripInfo.passengers} Passageiro(s) | {tripInfo.period}
        </p>
      </div>

      {/* Intro Text */}
      <div className="px-8 py-4 bg-slate-50 border-b border-slate-200">
        <p className="text-xs text-slate-600 leading-relaxed">{tripInfo.introText}</p>
      </div>

      {/* Flights Section */}
      {flights.length > 0 && (
        <div className="px-8 py-4">
          <h3 className="text-sm font-bold text-[#1a2e4a] mb-3 uppercase tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>
            Horários dos Voos Selecionados
          </h3>
          <div className="space-y-3">
            {flights.map((flight) => (
              <div key={flight.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#1a2e4a]">{flight.segments[0]?.departureCity}</div>
                    <div className="text-slate-500">{flight.segments[0]?.departureTime}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a2e4a]">{flight.segments[flight.segments.length - 1]?.arrivalCity}</div>
                    <div className="text-slate-500">{flight.segments[flight.segments.length - 1]?.arrivalTime}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a2e4a]">{flight.operatingAirline}</div>
                    <div className="text-slate-500">{flight.segments[0]?.flightNumber}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a2e4a]">{flight.totalDuration}</div>
                    <div className="text-slate-500">Duração</div>
                  </div>
                </div>
                {flight.segments.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-semibold text-slate-600 mb-1">Escalas:</div>
                    <div className="space-y-1">
                      {flight.segments.slice(1).map((segment, i) => (
                        <div key={i} className="text-[10px] text-slate-600">
                          {segment.arrivalCity} - {segment.arrivalTime} a {segment.departureTime}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotels Section */}
      {hotels.length > 0 && (
        <div className="px-8 py-4">
          <h3 className="text-sm font-bold text-[#1a2e4a] mb-3 uppercase tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>
            Opções de Hospedagem
          </h3>
          <div className="space-y-4">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} tiers={tiers} passengers={passengers} includeAirfare={includeAirfare} />
            ))}
          </div>
        </div>
      )}

      {/* Fares Comparison */}
      {tiers.length > 0 && (
        <div className="px-8 py-4">
          <h3 className="text-sm font-bold text-[#1a2e4a] mb-3 uppercase tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>
            Comparativo de Benefícios por Tarifa (Aéreo)
          </h3>
          <div className={`grid gap-3 ${tiers.length === 1 ? "grid-cols-1 max-w-xs mx-auto" : tiers.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {tiers.map((tier) => (
              <div key={tier.id} className="border border-slate-200 rounded-lg p-3 text-center bg-slate-50">
                <div className={`font-bold text-sm mb-2 ${tier.highlighted ? "text-amber-600" : "text-[#1a2e4a]"}`} style={{ fontFamily: "Poppins, sans-serif" }}>
                  {tier.highlighted && "⭐ "}
                  {tier.name}
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className={tier.carryOn ? "text-[#1a2e4a] font-semibold" : "text-slate-400"}>
                    {tier.carryOn ? "✓" : "✗"} Mala de Mão
                  </div>
                  <div className={tier.checkedBag ? "text-[#1a2e4a] font-semibold" : "text-slate-400"}>
                    {tier.checkedBag ? "✓" : "✗"} Mala Despachada
                  </div>
                  <div className={tier.seatSelection ? "text-[#1a2e4a] font-semibold" : "text-slate-400"}>
                    {tier.seatSelection ? "✓" : "✗"} Seleção de Assento
                  </div>
                  <div className={tier.changes ? "text-[#1a2e4a] font-semibold" : "text-slate-400"}>
                    {tier.changes ? "✓" : "✗"} Alterações/Reembolso
                  </div>
                </div>
                {flights.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 font-bold text-amber-600">
                    {formatCurrency(tier.flightPrice * passengers)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Baggage Guide - REDUZIDO */}
      {baggage.some((b) => b.priceAdvance > 0 || b.priceAirport > 0) && (
        <div className="px-8 py-2">
          <h3 className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>
            Guia Prático de Bagagens (Avulsas)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {baggage.map((b, i) => {
              const Icon = i === 0 ? Briefcase : i === 1 ? Luggage : Luggage;
              return (
                <div key={i} className="rounded border border-slate-100 bg-slate-50 p-2 text-center">
                  <Icon className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                  <div className="text-[10px] font-semibold text-slate-700">{b.type}</div>
                  <div className="text-[8px] text-slate-500 mb-1">{b.weight}</div>
                  <div className="space-y-0.5">
                    <div className="text-[8px] text-slate-500">
                      Antec.: <span className="font-semibold text-slate-700">{formatCurrency(b.priceAdvance)}</span>
                    </div>
                    <div className="text-[8px] text-slate-500">
                      Aero.: <span className="font-semibold text-slate-700">{formatCurrency(b.priceAirport)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="px-8 py-3 bg-amber-50 border-t border-amber-200 mt-4">
        <div className="flex gap-2">
          <span className="text-amber-600 text-lg">⚠️</span>
          <p className="text-[10px] text-amber-800 leading-tight">
            Nota: Os valores apresentados neste orçamento estão sujeitos à alteração sem aviso prévio, conforme disponibilidade e variação cambial. A confirmação da reserva está condicionada ao pagamento e emissão dentro do prazo de validade informado.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-8 py-3 bg-[#1a2e4a] text-white text-xs flex justify-between items-center border-t border-slate-200">
        <span>Bella Viagens e Milhas | Acumule. Viaje. Viva.</span>
        <span>Página 1</span>
      </div>
    </div>
  );
}

function HotelCard({ hotel, tiers, passengers, includeAirfare }: { hotel: Hotel; tiers: FareTier[]; passengers: number; includeAirfare: boolean }) {
  const { data: proxiedPhotoUrl } = trpc.imageProxy.useQuery({ url: hotel.photoUrl }, { enabled: !!hotel.photoUrl });

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Hotel Photo */}
      {proxiedPhotoUrl && typeof proxiedPhotoUrl === 'string' && (
        <div className="h-32 bg-slate-100 overflow-hidden">
          <img src={proxiedPhotoUrl} alt={hotel.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Hotel Info */}
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-sm text-[#1a2e4a]">{hotel.name}</h4>
            <p className="text-[10px] text-slate-500">{hotel.address}</p>
          </div>
          {hotel.hotelUrl && (
            <a href={hotel.hotelUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 underline">
              Ver no site
            </a>
          )}
        </div>

        {/* Stars & Rating */}
        {(hotel.stars || hotel.rating) && (
          <div className="text-[10px] text-slate-600 mb-2">
            {hotel.stars && <span>⭐ {hotel.stars}</span>}
            {hotel.rating && <span className="ml-2">({hotel.rating})</span>}
          </div>
        )}

        {/* Prices by Tariff */}
        {tiers.length > 0 && (
          <div className="space-y-1 mt-2 pt-2 border-t border-slate-100">
            {tiers.map((tier) => {
              const hotelPrice = hotel.totalPrice || 0;
              const airfarePrice = tier.flightPrice || 0;
              const totalPrice = includeAirfare ? (hotelPrice + airfarePrice) * passengers : hotelPrice * passengers;

              return (
                <div key={tier.id} className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-600">
                    COM AÉREO {tier.name}
                    {tier.benefits && tier.benefits.length > 0 && (
                      <span className="text-[8px] text-slate-500 ml-1">({tier.benefits.join(", ")})</span>
                    )}
                  </span>
                  <span className="font-bold text-[#1a2e4a]">{formatCurrency(totalPrice)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
