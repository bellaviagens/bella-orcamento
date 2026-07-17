import { MapPin, Star } from "lucide-react";
import type { Hotel } from "@shared/budgetTypes";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function HotelCard({ hotel, index }: HotelCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Photo */}
      {hotel.photoUrl && (
        <div className="h-40 bg-slate-100 overflow-hidden">
          <img src={hotel.photoUrl} alt={hotel.name} className="w-full h-full object-cover" />
        </div>
      )}

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
            <div className="bg-[#1a2e4a] text-white px-3 py-1.5 rounded-lg text-center">
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

        {/* Prices */}
        <div className="grid grid-cols-3 gap-2">
          {/* BASIC */}
          <div className="rounded-lg border border-slate-200 p-3 text-center">
            <div className="text-xs font-bold text-slate-500 mb-1">BASIC</div>
            <div className="text-sm font-bold text-[#1a2e4a]">
              {formatCurrency(hotel.prices.basic.total)}
            </div>
            <div className="text-[10px] text-slate-400">
              {formatCurrency(hotel.prices.basic.perPerson)} / pessoa
            </div>
          </div>
          {/* LIGHT */}
          <div className="rounded-lg border border-slate-200 p-3 text-center">
            <div className="text-xs font-bold text-slate-500 mb-1">LIGHT</div>
            <div className="text-sm font-bold text-[#1a2e4a]">
              {formatCurrency(hotel.prices.light.total)}
            </div>
            <div className="text-[10px] text-slate-400">
              {formatCurrency(hotel.prices.light.perPerson)} / pessoa
            </div>
          </div>
          {/* FULL - highlighted */}
          <div className="rounded-lg bg-amber-400 p-3 text-center">
            <div className="text-xs font-bold text-[#1a2e4a] mb-1">FULL</div>
            <div className="text-sm font-bold text-[#1a2e4a]">
              {formatCurrency(hotel.prices.full.total)}
            </div>
            <div className="text-[10px] text-[#1a2e4a]/70">
              {formatCurrency(hotel.prices.full.perPerson)} / pessoa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
