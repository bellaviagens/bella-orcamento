import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateCombinedTotal, calculateEffectiveHotelTotal } from "@shared/paymentCalculations";

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
  const passengerCount = parseInt(budget.tripInfo.passengers) || 1;
  const flightTotal = budget.fareComparison.tiers.reduce((sum, tier) => sum + (tier.flightPrice * passengerCount), 0);
  const hotelTotal = budget.hotels.reduce((sum, hotel) => sum + calculateEffectiveHotelTotal(hotel), 0);

  const flightInstallments = installments?.flightInstallmentsWithRate !== undefined
    ? installments.flightInstallmentsWithRate
    : (installments?.flight || 1);
  const hotelInstallments = installments?.hotel || 1;
  const combinedInstallments = flightInstallments;
  const combinedDownpaymentAmount = installments?.combinedDownpaymentAmount ?? 0;
  const combinedOptions = budget.fareComparison.tiers.flatMap((tier) =>
    budget.hotels.map((hotel) => ({
      id: `${tier.id}-${hotel.id}`,
      label: `${tier.name} + ${hotel.name}`,
      total: calculateCombinedTotal(
        tier.flightPrice,
        passengerCount,
        calculateEffectiveHotelTotal(hotel),
      ),
    })),
  );

  return (
    <div className="space-y-4">
      {/* CHECKBOX: Incluir Opção À Vista */}
      <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-cash-option"
            checked={installments?.showCashOption || false}
            onCheckedChange={(checked) => updateInstallments("showCashOption", checked as boolean)}
          />
          <Label htmlFor="show-cash-option" className="text-sm font-semibold text-amber-700 cursor-pointer">Incluir Opção de Pagamento À Vista no PDF</Label>
        </div>
      </div>

      {/* FORMA DE PAGAMENTO DO AÉREO - OPÇÃO 1: À VISTA */}
      <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
        <Label className="text-[11px] font-semibold text-blue-700 uppercase">Forma de Pagamento do Aéreo - À Vista</Label>
        
        {flightTotal > 0 && (
          <div className="mt-3 p-2 bg-white rounded border border-blue-200">
            <p className="text-sm font-bold text-[#1a2e4a]">Valor Total: {formatCurrency(flightTotal)}</p>
          </div>
        )}

        {installments?.showCashOption && (
          <div className="mt-3">
            <Label className="text-xs text-slate-600">Valor à Vista (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={installments?.flightCashPrice ?? ""}
              onChange={(e) => updateInstallments("flightCashPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder={flightTotal > 0 ? `Ex: ${flightTotal.toFixed(2)}` : "Ex: 20000.00"}
              className="h-8 text-sm mt-1"
            />
            <p className="text-[10px] text-slate-500 mt-1">Se não preencher, será usado o valor total da tarifa.</p>
          </div>
        )}

        {/* Entrada do Aéreo - Opção 1 */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="flight-downpayment-option1"
              checked={installments?.flightDownpayment || false}
              onCheckedChange={(checked) => updateInstallments("flightDownpayment", checked as boolean)}
            />
            <Label htmlFor="flight-downpayment-option1" className="text-xs cursor-pointer">Tem entrada?</Label>
          </div>
          {installments?.flightDownpayment && (
            <div>
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
              {flightTotal > 0 && installments?.flightDownpaymentAmount && (
                <p className="text-[10px] text-slate-500 mt-2">
                  Entrada: {formatCurrency(installments.flightDownpaymentAmount)} + Saldo: {formatCurrency(flightTotal - installments.flightDownpaymentAmount)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Formas de Pagamento - Opção 1 (Dinheiro e PIX) */}
        <div className="mt-3 space-y-2">
          <Label className="text-xs font-semibold text-slate-600">Formas de Pagamento</Label>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-cash-option1"
                checked={(installments?.flightCashPaymentMethods ?? installments?.paymentMethods ?? []).includes("dinheiro")}
                onCheckedChange={(checked) => {
                  const current = installments?.flightCashPaymentMethods ?? installments?.paymentMethods ?? [];
                  if (checked) {
                    updateInstallments("flightCashPaymentMethods", [...current, "dinheiro"]);
                  } else {
                    updateInstallments("flightCashPaymentMethods", current.filter((m) => m !== "dinheiro"));
                  }
                }}
              />
              <Label htmlFor="payment-cash-option1" className="text-xs cursor-pointer">Dinheiro</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="payment-pix-option1"
                checked={(installments?.flightCashPaymentMethods ?? installments?.paymentMethods ?? []).includes("pix")}
                onCheckedChange={(checked) => {
                  const current = installments?.flightCashPaymentMethods ?? installments?.paymentMethods ?? [];
                  if (checked) {
                    updateInstallments("flightCashPaymentMethods", [...current, "pix"]);
                  } else {
                    updateInstallments("flightCashPaymentMethods", current.filter((m) => m !== "pix"));
                  }
                }}
              />
              <Label htmlFor="payment-pix-option1" className="text-xs cursor-pointer">PIX</Label>
            </div>
          </div>
        </div>
      </div>

      {/* FORMA DE PAGAMENTO DO AÉREO - OPÇÃO 2: COM TAXA (MAQUININHA) */}
      <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
        <Label className="text-[11px] font-semibold text-amber-700 uppercase">Forma de Pagamento do Aéreo - Com Taxa</Label>
        
        {flightTotal > 0 && (
          <div className="mt-3 p-2 bg-white rounded border border-amber-200">
            <p className="text-sm font-bold text-[#1a2e4a]">Valor Base: {formatCurrency(flightTotal)}</p>
          </div>
        )}

        {/* Calculadora de Taxa */}
        <div className="mt-3 space-y-2">
          <div>
            <Label className="text-xs text-slate-600">Número de Parcelas</Label>
            <Input
              type="number"
              min="1"
              value={installments?.flightInstallmentsWithRate || ""}
              onChange={(e) => updateInstallments("flightInstallmentsWithRate", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ex: 4"
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600">Taxa da Maquininha (%)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={installments?.flightMachineRate || ""}
              onChange={(e) => updateInstallments("flightMachineRate", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 2.5"
              className="h-8 text-sm mt-1"
            />
          </div>
          {installments?.flightInstallmentsWithRate && installments?.flightMachineRate !== undefined && flightTotal > 0 && (
            <div className="mt-2 p-2 bg-white rounded border border-amber-200">
              {(() => {
                const rate = installments.flightMachineRate / 100;
                const withRate = flightTotal * (1 + rate);
                const installmentValue = withRate / installments.flightInstallmentsWithRate;
                return (
                  <div className="text-xs space-y-1">
                    <p className="text-slate-600">Valor com taxa: <span className="font-bold text-slate-800">{formatCurrency(withRate)}</span></p>
                    <p className="text-slate-600">{installments.flightInstallmentsWithRate}x de: <span className="font-bold text-amber-600">{formatCurrency(installmentValue)}</span></p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Entrada do Aéreo - Opção 2 */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="flight-downpayment-option2"
              checked={installments?.flightDownpayment || false}
              onCheckedChange={(checked) => updateInstallments("flightDownpayment", checked as boolean)}
            />
            <Label htmlFor="flight-downpayment-option2" className="text-xs cursor-pointer">Tem entrada?</Label>
          </div>
          {installments?.flightDownpayment && (
            <div>
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
            </div>
          )}
        </div>

        {/* Formas de Pagamento - Opção 2 (Cartão) */}
        <div className="mt-3 space-y-2">
          <Label className="text-xs font-semibold text-slate-600">Forma de Pagamento</Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="payment-card-option2"
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
            <Label htmlFor="payment-card-option2" className="text-xs cursor-pointer">Cartão</Label>
          </div>
        </div>
      </div>

      {/* FORMA DE PAGAMENTO DO HOTEL */}
      <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
        <Label className="text-[11px] font-semibold text-green-700 uppercase">Forma de Pagamento do Hotel</Label>
        
        {hotelTotal > 0 && (
          <div className="mt-3 p-2 bg-white rounded border border-green-200">
            <p className="text-sm font-bold text-[#1a2e4a]">Valor Total: {formatCurrency(hotelTotal)}</p>
          </div>
        )}

        {/* Parcelamento do Hotel */}
        <div className="mt-3 space-y-2">
          <Label className="text-xs text-slate-600">Número de Parcelas</Label>
          <Input
            type="number"
            min="1"
            value={installments?.hotel || ""}
            onChange={(e) => updateInstallments("hotel", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 10"
            className="h-8 text-sm"
          />
          {hotelTotal > 0 && installments?.hotel && (
            <p className="text-[10px] text-slate-500 mt-1">
              {installments.hotel}x de {formatCurrency(hotelTotal / installments.hotel)}
            </p>
          )}
        </div>

        {/* Entrada do Hotel */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="hotel-downpayment"
              checked={installments?.hotelDownpayment || false}
              onCheckedChange={(checked) => updateInstallments("hotelDownpayment", checked as boolean)}
            />
            <Label htmlFor="hotel-downpayment" className="text-xs cursor-pointer">Tem entrada?</Label>
          </div>
          {installments?.hotelDownpayment && (
            <div>
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

        {/* Formas de Pagamento - Hotel */}
        <div className="mt-3 space-y-2">
          <Label className="text-xs font-semibold text-slate-600">Formas de Pagamento</Label>
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

      {/* PARCELAR TUDO JUNTO */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="combined-installments"
            checked={installments?.combined || false}
            onCheckedChange={(checked) => updateInstallments("combined", checked as boolean)}
          />
          <Label htmlFor="combined-installments" className="text-xs cursor-pointer font-semibold">
            Parcelar tudo junto (aéreo + hotel)
          </Label>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 ml-6">
          Se marcado, soma o valor do aéreo + hotel e divide pelo número de parcelas selecionado.
        </p>
        {installments?.combined && combinedOptions.map((option) => (
          <p key={option.id} className="text-[10px] text-[#1a2e4a] font-semibold mt-2 ml-6">
            {combinedOptions.length > 1 ? `${option.label}: ` : ""}
            {combinedInstallments}x de {formatCurrency(option.total / combinedInstallments)}
          </p>
        ))}
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
                {combinedDownpaymentAmount > 0 && combinedInstallments && combinedOptions.map((option) => (
                  <p key={option.id} className="text-[10px] text-slate-500 mt-2">
                    {combinedOptions.length > 1 ? `${option.label}: ` : ""}
                    Entrada: {formatCurrency(combinedDownpaymentAmount)} + {combinedInstallments}x de {formatCurrency((option.total - combinedDownpaymentAmount) / combinedInstallments)}
                  </p>
                ))}
              </div>
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
