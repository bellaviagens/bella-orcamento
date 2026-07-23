import { MapPin, ExternalLink, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { Hotel, FareTier } from "@shared/budgetTypes";
import { trpc } from "@/lib/trpc";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  tiers: FareTier[];
  passengers: number;
  includeAirfare?: boolean;
  includeHotel?: boolean;
  hotelPaymentMethods?: string[];
  flightPaymentMethods?: string[];
  combined?: boolean;
  hotelObservation?: string;
  hotelInstallments?: number;
  hotelDownpayment?: boolean;
  hotelDownpaymentAmount?: number;
  flightInstallments?: number;
  flightDownpayment?: boolean;
  flightDownpaymentAmount?: number;
  combinedInstallments?: number;
  combinedDownpayment?: boolean;
  combinedDownpaymentAmount?: number;
  observations?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function HotelCard({ hotel, index, tiers, passengers, includeAirfare = true, includeHotel = true, hotelPaymentMethods = [], flightPaymentMethods = [], combined = false, hotelObservation = "", hotelInstallments = 1, hotelDownpayment = false, hotelDownpaymentAmount = 0, flightInstallments = 1, flightDownpayment = false, flightDownpaymentAmount = 0, combinedInstallments = 1, combinedDownpayment = false, combinedDownpaymentAmount = 0, observations = "" }: HotelCardProps) {
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
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm p-3 mb-3">
      {/* Header with left border + Photo */}
      <div className="flex gap-2 mb-2">
        <div className="w-1 bg-amber-400 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0 flex gap-2">
          {/* Left: Info */}
          <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-sm font-bold text-[#1a2e4a]">{index + 1}.</span>
            <h3 className="text-sm font-bold text-[#1a2e4a]">{hotel.name}</h3>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          
          {/* Address - Compacto */}
          <div className="flex items-start gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
            <span>{hotel.address}</span>
          </div>

          {/* Description - Compacto */}
          {hotel.description && (
            <p className="text-xs italic text-slate-600 mt-0.5">{hotel.description}</p>
          )}

          {/* Rating - Compacto */}
          {hotel.rating > 0 && (
            <div className="mt-1 inline-block bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-xs">
              <span className="font-bold text-blue-700">★ Nota: {hotel.rating.toFixed(1)} / 10</span>
              <span className="text-blue-600"> ({hotel.ratingLabel})</span>
            </div>
          )}
          </div>
          
          {/* Right: Photo - Pequena */}
          {proxiedPhotoUrl && (
            <div className="w-20 h-20 flex-shrink-0">
              <img src={proxiedPhotoUrl} alt={hotel.name} className="w-full h-full object-cover rounded" crossOrigin="anonymous" />
            </div>
          )}
        </div>
      </div>

      {/* Main content: Amenities left, Tarifas right */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Left: Amenities - Compacto */}
        <div>
          <div className="text-xs font-bold text-[#1a2e4a] mb-1 uppercase">Comodidades:</div>
          {hotel.amenities.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {hotel.amenities.map((amenity, i) => {
                const icons = ["☕", "🏊", "💪", "📶", "🍽️", "🎵", "💆", "📚", "🎮", "✓"];
                const icon = icons[i % icons.length];
                
                return (
                  <div key={i} className="text-xs text-slate-700 flex items-center gap-1">
                    <span className="text-sm">{icon}</span>
                    <span>{amenity}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400">Sem comodidades</div>
          )}
        </div>

        {/* Right: Tarifas - Compacto */}
        <div>
          {includeAirfare && tiers.length > 0 ? (
            <div className="space-y-1">
              {tiers.slice(0, 2).map((tier) => {
                const basePrice = includeAirfare ? effectiveTotalPrice + tier.flightPrice : effectiveTotalPrice;
                const totalPrice = basePrice;
                const perPersonPrice = basePrice / passengers;
                const label = includeAirfare ? `Com Aéreo ${tier.name}` : tier.name;

                return (
                  <div
                    key={tier.id}
                    className={`rounded-lg border p-2 text-center ${
                      tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className={`text-[9px] font-bold mb-0.5 uppercase ${tier.highlighted ? "text-amber-700" : "text-blue-700"}`}>
                      {label}
                    </div>
                    <div className={`text-xs font-bold ${tier.highlighted ? "text-amber-600" : "text-blue-600"}`}>
                      {formatCurrency(totalPrice)}
                    </div>
                    <div className={`text-[8px] ${tier.highlighted ? "text-amber-600/70" : "text-blue-600/70"}`}>
                      {formatCurrency(perPersonPrice)} / pessoa
                    </div>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="text-[7px] text-slate-500 mt-0.5 pt-0.5 border-t border-slate-200">
                        {tier.benefits.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : effectiveTotalPrice > 0 ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center">
              <div className="text-[9px] font-bold mb-0.5 uppercase text-blue-700">
                Preço do Hotel
              </div>
              <div className="text-xs font-bold text-blue-600">
                {formatCurrency(effectiveTotalPrice)}
              </div>
              <div className="text-[8px] text-blue-600/70">
                {formatCurrency(effectiveTotalPrice / passengers)} / pessoa
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Nenhuma tarifa</div>
          )}
        </div>
      </div>

      {/* Button - Full width, compacto */}
      {hotel.hotelUrl ? (
        <a
          href={hotel.hotelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#1a2e4a] text-white py-1.5 px-2 rounded font-bold text-xs uppercase hover:bg-[#253d5c] transition inline-flex items-center justify-center gap-1 mb-2"
        >
          Acessar Cotação & Fotos
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <button className="w-full bg-[#1a2e4a] text-white py-1.5 px-2 rounded font-bold text-xs uppercase hover:bg-[#253d5c] transition mb-2">
          Acessar Cotação & Fotos
        </button>
      )}

      {/* Payment Methods Block - Individual for each hotel with Aéreo + Hotel calculator */}
      {((includeAirfare && flightPaymentMethods?.length > 0) || (includeHotel && hotelPaymentMethods?.length > 0)) && (
        <div className="mt-1.5 pt-2 border-t-2 border-amber-400">
          <div className="text-xs font-bold text-[#1a2e4a] uppercase mb-2 pb-1 border-b border-slate-200">
            Forma de Pagamento
          </div>
          {combined ? (
            /* COMBINED Block - Aéreo + Hotel */
            <div className="rounded-lg border border-slate-200 p-2 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Aéreo + Hotel</div>
              <div className="text-base font-bold text-[#1a2e4a]">
                {tiers[0]?.flightPrice && effectiveTotalPrice ? (() => {
                  const flightTotal = tiers[0].flightPrice;
                  const hotelTotal = effectiveTotalPrice;
                  const totalAmount = flightTotal + hotelTotal;
                  
                  // Calculate total downpayment (flight + hotel)
                  const totalDownpayment = (flightDownpayment && flightDownpaymentAmount ? flightDownpaymentAmount : 0) + (combinedDownpayment && combinedDownpaymentAmount ? combinedDownpaymentAmount : 0);
                  
                  if (totalDownpayment > 0) {
                    return `1x de ${formatCurrency(totalDownpayment)} + ${combinedInstallments}x de ${formatCurrency((totalAmount - totalDownpayment) / combinedInstallments)}`;
                  } else {
                    return `${combinedInstallments}x de ${formatCurrency(totalAmount / combinedInstallments)}`;
                  }
                })() : "N/A"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Total: {tiers[0]?.flightPrice && effectiveTotalPrice ? formatCurrency(tiers[0].flightPrice + effectiveTotalPrice) : "N/A"}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {flightPaymentMethods && flightPaymentMethods.length > 0 && flightPaymentMethods.map((method) => (
                  <span key={method} className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* SEPARATE Blocks - Aéreo and Hotel */
            <div className="grid grid-cols-2 gap-2">
              {/* AÉREO Block */}
              {includeAirfare && tiers.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-2 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Aéreo</div>
                  <div className="text-base font-bold text-[#1a2e4a]">
                    {tiers[0]?.flightPrice ? (
                      flightDownpayment && flightDownpaymentAmount && flightDownpaymentAmount > 0
                        ? `1x de ${formatCurrency(flightDownpaymentAmount)} + ${flightInstallments}x de ${formatCurrency((tiers[0].flightPrice - flightDownpaymentAmount) / flightInstallments)}`
                        : `${flightInstallments}x de ${formatCurrency(tiers[0].flightPrice / flightInstallments)}`
                    ) : "N/A"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Total: {tiers[0]?.flightPrice ? formatCurrency(tiers[0].flightPrice) : "N/A"}
                  </div>
                  {flightPaymentMethods && flightPaymentMethods.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {flightPaymentMethods.map((method) => (
                        <span key={method} className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* HOTEL Block */}
              {includeHotel && hotelPaymentMethods && hotelPaymentMethods.length > 0 && (
                <div className="rounded-lg border border-slate-200 p-2 bg-slate-50">
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Hotel</div>
                  <div className="text-base font-bold text-[#1a2e4a]">
                    {hotelDownpayment && hotelDownpaymentAmount && hotelDownpaymentAmount > 0
                      ? `1x de ${formatCurrency(hotelDownpaymentAmount)} + ${hotelInstallments}x de ${formatCurrency((effectiveTotalPrice - hotelDownpaymentAmount) / hotelInstallments)}`
                      : `${hotelInstallments}x de ${formatCurrency(effectiveTotalPrice / hotelInstallments)}`
                    }
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Total: {formatCurrency(effectiveTotalPrice)}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {hotelPaymentMethods.map((method) => (
                      <span key={method} className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Installment Observations */}
          {observations && (
            <div className="mt-1.5 mb-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-slate-700 break-inside-avoid">
              {observations}
            </div>
          )}
          {hotel.paymentNotes && (
            <div className="mt-1.5 mb-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded text-xs text-slate-700 break-inside-avoid">
              {hotel.paymentNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
