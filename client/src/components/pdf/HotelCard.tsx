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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Photo */}
      <div className="h-32 bg-slate-100 overflow-hidden flex items-center justify-center">
        {proxiedPhotoUrl ? (
          <img src={proxiedPhotoUrl} alt={hotel.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        ) : (
          <div className="text-slate-400 text-sm">Sem foto</div>
        )}
      </div>

      <div className="p-4">
        {/* Header with left border */}
        <div className="flex gap-3 mb-4">
          <div className="w-1 bg-amber-400 rounded-full flex-shrink-0"></div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#1a2e4a]">{index + 1}.</span>
                <h3 className="text-lg font-bold text-[#1a2e4a]">{hotel.name}</h3>
                <div className="flex items-center gap-1">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              {/* Botão Acessar Cotação & Fotos - Ao lado do hotel */}
              <div className="flex flex-col items-end gap-1">
                {hotel.hotelUrl ? (
                  <a
                    href={hotel.hotelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1a2e4a] text-white py-1.5 px-2 rounded-lg font-bold text-xs uppercase hover:bg-[#253d5c] transition whitespace-nowrap inline-flex items-center gap-1"
                  >
                    Acessar Fotos e Site
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <button className="bg-[#1a2e4a] text-white py-1.5 px-2 rounded-lg font-bold text-xs uppercase hover:bg-[#253d5c] transition whitespace-nowrap">
                    Acessar Fotos
                  </button>
                )}
              </div>
            </div>
            
            {/* Address */}
            <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{hotel.address}</span>
            </div>

            {/* Description */}
            {hotel.description && (
              <p className="text-xs italic text-slate-600 mt-1">{hotel.description}</p>
            )}

            {/* Rating */}
            {hotel.rating > 0 && (
              <div className="mt-2 inline-block bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs">
                <span className="font-bold text-blue-700">★ Nota: {hotel.rating.toFixed(1)} / 10</span>
                <span className="text-blue-600"> ({hotel.ratingLabel})</span>
              </div>
            )}
          </div>
        </div>

        {/* Main content: Amenities left, Tarifas right */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Left: Amenities */}
          <div>
            <div className="text-xs font-bold text-[#1a2e4a] mb-2 uppercase">Comodidades Incluídas:</div>
            {hotel.amenities.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {hotel.amenities.map((amenity, i) => {
                  const icons = ["☕", "🏊", "💪", "📶", "🍽️", "🎵", "💆", "📚", "🎮", "✓"];
                  const icon = icons[i % icons.length];
                  
                  return (
                    <div key={i} className="text-xs text-slate-700 flex items-center gap-2">
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

          {/* Right: Tarifas */}
          <div>
            {includeAirfare && tiers.length > 0 ? (
              <div className="space-y-2">
                {tiers.slice(0, 2).map((tier) => {
                  const basePrice = includeAirfare ? effectiveTotalPrice + tier.flightPrice : effectiveTotalPrice;
                  const totalPrice = basePrice;
                  const perPersonPrice = basePrice / passengers;
                  const label = includeAirfare ? `Com Aéreo ${tier.name}` : tier.name;

                  return (
                    <div
                      key={tier.id}
                      className={`rounded-lg border p-3 text-center ${
                        tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className={`text-[10px] font-bold mb-1 uppercase ${tier.highlighted ? "text-amber-700" : "text-blue-700"}`}>
                        {label}
                      </div>
                      <div className={`text-sm font-bold ${tier.highlighted ? "text-amber-600" : "text-blue-600"}`}>
                        {formatCurrency(totalPrice)}
                      </div>
                      <div className={`text-[9px] ${tier.highlighted ? "text-amber-600/70" : "text-blue-600/70"}`}>
                        {formatCurrency(perPersonPrice)} / pessoa
                      </div>
                      {tier.benefits && tier.benefits.length > 0 && (
                        <div className="text-[7px] text-slate-500 mt-1 pt-1 border-t border-slate-200">
                          {tier.benefits.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : effectiveTotalPrice > 0 ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                <div className="text-[10px] font-bold mb-1 uppercase text-blue-700">
                  Preço do Hotel
                </div>
                <div className="text-sm font-bold text-blue-600">
                  {formatCurrency(effectiveTotalPrice)}
                </div>
                <div className="text-[9px] text-blue-600/70">
                  {formatCurrency(effectiveTotalPrice / passengers)} / pessoa
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Nenhuma tarifa</div>
            )}
          </div>
        </div>

        {/* Button */}


        {/* Payment Methods Block - Individual for each hotel with Aéreo + Hotel calculator */}
        {((includeAirfare && flightPaymentMethods?.length > 0) || (includeHotel && hotelPaymentMethods?.length > 0)) && (
          <div className="mt-3 pt-2 border-t-2 border-amber-400">
            <div className="text-sm font-bold text-[#1a2e4a] uppercase mb-3 pb-2 border-b border-slate-200">
              Forma de Pagamento
            </div>
            {combined ? (
              /* COMBINED Block - Aéreo + Hotel */
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Aéreo + Hotel</div>
                <div className="text-xl font-bold text-[#1a2e4a]">
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
                <div className="text-xs text-slate-500 mt-1">
                  Total: {tiers[0]?.flightPrice && effectiveTotalPrice ? formatCurrency(tiers[0].flightPrice + effectiveTotalPrice) : "N/A"}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {flightPaymentMethods && flightPaymentMethods.length > 0 && flightPaymentMethods.map((method) => (
                    <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* SEPARATE Blocks - Aéreo and Hotel */
              <div className="grid grid-cols-2 gap-3">
                {/* AÉREO Block */}
                {includeAirfare && tiers.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Aéreo</div>
                    <div className="text-xl font-bold text-[#1a2e4a]">
                      {tiers[0]?.flightPrice ? (
                        flightDownpayment && flightDownpaymentAmount && flightDownpaymentAmount > 0
                          ? `1x de ${formatCurrency(flightDownpaymentAmount)} + ${flightInstallments}x de ${formatCurrency((tiers[0].flightPrice - flightDownpaymentAmount) / flightInstallments)}`
                          : `${flightInstallments}x de ${formatCurrency(tiers[0].flightPrice / flightInstallments)}`
                      ) : "N/A"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Total: {tiers[0]?.flightPrice ? formatCurrency(tiers[0].flightPrice) : "N/A"}
                    </div>
                    {flightPaymentMethods && flightPaymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {flightPaymentMethods.map((method) => (
                          <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {method === "dinheiro" ? "Dinheiro" : method === "cartao" ? "Cartão" : "PIX"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* HOTEL Block */}
                {includeHotel && hotelPaymentMethods && hotelPaymentMethods.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Hotel</div>
                    <div className="text-xl font-bold text-[#1a2e4a]">
                      {hotelDownpayment && hotelDownpaymentAmount && hotelDownpaymentAmount > 0
                        ? `1x de ${formatCurrency(hotelDownpaymentAmount)} + ${hotelInstallments}x de ${formatCurrency((effectiveTotalPrice - hotelDownpaymentAmount) / hotelInstallments)}`
                        : `${hotelInstallments}x de ${formatCurrency(effectiveTotalPrice / hotelInstallments)}`
                      }
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Total: {formatCurrency(effectiveTotalPrice)}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {hotelPaymentMethods.map((method) => (
                        <span key={method} className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
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
              <div className="mt-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-slate-700 break-inside-avoid">
                {observations}
              </div>
            )}
            {hotel.paymentNotes && (
              <div className="mt-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm text-slate-700 break-inside-avoid">
                {hotel.paymentNotes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
