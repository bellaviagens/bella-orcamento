import { MapPin, Star, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Hotel, FareTier } from "@shared/budgetTypes";
import { trpc } from "@/lib/trpc";

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
  const [proxiedPhotoUrl, setProxiedPhotoUrl] = useState<string | null>(hotel.photoUrl || null);
  const imageProxyQuery = trpc.imageProxy.useQuery(
    { url: hotel.photoUrl || "" },
    {
      enabled: !!(hotel.photoUrl && (hotel.photoUrl.includes("http") || hotel.photoUrl.includes("//"))),
    }
  );

  useEffect(() => {
    if (imageProxyQuery.data?.success && imageProxyQuery.data.data) {
      setProxiedPhotoUrl(imageProxyQuery.data.data);
    }
  }, [imageProxyQuery.data]);

  // Calculate effective total price based on price mode
  const effectiveTotalPrice =
    hotel.priceMode === "daily" && hotel.dailyPrice && hotel.nights
      ? hotel.dailyPrice * hotel.nights
      : hotel.totalPrice;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Photo */}
      <div className="h-40 bg-slate-100 overflow-hidden flex items-center justify-center">
        {proxiedPhotoUrl ? (
          <img src={proxiedPhotoUrl} alt={hotel.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
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

        {/* Hotel URL link - clickable in PDF */}
        {hotel.hotelUrl && (
          <div className="mb-3">
            <a
              href={hotel.hotelUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-pdf-link={hotel.hotelUrl}
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

        {/* Daily price info */}
        {hotel.priceMode === "daily" && hotel.dailyPrice && hotel.nights ? (
          <div className="mb-3 text-xs text-slate-500">
            Diária: <span className="font-bold text-[#1a2e4a]">{formatCurrency(hotel.dailyPrice)}</span>
            {" × "}
            <span className="font-bold text-[#1a2e4a]">{hotel.nights} diárias</span>
            {" = "}
            <span className="font-bold text-[#1a2e4a]">{formatCurrency(effectiveTotalPrice)}</span>
          </div>
        ) : null}

        {/* Prices grid - Total with flight included */}
        {tiers.length > 0 ? (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)` }}>
            {tiers.map((tier) => {
              const basePrice = includeAirfare ? effectiveTotalPrice + tier.flightPrice : effectiveTotalPrice;
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
                  <div className={`text-[10px] font-bold mb-1 uppercase ${tier.highlighted ? "text-amber-700" : "text-slate-500"}`}>
                    {label}
                  </div>
                  <>
                    <div className={`text-sm font-bold ${tier.highlighted ? "text-amber-600" : "text-[#1a2e4a]"}`}>
                      {formatCurrency(totalPrice)}
                    </div>
                    <div className={`text-[10px] ${tier.highlighted ? "text-amber-600/70" : "text-slate-400"}`}>
                      {formatCurrency(perPersonPrice)} / pessoa
                    </div>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="text-[8px] text-slate-400 mt-1 pt-1 border-t border-slate-200">
                        {tier.benefits.join(", ")}
                      </div>
                    )}
                  </>
                </div>
              );
            })}
          </div>
        ) : effectiveTotalPrice > 0 ? (
          <div className="rounded-lg border border-slate-200 p-3 text-center bg-blue-50 border-blue-300">
            <div className="text-[10px] font-bold mb-2 uppercase text-blue-700">
              Preço do Hotel
            </div>
            <div className="text-sm font-bold text-blue-600">
              {formatCurrency(effectiveTotalPrice * passengers)}
            </div>
            <div className="text-[10px] text-blue-600/70">
              {formatCurrency(effectiveTotalPrice)} / pessoa
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-4">Nenhuma tarifa adicionada</div>
        )}
      </div>
    </div>
  );
}
