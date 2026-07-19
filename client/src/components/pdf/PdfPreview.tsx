import { Check, X, Plane, Briefcase, Luggage, Info } from "lucide-react";
import type { BudgetData } from "@shared/budgetTypes";
import { FlightCard } from "./FlightCard";
import { HotelCard } from "./HotelCard";

interface PdfPreviewProps {
  data: BudgetData;
  includeAirfare?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PdfPreview({ data, includeAirfare = true }: PdfPreviewProps) {
  const { tripInfo, flights, fareComparison, baggage, hotels } = data;

  return (
    <div
      id="pdf-document"
      className="bg-white mx-auto"
      style={{ width: "100%", maxWidth: "800px", minHeight: "1120px", fontFamily: "Inter, sans-serif" }}
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
      {flights.length > 0 && (
        <div className="px-8 py-4">
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

      {/* HOTELS SECTION */}
      {hotels.length > 0 && (
        <div className="px-8 py-4">
          <h3
            className="text-base font-bold text-[#1a2e4a] mb-4 uppercase tracking-wide"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Opções de Hospedagem
          </h3>
          <div className="space-y-4">
            {hotels.map((hotel, idx) => {
              const passengerCount = parseInt(tripInfo.passengers) || 1;
              return (
                <HotelCard key={hotel.id} hotel={hotel} index={idx} tiers={fareComparison.tiers} passengers={passengerCount} includeAirfare={includeAirfare} />
              );
            })}
          </div>
        </div>
      )}



      {/* BAGGAGE GUIDE */}
      {baggage.some((b) => b.priceAdvance > 0 || b.priceAirport > 0) && (
        <div className="px-8 py-4">
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
                      Com antecedência: <span className="font-bold text-[#1a2e4a]">{formatCurrency(b.priceAdvance)}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      No aeroporto: <span className="font-bold text-[#1a2e4a]">{formatCurrency(b.priceAirport)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
