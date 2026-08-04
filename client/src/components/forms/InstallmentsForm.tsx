import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function InstallmentsForm() {
  const { budget, updateInstallments, updatePaymentMethods, updateHotelPaymentMethods, updatePageBreaks } = useBudget();
  const { installments, pageBreaks } = budget;

  // Calculate totals for preview
  const flightTotal = budget.fareComparison.tiers.reduce((sum, tier) => sum + tier.flightPrice, 0);
  const hotelTotal = budget.hotels.reduce((sum, hotel) => {
    const effectivePrice = hotel.priceMode === "daily" && hotel.dailyPrice && hotel.nights
      ? hotel.dailyPrice * hotel.nights
      : hotel.totalPrice;
    return sum + effectivePrice;
  }, 0);

  const flightInstallments = installments?.flight || 1;
  const hotelInstallments = installments?.hotel || 1;
  const combinedTotal = flightTotal + hotelTotal;
  const combinedInstallments = Math.max(flightInstallments, hotelInstallments);

  return (
    <div className="space-y-4">
      {/* Installments */}
      <div>
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Parcelamento do Aéreo</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min="1"
            value={installments?.flight || ""}
            onChange={(e) => updateInstallments("flight", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 4"
            className="h-8 text-sm"
          />
          <span className="text-xs text-slate-500">vezes</span>
        </div>
        {flightTotal > 0 && installments?.flight && (
          <p className="text-[10px] text-slate-500 mt-1">
            {installments.flight}x de {formatCurrency(flightTotal / installments.flight)}
          </p>
        )}
        {/* Payment Methods for Flight */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="payment-flight-all"
              checked={(
                installments?.paymentMethods?.includes("dinheiro") &&
                installments?.paymentMethods?.includes("cartao") &&
                installments?.paymentMethods?.includes("pix")
              ) || false}
              onCheckedChange={(checked) => {
                if (checked) {
                  updatePaymentMethods(["dinheiro", "cartao", "pix"]);
                } else {
                  updatePaymentMethods([]);
                }
              }}
            />
            <Label htmlFor="payment-flight-all" className="text-xs cursor-pointer font-semibold">Selecionar Tudo</Label>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-cash"
                checked={installments?.paymentMethods?.includes("dinheiro") || false}
                onCheckedChange={(checked) => {
                  const current = installments?.paymentMethods || [];
                  if (checked) {
                    updatePaymentMethods([...current, "dinheiro"]);
                  } else {
                    updatePaymentMethods(current.filter((m) => m !== "dinheiro"));
                  }
                }}
              />
              <Label htmlFor="payment-cash" className="text-xs cursor-pointer">Dinheiro</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-card"
                checked={installments?.paymentMethods?.includes("cartao") || false}
                onCheckedChange={(checked) => {
                  const current = installments?.paymentMethods || [];
                  if (checked) {
                    updatePaymentMethods([...current, "cartao"]);
                  } else {
                    updatePaymentMethods(current.filter((m) => m !== "cartao"));
                  }
                }}
              />
              <Label htmlFor="payment-card" className="text-xs cursor-pointer">Cartão</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-pix"
                checked={installments?.paymentMethods?.includes("pix") || false}
                onCheckedChange={(checked) => {
                  const current = installments?.paymentMethods || [];
                  if (checked) {
                    updatePaymentMethods([...current, "pix"]);
                  } else {
                    updatePaymentMethods(current.filter((m) => m !== "pix"));
                  }
                }}
              />
              <Label htmlFor="payment-pix" className="text-xs cursor-pointer">PIX</Label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Parcelamento do Hotel</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min="1"
            value={installments?.hotel || ""}
            onChange={(e) => updateInstallments("hotel", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 10"
            className="h-8 text-sm"
          />
          <span className="text-xs text-slate-500">vezes</span>
        </div>
        {hotelTotal > 0 && installments?.hotel && (
          <p className="text-[10px] text-slate-500 mt-1">
            {installments.hotel}x de {formatCurrency(hotelTotal / installments.hotel)}
          </p>
        )}
        {/* Payment Methods for Hotel */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="payment-hotel-all"
              checked={(
                installments?.hotelPaymentMethods?.includes("dinheiro") &&
                installments?.hotelPaymentMethods?.includes("cartao") &&
                installments?.hotelPaymentMethods?.includes("pix")
              ) || false}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateHotelPaymentMethods(["dinheiro", "cartao", "pix"]);
                } else {
                  updateHotelPaymentMethods([]);
                }
              }}
            />
            <Label htmlFor="payment-hotel-all" className="text-xs cursor-pointer font-semibold">Selecionar Tudo</Label>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-hotel-cash"
                checked={installments?.hotelPaymentMethods?.includes("dinheiro") || false}
                onCheckedChange={(checked) => {
                  const current = installments?.hotelPaymentMethods || [];
                  if (checked) {
                    updateHotelPaymentMethods([...current, "dinheiro"]);
                  } else {
                    updateHotelPaymentMethods(current.filter((m) => m !== "dinheiro"));
                  }
                }}
              />
              <Label htmlFor="payment-hotel-cash" className="text-xs cursor-pointer">Dinheiro</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-hotel-card"
                checked={installments?.hotelPaymentMethods?.includes("cartao") || false}
                onCheckedChange={(checked) => {
                  const current = installments?.hotelPaymentMethods || [];
                  if (checked) {
                    updateHotelPaymentMethods([...current, "cartao"]);
                  } else {
                    updateHotelPaymentMethods(current.filter((m) => m !== "cartao"));
                  }
                }}
              />
              <Label htmlFor="payment-hotel-card" className="text-xs cursor-pointer">Cartão</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-hotel-pix"
                checked={installments?.hotelPaymentMethods?.includes("pix") || false}
                onCheckedChange={(checked) => {
                  const current = installments?.hotelPaymentMethods || [];
                  if (checked) {
                    updateHotelPaymentMethods([...current, "pix"]);
                  } else {
                    updateHotelPaymentMethods(current.filter((m) => m !== "pix"));
                  }
                }}
              />
              <Label htmlFor="payment-hotel-pix" className="text-xs cursor-pointer">PIX</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Downpayment */}
      <div className="border-t border-slate-200 pt-4">
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Entrada do Aéreo</Label>
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="flight-downpayment"
            checked={installments?.flightDownpayment || false}
            onCheckedChange={(checked) => updateInstallments("flightDownpayment", checked as boolean)}
          />
          <Label htmlFor="flight-downpayment" className="text-xs cursor-pointer">Tem entrada?</Label>
        </div>
        {installments?.flightDownpayment && (
          <div className="mt-3">
            <Label className="text-xs text-slate-600">Valor da Entrada (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={installments?.flightDownpaymentAmount || ""}
              onChange={(e) => updateInstallments("flightDownpaymentAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 1000.00"
              className="h-8 text-sm mt-1"
            />
            {flightTotal > 0 && installments?.flightDownpaymentAmount && installments?.flight && (
              <p className="text-[10px] text-slate-500 mt-2">
                Entrada: {formatCurrency(installments.flightDownpaymentAmount)} + {installments.flight}x de {formatCurrency((flightTotal - installments.flightDownpaymentAmount) / installments.flight)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="combined-installments"
            checked={installments?.combined || false}
            onCheckedChange={(checked) => updateInstallments("combined", checked as boolean)}
          />
          <Label htmlFor="combined-installments" className="text-xs cursor-pointer">
            Parcelar tudo junto (aéreo + hotel)
          </Label>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 ml-6">
          Se marcado, soma o valor do aéreo + hotel e divide pelo número de parcelas selecionado.
        </p>
        {installments?.combined && combinedTotal > 0 && (
          <p className="text-[10px] text-[#1a2e4a] font-semibold mt-2 ml-6">
            {combinedInstallments}x de {formatCurrency(combinedTotal / combinedInstallments)}
          </p>
        )}
        {installments?.combined && (
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="combined-downpayment"
                checked={installments?.combinedDownpayment || false}
                onCheckedChange={(checked) => updateInstallments("combinedDownpayment", checked as boolean)}
              />
              <Label htmlFor="combined-downpayment" className="text-xs cursor-pointer">Tem entrada?</Label>
            </div>
            {installments?.combinedDownpayment && (
              <div className="mt-2 ml-6">
                <Label className="text-xs text-slate-600">Valor da Entrada (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={installments?.combinedDownpaymentAmount || ""}
                  onChange={(e) => updateInstallments("combinedDownpaymentAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Ex: 2000.00"
                  className="h-8 text-sm mt-1"
                />
                {combinedTotal > 0 && installments?.combinedDownpaymentAmount && combinedInstallments && (
                  <p className="text-[10px] text-slate-500 mt-2">
                    Entrada: {formatCurrency(installments.combinedDownpaymentAmount)} + {combinedInstallments}x de {formatCurrency((combinedTotal - installments.combinedDownpaymentAmount) / combinedInstallments)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hotel Downpayment */}
      <div className="border-t border-slate-200 pt-4">
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Entrada do Hotel</Label>
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id="hotel-downpayment"
            checked={installments?.hotelDownpayment || false}
            onCheckedChange={(checked) => updateInstallments("hotelDownpayment", checked as boolean)}
          />
          <Label htmlFor="hotel-downpayment" className="text-xs cursor-pointer">Tem entrada?</Label>
        </div>
        {installments?.hotelDownpayment && (
          <div className="mt-3">
            <Label className="text-xs text-slate-600">Valor da Entrada (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={installments?.hotelDownpaymentAmount || ""}
              onChange={(e) => updateInstallments("hotelDownpaymentAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 1000.00"
              className="h-8 text-sm mt-1"
            />
            {hotelTotal > 0 && installments?.hotelDownpaymentAmount && installments?.hotel && (
              <p className="text-[10px] text-slate-500 mt-2">
                Entrada: {formatCurrency(installments.hotelDownpaymentAmount)} + {installments.hotel}x de {formatCurrency((hotelTotal - installments.hotelDownpaymentAmount) / installments.hotel)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Observations */}
      <div className="border-t border-slate-200 pt-4">
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Observações do Parcelamento</Label>
        <textarea
          value={installments?.observations || ""}
          onChange={(e) => updateInstallments("observations", e.target.value)}
          placeholder="Ex: à vista 20% de desconto, parcela em até 12x..."
          className="w-full h-16 text-xs border border-slate-300 rounded p-2 mt-2 resize-none"
        />
      </div>

      {/* Page Break Controls */}
      <div className="border-t border-slate-200 pt-4">
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">
          Controle de Páginas no PDF
        </Label>
        <p className="text-[10px] text-slate-400 mt-1 mb-3">
          Marque para iniciar cada seção em uma nova página no PDF exportado.
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="break-flights"
              checked={pageBreaks?.flights || false}
              onCheckedChange={(checked) => updatePageBreaks("flights", checked as boolean)}
            />
            <Label htmlFor="break-flights" className="text-xs cursor-pointer">
              Voos em nova página
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="break-hotels"
              checked={pageBreaks?.hotels || false}
              onCheckedChange={(checked) => updatePageBreaks("hotels", checked as boolean)}
            />
            <Label htmlFor="break-hotels" className="text-xs cursor-pointer">
              Hotéis em nova página
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="break-baggage"
              checked={pageBreaks?.baggage || false}
              onCheckedChange={(checked) => updatePageBreaks("baggage", checked as boolean)}
            />
            <Label htmlFor="break-baggage" className="text-xs cursor-pointer">
              Bagagem em nova página
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="break-payment"
              checked={pageBreaks?.payment || false}
              onCheckedChange={(checked) => updatePageBreaks("payment", checked as boolean)}
            />
            <Label htmlFor="break-payment" className="text-xs cursor-pointer">
              Pagamento em nova página
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
