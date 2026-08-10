import { Star, MapPin } from "lucide-react";
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

  // Função para reorganizar benefícios com "Bolsa ou mochila" primeiro
  const reorganizeBenefits = (benefits: string[]) => {
    const bolsaBenefit = benefits.find(b => b.toLowerCase().includes("bolsa ou mochila"));
    const otherBenefits = benefits.filter(b => !b.toLowerCase().includes("bolsa ou mochila")).slice(0, 11);
    return bolsaBenefit ? [bolsaBenefit, ...otherBenefits] : benefits.slice(0, 12);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm p-3 mb-3 w-full">
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
          
          {/* Right: Photo + Button */}
          <div className="flex flex-col gap-1 items-end">
            {proxiedPhotoUrl && (
              <div className="w-24 h-24 flex-shrink-0">
                <img src={proxiedPhotoUrl} alt={hotel.name} className="w-full h-full object-cover rounded" crossOrigin="anonymous" />
              </div>
            )}
            {hotel.hotelUrl && (
              <a
                href={hotel.hotelUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-pdf-link="true"
                className="text-[9px] font-semibold bg-[#1a2e4a] text-white px-2 py-1 rounded whitespace-nowrap hover:bg-[#0f1a2e] transition-colors"
              >
                ACESSAR SITE E FOTOS
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Comodidades + Tarifas */}
      <div className="flex gap-3 mt-2">
        {/* Left: Comodidades */}
        <div className="w-32 flex-shrink-0">
          <div className="text-[9px] font-bold text-slate-700 mb-1 uppercase">Comodidades:</div>
          {hotel.amenities && hotel.amenities.length > 0 ? (
            <div className="space-y-0.5">
              {hotel.amenities.map((amenity, i) => {
                const icons = ["📶", "🏊", "🏋️", "🍽️"];
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

        {/* Right: Tarifas - Expandido em 2 colunas */}
        <div className="flex-1">
          {includeAirfare && tiers.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 w-full">
              {tiers.slice(0, 2).map((tier) => {
                const basePrice = includeAirfare ? effectiveTotalPrice + (tier.flightPrice * passengers) : effectiveTotalPrice;
                const totalPrice = basePrice;
                const perPersonPrice = basePrice / passengers;
                const label = includeAirfare ? `Com Aéreo ${tier.name}` : tier.name;

                return (
                  <div
                    key={tier.id}
                    className={`rounded-lg border p-1.5 overflow-hidden ${ tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200"}`}
                  >
                    {/* Tarifa Info */}
                    <div className="flex items-start justify-between gap-1.5 mb-1 pb-1 border-b border-slate-300">
                      <div className="text-left flex-1">
                        <div className={`text-[8px] font-bold mb-0.5 uppercase ${tier.highlighted ? "text-amber-700" : "text-blue-700"}`}>
                          {label}
                        </div>
                        <div className={`text-xs font-bold ${tier.highlighted ? "text-amber-600" : "text-blue-600"}`}>
                          {formatCurrency(totalPrice)}
                        </div>
                        <div className={`text-[7px] ${tier.highlighted ? "text-amber-600/70" : "text-blue-600/70"}`}>
                          {formatCurrency(perPersonPrice)} / pessoa
                        </div>
                      </div>
                    </div>

                    {/* Benefícios - Coluna vertical com "Bolsa ou mochila" primeiro */}
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="text-[6px] text-slate-600 flex flex-col gap-0.5 mb-1">
                        {reorganizeBenefits(tier.benefits).map((benefit, idx) => {
                          const benefitIcons: Record<string, string> = {
                            "mala de mao": "🧳",
                            "mala despachada": "📦",
                            "selecao de assento": "💺",
                            "alteracoes": "🔄",
                            "reembolso": "💰",
                            "carry on": "🧳",
                            "checked bag": "📦",
                            "seat selection": "💺",
                            "changes": "🔄",
                            "bolsa ou mochila": "🎒",
                            "embarque prioritario": "⚡",
                            "check in prioritario": "⚡",
                            "bagagem de mao": "🧳",
                          };
                          const benefitLower = benefit.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                          const icon = Object.entries(benefitIcons).find(([key]) => benefitLower.includes(key))?.[1] || "📌";
                          return (
                            <div key={idx} className="flex items-start gap-0.5 leading-tight">
                              <span className="flex-shrink-0 leading-tight text-[7px] mt-0.5">{icon}</span>
                              <span className="text-[6px] leading-tight break-words">{benefit}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Forma de Pagamento dentro do card */}
                    {((includeAirfare && flightPaymentMethods?.length > 0) || (includeHotel && hotelPaymentMethods?.length > 0)) && (
                      <div className="space-y-0.5 mt-1 pt-1 border-t border-slate-300">
                        {/* AÉREO */}
                        {includeAirfare && tiers.length > 0 && (
                          <div>
                            <div className="text-[6px] font-semibold text-slate-600 uppercase mb-0.5">Aéreo Parcelado</div>
                            <div className="text-[7px] font-bold text-[#1a2e4a]">
                              {tier.flightPrice ? (() => {
                                const flightTotal = tier.flightPrice * passengers;
                                const installmentValue = flightInstallments > 0 ? flightTotal / flightInstallments : 0;
                                return `${flightInstallments}x de ${formatCurrency(installmentValue)}`;
                              })() : "N/A"}
                            </div>
                          </div>
                        )}

                        {/* HOTEL */}
                        {includeHotel && hotelPaymentMethods?.length > 0 && (
                          <div>
                            <div className="text-[6px] font-semibold text-slate-600 uppercase mb-0.5">Hotel</div>
                            <div className="text-[7px] font-bold text-[#1a2e4a]">
                              {hotelInstallments > 0 ? `${hotelInstallments}x de ${formatCurrency(effectiveTotalPrice / hotelInstallments)}` : formatCurrency(effectiveTotalPrice)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Sem tarifas cadastradas</div>
          )}
        </div>
      </div>
    </div>
  );
}
