import { Star, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import type { Hotel, FareTier } from "@shared/budgetTypes";
import { calculateEffectiveHotelTotal, calculateInstallmentWithDownpayment } from "@shared/paymentCalculations";
import { normalizeExternalUrl } from "@shared/pdfExternalLink";
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
  flightMachineRate?: number;
  combinedInstallments?: number;
  combinedDownpayment?: boolean;
  combinedDownpaymentAmount?: number;
  showCashOption?: boolean;
  cashValue?: number;
  cashPaymentMethods?: string[];
  observations?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ===== MAPEAMENTO ESTÁTICO E FIXO DE ÍCONES =====
// Mapeia cada palavra-chave ao seu ícone colorido correspondente.
// PROIBIDO remover ou substituir por checkboxes ou texto puro.
const BENEFIT_ICON_MAP: Record<string, string> = {
  // Bagagem - mala de mão / bolsa
  "bolsa ou mochila de ate 10kg": "🎒",
  "bolsa ou mochila de até 10kg": "🎒",
  "bolsa ou mochila": "🎒",
  "mala de mao": "🧳",
  "mala de mão": "🧳",
  "bagagem de mao": "🧳",
  "bagagem de mão": "🧳",
  "carry on": "🧳",
  "bagagem de 10 kg": "🧳",
  "bagagem de 10kg": "🧳",
  "bagagem de 12 kg": "🧳",
  "bagagem de 12kg": "🧳",
  "mala de 10kg": "🧳",
  "mala de 10 kg": "🧳",
  "mala de 12kg": "🧳",
  "mala de 12 kg": "🧳",
  // Bagagem despachada
  "bagagem de 23 kg": "📦",
  "bagagem de 23kg": "📦",
  "mala de 23kg": "📦",
  "mala de 23 kg": "📦",
  "mala despachada": "📦",
  "checked bag": "📦",
  "bagagem despachada": "📦",
  "mala": "📦",
  "bagagem": "📦",
  // Assento
  "selecao de assento": "💺",
  "seleção de assento": "💺",
  "assento": "💺",
  "seat selection": "💺",
  // Alterações / Reembolso
  "alteracao/reembolso sem taxa": "🔄",
  "alteração/reembolso sem taxa": "🔄",
  "alteracao/reembolso com taxa": "🔄",
  "alteração/reembolso com taxa": "🔄",
  "alteracoes": "🔄",
  "alterações": "🔄",
  "alteracoes/reembolso": "🔄",
  "alterações/reembolso": "🔄",
  "reembolso": "💰",
  "changes": "🔄",
  // Embarque / Check-in prioritário
  "embarque prioritario": "⚡",
  "embarque prioritário": "⚡",
  "check-in prioritario": "⚡",
  "check-in prioritário": "⚡",
  "check in prioritario": "⚡",
  "check in prioritário": "⚡",
  "embarque": "⚡",
  "check": "⚡",
  "priority boarding": "⚡",
  "priority check-in": "⚡",
};

function getBenefitIcon(benefit: string): string {
  const normalized = benefit.toLowerCase().trim();
  // Tenta match exato primeiro
  if (BENEFIT_ICON_MAP[normalized]) return BENEFIT_ICON_MAP[normalized];
  // Tenta match por inclusão (sem acentos)
  const noAccent = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, icon] of Object.entries(BENEFIT_ICON_MAP)) {
    const keyNoAccent = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (noAccent.includes(keyNoAccent) || keyNoAccent.includes(noAccent)) {
      return icon;
    }
  }
  // Fallback fixo - nunca genérico
  return "🧳";
}

