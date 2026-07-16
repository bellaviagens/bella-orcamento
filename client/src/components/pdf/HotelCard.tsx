import { MapPin, Star, ExternalLink } from "lucide-react";
import type { Hotel, FareTier } from "@shared/budgetTypes";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  tiers: FareTier[];
  passengers: number;
  includeAirfare?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function HotelCard({ hotel, index, tiers, passengers, includeAirfare = true }: HotelCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Photo */}
      <div className="h-40 bg-slate-100 overflow-hidden flex items-center justify-center">
        {hotel.photoUrl ? (
          <img src={hotel.photoUrl} alt={hotel.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="text-slate-400 text-sm">Sem foto</div>
        )}
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#1a2e4a]">{index + 1}.</span>
              <h3 className="text-lg font-bold text-[#1a2e4a]">{hotel.name}</h3>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          {hotel.rating > 0 && (
            <div className="bg-[#1a2e4a] text-white px-3 py-1.5 rounded-lg text-center flex-shrink-0">
              <div className="text-sm font-bold">{hotel.rating.toFixed(1)} / 10</div>
              <div className="text-[10px] opacity-90">{hotel.ratingLabel}</div>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-3">
          <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{hotel.address}</span>
        </div>

        {/* Hotel URL link */}
        {hotel.hotelUrl && (
          <div className="mb-3">
            <a
              href={hotel.hotelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Ver no site
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Description */}
        {hotel.description && (
          <p className="text-sm italic text-slate-600 mb-3">{hotel.description}</p>
        )}

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {hotel.amenities.map((amenity, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        )}

        {/* Prices grid - Total with flight included */}
        {tiers.length > 0 ? (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)` }}>
            {tiers.map((tier) => {
              const basePrice = includeAirfare ? hotel.totalPrice + tier.flightPrice : hotel.totalPrice;
              const totalPrice = basePrice * passengers;
              const perPersonPrice = basePrice;
              const label = includeAirfare ? `Com Aéreo ${tier.name}` : tier.name;

              return (
                <div
                  key={tier.id}
                  className={`rounded-lg border border-slate-200 p-3 text-center ${
                    tier.highlighted ? "bg-amber-50 border-amber-300" : ""
                  }`}
                >
                  <div className={`text-[10px] font-bold mb-2 uppercase ${tier.highlighted ? "text-amber-700" : "text-slate-500"}`}>
                    {label}
                  </div>
                  <>
                    <div className={`text-sm font-bold ${tier.highlighted ? "text-amber-600" : "text-[#1a2e4a]"}`}>
                      {formatCurrency(totalPrice)}
                    </div>
                    <div className={`text-[10px] ${tier.highlighted ? "text-amber-600/70" : "text-slate-400"}`}>
                      {formatCurrency(perPersonPrice)} / pessoa
                    </div>
                  </>
                </div>
              );
            })}
          </div>
        ) : hotel.totalPrice > 0 ? (
          <div className="rounded-lg border border-slate-200 p-3 text-center bg-blue-50 border-blue-300">
            <div className="text-[10px] font-bold mb-2 uppercase text-blue-700">
              Preco do Hotel
            </div>
            <div className="text-sm font-bold text-blue-600">
              {formatCurrency(hotel.totalPrice * passengers)}
            </div>
            <div className="text-[10px] text-blue-600/70">
              {formatCurrency(hotel.totalPrice)} / pessoa
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-4">Nenhuma tarifa adicionada</div>
        )}
      </div>
    </div>
  );
}
