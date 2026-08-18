import { useBudget } from "@/contexts/BudgetContext";
import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { calculateCombinedTotal, calculateEffectiveHotelTotal } from "@shared/paymentCalculations";
import { calculateCombinedPaymentPlan, normalizeCombinedPaymentConditions, type CombinedPaymentCondition, type CombinedPaymentMethod, type CombinedPaymentStep } from "@shared/combinedPaymentPlan";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const PAYMENT_CONDITION_COLORS = ["#1a2e4a", "#a16207", "#475569", "#4d7c0f"];

function getPaymentConditionLabel(condition: CombinedPaymentCondition, index: number): string {
  return condition.label?.trim() || `Pagamento ${index + 1}`;
}

function getPaymentConditionColor(condition: CombinedPaymentCondition, index: number): string {
  return condition.color || PAYMENT_CONDITION_COLORS[index % PAYMENT_CONDITION_COLORS.length];
}

export function toggleCollapsedPaymentSection(current: string[], sectionId: string): string[] {
  return current.includes(sectionId)
    ? current.filter((id) => id !== sectionId)
    : [...current, sectionId];
}

function PaymentSection({
  id,
  title,
  titleClassName,
  containerClassName,
  buttonClassName,
  collapsed,
  onToggle,
  summary,
  children,
}: {
  id: string;
  title: string;
  titleClassName: string;
  containerClassName: string;
  buttonClassName: string;
  collapsed: boolean;
  onToggle: () => void;
  summary?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between gap-3">
        <Label className={`text-[11px] font-semibold uppercase ${titleClassName}`}>{title}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={buttonClassName}
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={`${id}-payment-details`}
        >
          {collapsed ? <ChevronDown className="mr-1 h-3.5 w-3.5" /> : <ChevronUp className="mr-1 h-3.5 w-3.5" />}
          {collapsed ? "Abrir" : "Recolher"}
        </Button>
      </div>
      {collapsed ? summary : <div id={`${id}-payment-details`}>{children}</div>}
    </div>
  );
}

