import { Plane } from "lucide-react";
import type { Flight } from "@shared/budgetTypes";

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  const label = flight.type === "ida" ? "IDA" : "VOLTA";
  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];

  if (!firstSegment || !lastSegment) return null;

  const route = `${firstSegment.departureCity} → ${lastSegment.arrivalCity}`;
  const flightType = flight.isDirect
    ? "Direto"
    : `${flight.segments.length - 1} escala${flight.segments.length - 1 > 1 ? "s" : ""}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a2e4a] text-white">
          <Plane className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold text-[#1a2e4a]">{label}: </span>
          <span className="text-sm font-semibold text-slate-700">{route}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">{firstSegment.date}</span>
        </div>
      </div>

      {/* Segments */}
      <div className="space-y-3">
        {flight.segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            {/* Departure */}
            <div className="text-right w-20">
              <div className="font-bold text-[#1a2e4a]">{seg.departureTime}</div>
            </div>
            <div className="text-center w-16">
              <div className="font-bold text-slate-700">{seg.departureAirport}</div>
            </div>

            {/* Middle: line + type */}
            <div className="flex-1 flex flex-col items-center">
              {idx === 0 && (
                <div className="text-xs font-medium text-slate-500">
                  {flightType} • {flight.totalDuration}
                </div>
              )}
              {idx > 0 && (
                <div className="text-xs font-medium text-amber-600">
                  Conexão em {seg.departureCity}
                </div>
              )}
              <div className="w-full flex items-center gap-1 mt-1">
                <div className="h-px flex-1 bg-slate-300" />
                <Plane className="h-3 w-3 text-slate-400" />
                <div className="h-px flex-1 bg-slate-300" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {seg.airline} {seg.flightNumber} • {seg.duration}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center w-16">
              <div className="font-bold text-slate-700">{seg.arrivalAirport}</div>
            </div>
            <div className="text-left w-20">
              <div className="font-bold text-[#1a2e4a]">{seg.arrivalTime}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        Operado por <span className="font-semibold text-slate-700">{flight.operatingAirline}</span>
      </div>
    </div>
  );
}
