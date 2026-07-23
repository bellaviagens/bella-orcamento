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
  hotelPaymentMethods?: string[];
  flightPaymentMethods?: string[];
  combined?: boolean;
  hotelInstallments?: number;
  hotelTotal?: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function HotelCard({ hotel, index, tiers, passengers, includeAirfare = true, hotelPaymentMethods = [], flightPaymentMethods = [], combined = false, hotelInstallments = 0, hotelTotal = 0 }: HotelCardProps) {
  const [proxiedPhotoUrl, setProxiedPhotoUrl] = useState<string | null>(hotel.photoUrl || null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
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
          <div className="flex flex-wrap gap-2 mb-4">
            {hotel.amenities.map((amenity, i) => {
              const colors = [
                { bg: "bg-blue-50 border-blue-200 text-blue-700", icon: "✓" },
                { bg: "bg-amber-50 border-amber-200 text-amber-700", icon: "☕" },
                { bg: "bg-green-50 border-green-200 text-green-700", icon: "📶" },
                { bg: "bg-orange-50 border-orange-200 text-orange-700", icon: "💪" },
                { bg: "bg-cyan-50 border-cyan-200 text-cyan-700", icon: "🏊" },
                { bg: "bg-red-50 border-red-200 text-red-700", icon: "🍽️" },
                { bg: "bg-purple-50 border-purple-200 text-purple-700", icon: "🎵" },
                { bg: "bg-pink-50 border-pink-200 text-pink-700", icon: "💆" },
                { bg: "bg-indigo-50 border-indigo-200 text-indigo-700", icon: "📚" },
                { bg: "bg-rose-50 border-rose-200 text-rose-700", icon: "🎮" },
              ];
              const colorIndex = i % colors.length;
              const { bg: bgColor, icon } = colors[colorIndex];
              
              return (
                <span
                  key={i}
                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg border ${bgColor} inline-flex items-center gap-1`}
                >
                  <span>{icon}</span>
                  <span>{amenity}</span>
                </span>
              );
            })}
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
        {includeAirfare && tiers.length > 0 ? (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)` }}>
            {tiers.map((tier, tierIdx) => {
              const basePrice = includeAirfare ? effectiveTotalPrice + tier.flightPrice : effectiveTotalPrice;
              const totalPrice = basePrice;
              const perPersonPrice = basePrice / passengers;
              const label = includeAirfare ? `Com Aéreo ${tier.name}` : tier.name;

              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTierIndex(tierIdx)}
                  className={`rounded-lg border p-3 text-center cursor-pointer transition ${
                    selectedTierIndex === tierIdx
                      ? tier.highlighted ? "bg-amber-100 border-amber-400" : "bg-blue-100 border-blue-400"
                      : tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"
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
              {formatCurrency(effectiveTotalPrice)}
            </div>
            <div className="text-[10px] text-blue-600/70">
              {formatCurrency(effectiveTotalPrice / passengers)} / pessoa
            </div>

          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-4">Nenhuma tarifa adicionada</div>
        )}

        {/* Forma de Pagamento Individual do Hotel */}
        {hotelInstallments && hotelInstallments > 0 && hotelTotal > 0 && hotelPaymentMethods && hotelPaymentMethods.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 p-4 bg-slate-50">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Hotel</div>
            <div className="text-xl font-bold text-[#1a2e4a]">
              {hotelInstallments}x de {formatCurrency(hotelTotal / hotelInstallments)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total: {formatCurrency(hotelTotal)}
            </div>
            {hotelPaymentMethods.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hotelPaymentMethods.map((method) => (
                  <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