export function InstallmentsForm() {
  const { budget, updateInstallments, updatePaymentMethods, updateHotelPaymentMethods, updatePageBreaks } = useBudget();
  const { installments, pageBreaks } = budget;
  const [collapsedPaymentConditions, setCollapsedPaymentConditions] = useState<string[]>(() => (
    normalizeCombinedPaymentConditions(budget.installments?.combinedPaymentSteps ?? []).map((condition) => condition.id)
  ));
  const [collapsedPaymentSections, setCollapsedPaymentSections] = useState<string[]>(["flight-cash", "flight-rate", "hotel"]);

  const isPaymentSectionCollapsed = (sectionId: string) => collapsedPaymentSections.includes(sectionId);
  const togglePaymentSection = (sectionId: string) => setCollapsedPaymentSections((current) => toggleCollapsedPaymentSection(current, sectionId));

  // Calculate totals for preview
  const passengerCount = parseInt(budget.tripInfo.passengers) || 1;
  const flightTotal = budget.fareComparison.tiers.reduce((sum, tier) => sum + (tier.flightPrice * passengerCount), 0);
  const hotelTotal = budget.hotels.reduce((sum, hotel) => sum + calculateEffectiveHotelTotal(hotel), 0);

  const flightInstallments = installments?.flightInstallmentsWithRate !== undefined
    ? installments.flightInstallmentsWithRate
    : (installments?.flight || 1);
  const hotelInstallments = installments?.hotel || 1;
  const combinedInstallments = installments?.combinedInstallments ?? flightInstallments;
  const combinedDownpaymentAmount = installments?.combinedDownpaymentAmount ?? 0;
  const combinedPaymentSteps = installments?.combinedPaymentSteps ?? [];
  const combinedPaymentConditions = normalizeCombinedPaymentConditions(combinedPaymentSteps);
  const hasCombinedPaymentSteps = combinedPaymentConditions.length > 0;
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
      <PaymentSection
        id="flight-cash"
        title="Forma de Pagamento do Aéreo - À Vista"
        titleClassName="text-blue-700"
        containerClassName="border-2 border-blue-300 rounded-lg p-4 bg-blue-50"
        buttonClassName="h-7 shrink-0 px-2 text-[11px] text-blue-700 hover:bg-blue-100"
        collapsed={isPaymentSectionCollapsed("flight-cash")}
        onToggle={() => togglePaymentSection("flight-cash")}
        summary={flightTotal > 0 ? <p className="mt-2 text-xs font-semibold text-[#1a2e4a]">Total: {formatCurrency(flightTotal)}</p> : null}
      >
        
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
      </PaymentSection>

      {/* FORMA DE PAGAMENTO DO AÉREO - OPÇÃO 2: COM TAXA (MAQUININHA) */}
      <PaymentSection
        id="flight-rate"
        title="Forma de Pagamento do Aéreo - Com Taxa"
        titleClassName="text-amber-700"
        containerClassName="border-2 border-amber-300 rounded-lg p-4 bg-amber-50"
        buttonClassName="h-7 shrink-0 px-2 text-[11px] text-amber-700 hover:bg-amber-100"
        collapsed={isPaymentSectionCollapsed("flight-rate")}
        onToggle={() => togglePaymentSection("flight-rate")}
        summary={flightTotal > 0 ? <p className="mt-2 text-xs font-semibold text-[#1a2e4a]">Valor base: {formatCurrency(flightTotal)}</p> : null}
      >
        
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
      </PaymentSection>

      {/* FORMA DE PAGAMENTO DO HOTEL */}
      <PaymentSection
        id="hotel"
        title="Forma de Pagamento do Hotel"
        titleClassName="text-green-700"
        containerClassName="border-2 border-green-300 rounded-lg p-4 bg-green-50"
        buttonClassName="h-7 shrink-0 px-2 text-[11px] text-green-700 hover:bg-green-100"
        collapsed={isPaymentSectionCollapsed("hotel")}
        onToggle={() => togglePaymentSection("hotel")}
        summary={hotelTotal > 0 ? <p className="mt-2 text-xs font-semibold text-[#1a2e4a]">Total: {formatCurrency(hotelTotal)}</p> : null}
      >
        
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
      </PaymentSection>

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
        {installments?.combined && (
          <div className="mt-3 ml-6 max-w-52">
            <Label className="text-xs text-slate-600">Número de Parcelas (Hotel + Aéreo)</Label>
            <Input
              type="number"
              min="1"
              value={installments?.combinedInstallments ?? flightInstallments}
              onChange={(e) => updateInstallments("combinedInstallments", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ex: 10"
              className="h-8 text-sm mt-1"
            />
          </div>
        )}
        {installments?.combined && !hasCombinedPaymentSteps && combinedOptions.map((option) => (
          <p key={option.id} className="text-[10px] text-[#1a2e4a] font-semibold mt-2 ml-6">
            {combinedOptions.length > 1 ? `${option.label}: ` : ""}
            {combinedInstallments}x de {formatCurrency(option.total / combinedInstallments)}
          </p>
        ))}
        {installments?.combined && !hasCombinedPaymentSteps && (
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
        {installments?.combined && (
          <div className="mt-4 ml-6 max-w-md border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#1a2e4a]">Outras formas de pagamento</Label>
                <p className="mt-1 text-[10px] text-slate-500">Cada Pagamento é uma alternativa independente. Adicione dentro dele as formas necessárias para compor o total que deseja apresentar.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 border-slate-300 bg-white text-xs text-[#1a2e4a]"
                onClick={() => updateInstallments("combinedPaymentSteps", [
                  ...combinedPaymentConditions,
                  {
                    id: `combined-condition-${Date.now()}-${combinedPaymentConditions.length}`,
                    label: `Pagamento ${combinedPaymentConditions.length + 1}`,
                    color: PAYMENT_CONDITION_COLORS[combinedPaymentConditions.length % PAYMENT_CONDITION_COLORS.length],
                    steps: [{ id: `combined-step-${Date.now()}-0`, amount: 0, installments: 1, paymentMethod: "cartao" }],
                  },
                ])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>

            {hasCombinedPaymentSteps && (
              <div className="mt-3 space-y-2">
                {combinedPaymentConditions.map((condition, index) => {
                  const updateConditions = (nextConditions: CombinedPaymentCondition[]) => updateInstallments("combinedPaymentSteps", nextConditions);
                  const updateStep = (stepId: string, patch: Partial<CombinedPaymentStep>) => updateConditions(
                    combinedPaymentConditions.map((current) => current.id === condition.id
                      ? { ...current, steps: current.steps.map((step) => step.id === stepId ? { ...step, ...patch } : step) }
                      : current),
                  );
                  const addStep = () => updateConditions(
                    combinedPaymentConditions.map((current) => current.id === condition.id
                      ? {
                          ...current,
                          steps: [...current.steps, { id: `combined-step-${Date.now()}-${current.steps.length}`, amount: 0, installments: 1, paymentMethod: "cartao" }],
                        }
                      : current),
                  );
                  const removeStep = (stepId: string) => updateConditions(
                    combinedPaymentConditions.map((current) => current.id === condition.id
                      ? { ...current, steps: current.steps.filter((step) => step.id !== stepId) }
                      : current).filter((current) => current.steps.length > 0),
                  );
                  const samplePlan = calculateCombinedPaymentPlan(combinedOptions[0]?.total ?? 0, combinedPaymentConditions);
                  const sampleCondition = samplePlan.find((current) => current.id === condition.id);
                  const isCollapsed = collapsedPaymentConditions.includes(condition.id);
                  const toggleCollapsed = () => setCollapsedPaymentConditions((current) => (
                    current.includes(condition.id)
                      ? current.filter((id) => id !== condition.id)
                      : [...current, condition.id]
                  ));
                  const duplicateCondition = () => {
                    const duplicateId = `combined-condition-${Date.now()}-${index}`;
                    const duplicate: CombinedPaymentCondition = {
                      id: duplicateId,
                      label: condition.label ? `${condition.label} (cópia)` : undefined,
                      color: PAYMENT_CONDITION_COLORS[(index + 1) % PAYMENT_CONDITION_COLORS.length],
                      steps: condition.steps.map((step, stepIndex) => ({
                        ...step,
                        id: `combined-step-${Date.now()}-${index}-${stepIndex}`,
                      })),
                    };
                    updateConditions([
                      ...combinedPaymentConditions.slice(0, index + 1),
                      duplicate,
                      ...combinedPaymentConditions.slice(index + 1),
                    ]);
                  };

                  return (
                    <div
                      key={condition.id}
                      className="rounded-md border border-slate-200 bg-slate-50 p-2.5"
                      style={{ borderLeft: `3px solid ${getPaymentConditionColor(condition, index)}` }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Label htmlFor={`combined-payment-label-${condition.id}`} className="text-[10px] text-slate-500">Nome do Pagamento</Label>
                          <Input
                            id={`combined-payment-label-${condition.id}`}
                            value={condition.label ?? `Pagamento ${index + 1}`}
                            onChange={(event) => updateConditions(
                              combinedPaymentConditions.map((current) => current.id === condition.id
                                ? { ...current, label: event.target.value }
                                : current),
                            )}
                            className="mt-1 h-7 max-w-56 bg-white text-[11px] font-semibold text-[#1a2e4a]"
                            aria-label={`Nome do pagamento ${index + 1}`}
                          />
                        </div>
                        <label className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-slate-500">
                          Cor
                          <input
                            type="color"
                            value={getPaymentConditionColor(condition, index)}
                            onChange={(event) => updateConditions(
                              combinedPaymentConditions.map((current) => current.id === condition.id
                                ? { ...current, color: event.target.value }
                                : current),
                            )}
                            className="h-6 w-8 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                            aria-label={`Cor do pagamento ${index + 1}`}
                          />
                        </label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-slate-600 hover:bg-slate-200"
                            aria-label={`${isCollapsed ? "Expandir" : "Recolher"} pagamento ${index + 1}`}
                            onClick={toggleCollapsed}
                          >
                            {isCollapsed ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronUp className="mr-1 h-3 w-3" />}
                            {isCollapsed ? "Expandir" : "Recolher"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[10px] text-slate-600 hover:bg-slate-200"
                            aria-label={`Duplicar pagamento ${index + 1}`}
                            onClick={duplicateCondition}
                          >
                            <Copy className="mr-1 h-3 w-3" /> Duplicar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remover pagamento ${index + 1}`}
                            onClick={() => updateConditions(combinedPaymentConditions.filter((current) => current.id !== condition.id))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {isCollapsed && sampleCondition && (
                        <p className="-mt-1 mb-2 text-[10px] font-semibold text-[#1a2e4a]">
                          Total de {getPaymentConditionLabel(condition, index)}: {formatCurrency(sampleCondition.total)}
                        </p>
                      )}
                      {!isCollapsed && <div className="space-y-2">
                        {condition.steps.map((step, stepIndex) => {
                          return (
                          <div
                            key={step.id}
                            className="rounded border border-slate-200 bg-white p-2"
                          >
                            <div className="mb-1 flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Remover opção de pagamento ${stepIndex + 1} do pagamento ${index + 1}`}
                                onClick={() => removeStep(step.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] gap-2">
                              <div>
                                <Label className="text-[10px] text-slate-500">Valor (R$)</Label>
                                <Input type="number" min="0" step="0.01" value={step.amount || ""} onChange={(event) => updateStep(step.id, { amount: Number(event.target.value) || 0 })} className="mt-1 h-8 text-xs" placeholder="Ex: 4000" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">Parcelas</Label>
                                <Input type="number" min="1" value={step.installments || ""} onChange={(event) => updateStep(step.id, { installments: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 h-8 text-xs" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-slate-500">Forma</Label>
                                <select value={step.paymentMethod} onChange={(event) => updateStep(step.id, { paymentMethod: event.target.value as CombinedPaymentMethod, cardRate: event.target.value === "cartao" ? step.cardRate : 0 })} className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700">
                                  <option value="cartao">Cartão</option>
                                  <option value="pix">PIX</option>
                                  <option value="dinheiro">Dinheiro</option>
                                </select>
                              </div>
                            </div>
                            {step.paymentMethod === "cartao" && (
                              <div className="mt-2 max-w-36">
                                <Label className="text-[10px] text-slate-500">Taxa do cartão (%)</Label>
                                <Input type="number" min="0" step="0.01" value={step.cardRate || ""} onChange={(event) => updateStep(step.id, { cardRate: Number(event.target.value) || 0 })} placeholder="Opcional" className="mt-1 h-8 text-xs" />
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>}
                      {!isCollapsed && <Button type="button" variant="outline" size="sm" className="mt-2 h-7 border-slate-300 bg-white text-[10px] text-[#1a2e4a]" onClick={addStep}>
                        <Plus className="mr-1 h-3 w-3" /> Adicionar forma
                      </Button>}
                      {sampleCondition && (
                        <p className={`${isCollapsed ? "hidden" : "mt-2"} text-[10px] font-semibold text-[#1a2e4a]`}>
                          Total de {getPaymentConditionLabel(condition, index)}: {formatCurrency(sampleCondition.total)}
                        </p>
                      )}
                    </div>
                  );
                })}
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