export function HotelCard({ hotel, index, tiers, passengers, includeAirfare = true, includeHotel = true, hotelPaymentMethods = [], flightPaymentMethods = [], combined = false, hotelObservation = "", hotelInstallments = 1, hotelDownpayment = false, hotelDownpaymentAmount = 0, flightInstallments = 1, flightDownpayment = false, flightDownpaymentAmount = 0, flightMachineRate, combinedInstallments = 1, combinedDownpayment = false, combinedDownpaymentAmount = 0, showCashOption = false, cashValue = 0, cashPaymentMethods = [], observations = "" }: HotelCardProps) {
  const [proxiedPhotoUrl, setProxiedPhotoUrl] = useState<string | null>(hotel.photoUrl || null);
  const hotelExternalUrl = hotel.hotelUrl ? normalizeExternalUrl(hotel.hotelUrl) : "";
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
  const effectiveTotalPrice = calculateEffectiveHotelTotal(hotel);

  // ===== STYLES RÍGIDOS E FIXOS =====
  const tarifaContainerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    width: "100%",
    alignItems: "stretch",
    flexWrap: "nowrap",
  };

  const cardTarifaStyle: React.CSSProperties = {
    width: "270px",
    maxWidth: "270px",
    flexShrink: 0,
    boxSizing: "border-box",
  };

  const beneficiosContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "1px",
    flex: "1 1 0",
    minWidth: 0,
  };

  const beneficioItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "1px",
    lineHeight: "1.1",
    whiteSpace: "nowrap",
    minWidth: 0,
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
            {hotelExternalUrl && (
              <a
                href={hotelExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-pdf-link={hotelExternalUrl}
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

        {/* Right: Tarifas - Container RÍGIDO com flex justify-end */}
        <div className="flex-1 min-w-0">
          {includeAirfare && tiers.length > 0 ? (
            <div style={tarifaContainerStyle}>
              {tiers.slice(0, 2).map((tier) => {
                const basePrice = includeAirfare ? effectiveTotalPrice + (tier.flightPrice * passengers) : effectiveTotalPrice;
                const totalPrice = basePrice;
                const perPersonPrice = basePrice / passengers;
                const label = includeAirfare ? `Com Aéreo ${tier.name}` : tier.name;

                return (
                  <div
                    key={tier.id}
                    style={cardTarifaStyle}
                    className={`rounded-lg border p-2 overflow-hidden ${ tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-blue-50 border-blue-200"}`}
                  >
                    {/* Tarifa Info + Opcionais: bloco compacto com lista lateral */}
                    <div className="flex items-start gap-1 mb-1 pb-1">
                      <div className="text-left min-w-0" style={{ flex: "0 0 100px" }}>
                        <div
                          className="font-bold mb-0.5 leading-tight"
                          style={{
                            fontSize: "11px",
                            color: tier.highlighted ? "#b45309" : "#1d4ed8",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          className="font-bold"
                          style={{
                            fontSize: "15px",
                            color: tier.highlighted ? "#d97706" : "#2563eb",
                          }}
                        >
                          {formatCurrency(totalPrice)}
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: tier.highlighted ? "#d97706" : "#2563eb",
                            opacity: 0.7,
                          }}
                        >
                          {formatCurrency(perPersonPrice)} / pessoa
                        </div>
                      </div>

                      {tier.benefits && tier.benefits.length > 0 && (
                        <div style={beneficiosContainerStyle}>
                          {tier.benefits.map((benefit, idx) => {
                            const icon = getBenefitIcon(benefit);
                            return (
                              <div key={idx} style={beneficioItemStyle}>
                                <span style={{ fontSize: "10px", flexShrink: 0, lineHeight: 1 }}>{icon}</span>
                                <span style={{ fontSize: "8.5px", color: "#475569" }}>{benefit}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Forma de Pagamento dentro do card */}
                    {(combined || (includeAirfare && (flightPaymentMethods?.length > 0 || showCashOption)) || (includeHotel && hotelPaymentMethods?.length > 0)) && (
                      <div className="space-y-0.5 mt-1 pt-1 border-t border-slate-300">
                        {combined && includeAirfare && includeHotel ? (
                          <div>
                            <div
                              className="font-semibold uppercase mb-0.5"
                              style={{ fontSize: "9px", color: "#64748b" }}
                            >
                              Aéreo + Hotel
                            </div>
                            <div
                              className="font-bold"
                              style={{ fontSize: "11px", color: "#1a2e4a" }}
                            >
                              {(() => {
                                const flightTotalWithRate = flightMachineRate !== undefined
                                  ? (tier.flightPrice * passengers) * (1 + flightMachineRate / 100)
                                  : tier.flightPrice * passengers;
                                const combinedEntryAmount = flightDownpayment
                                  ? flightDownpaymentAmount
                                  : combinedDownpayment
                                    ? combinedDownpaymentAmount
                                    : 0;
                                const breakdown = calculateInstallmentWithDownpayment(
                                  flightTotalWithRate + effectiveTotalPrice,
                                  combinedInstallments,
                                  combinedEntryAmount,
                                );
                                return breakdown.downpaymentAmount > 0
                                  ? `1 entrada de ${formatCurrency(breakdown.downpaymentAmount)} + ${breakdown.remainingInstallments}x de ${formatCurrency(breakdown.installmentValue)}`
                                  : `${combinedInstallments}x de ${formatCurrency(breakdown.installmentValue)}`;
                              })()}
                            </div>
                            {flightMachineRate !== undefined && (
                              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                                Taxa da maquininha: {flightMachineRate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                        {/* AÉREO PARCELADO */}
                        {includeAirfare && tiers.length > 0 && (
                          <div className={showCashOption ? "flex gap-2 text-[9px]" : ""}>
                            <div className={showCashOption ? "flex-1" : ""}>
                              <div
                              className="font-semibold uppercase mb-0.5"
                              style={{ fontSize: "9px", color: "#64748b" }}
                            >
                              Aéreo Parcelado
                            </div>
                            <div
                              className="font-bold"
                              style={{ fontSize: "11px", color: "#1a2e4a" }}
                            >
                              {tier.flightPrice ? (() => {
                                const flightTotal = tier.flightPrice * passengers;
                                const totalWithRate = flightMachineRate !== undefined
                                  ? flightTotal * (1 + flightMachineRate / 100)
                                  : flightTotal;
                                const breakdown = calculateInstallmentWithDownpayment(
                                  totalWithRate,
                                  flightInstallments,
                                  flightDownpayment ? flightDownpaymentAmount : 0,
                                );
                                return breakdown.downpaymentAmount > 0
                                  ? `1 entrada de ${formatCurrency(breakdown.downpaymentAmount)} + ${breakdown.remainingInstallments}x de ${formatCurrency(breakdown.installmentValue)}`
                                  : `${flightInstallments}x de ${formatCurrency(breakdown.installmentValue)}`;
                              })() : "N/A"}
                            </div>
                            {flightMachineRate !== undefined && (
                              <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                                Taxa da maquininha: {flightMachineRate.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                              </div>
                            )}
                            {flightPaymentMethods.includes("cartao") && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">Cartão</span>
                              </div>
                            )}
                            </div>
                            {showCashOption && (
                              <div className="flex-1 border-l border-slate-200 pl-2">
                                <div
                                  className="font-semibold uppercase mb-0.5"
                                  style={{ fontSize: "9px", color: "#64748b" }}
                                >
                                  Aéreo À Vista
                                </div>
                                <div
                                  className="font-bold"
                                  style={{ fontSize: "11px", color: "#1a2e4a" }}
                                >
                                  1x de {formatCurrency(cashValue > 0 ? cashValue : tier.flightPrice * passengers)}
                                </div>
                                {(cashPaymentMethods.includes("dinheiro") || cashPaymentMethods.includes("pix")) && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {cashPaymentMethods.includes("dinheiro") && (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">Dinheiro</span>
                                    )}
                                    {cashPaymentMethods.includes("pix") && (
                                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">PIX</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* HOTEL */}
                        {includeHotel && hotelPaymentMethods?.length > 0 && (
                          <div>
                            <div
                              className="font-semibold uppercase mb-0.5"
                              style={{ fontSize: "9px", color: "#64748b" }}
                            >
                              Hotel
                            </div>
                            <div
                              className="font-bold"
                              style={{ fontSize: "11px", color: "#1a2e4a" }}
                            >
                              {(() => {
                                const breakdown = calculateInstallmentWithDownpayment(
                                  effectiveTotalPrice,
                                  hotelInstallments,
                                  hotelDownpayment ? hotelDownpaymentAmount : 0,
                                );
                                return breakdown.downpaymentAmount > 0
                                  ? `1 entrada de ${formatCurrency(breakdown.downpaymentAmount)} + ${breakdown.remainingInstallments}x de ${formatCurrency(breakdown.installmentValue)}`
                                  : `${hotelInstallments}x de ${formatCurrency(breakdown.installmentValue)}`;
                              })()}
                            </div>
                          </div>
                        )}
                          </>
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
