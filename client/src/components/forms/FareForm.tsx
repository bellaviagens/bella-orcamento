import { useRef, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Star, Edit2, ChevronDown, ChevronRight } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { collectFareBenefits, FARE_BAGGAGE_OPTIONS } from "@shared/fareBenefits";

export function FareForm() {
  const { budget, addFareTier, updateFareTier, removeFareTier } = useBudget();
  const { fareComparison } = budget;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  // Form state
  const [name, setName] = useState("");
  const [bagages, setBagages] = useState<string[]>([]);
  const [checkIns, setCheckIns] = useState<string[]>([]);
  const [changes, setChanges] = useState<string[]>([]);
  const [customBenefits, setCustomBenefits] = useState<string[]>([]);
  const [customBenefitInput, setCustomBenefitInput] = useState("");
  const [showBenefitEditor, setShowBenefitEditor] = useState(false);
  const firstBenefitInputRef = useRef<HTMLInputElement>(null);
  const [flightPrice, setFlightPrice] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [installments, setInstallments] = useState(1);

  const bagageOptions = FARE_BAGGAGE_OPTIONS;

  const checkInOptions = [
    "Embarque prioritário",
    "Check-in prioritário",
  ];

  const changesOptions = [
    "Alteração/Reembolso sem taxa",
    "Alteração/Reembolso com taxa",
  ];

  const paymentOptions = [
    "Cartão",
    "Dinheiro",
    "PIX",
  ];

  // Gerar benefícios baseado nas seleções
  const getBenefits = () => {
    return collectFareBenefits({ bagages, checkIns, changes, customBenefits });
  };

  const addCustomBenefit = () => {
    const benefit = customBenefitInput.trim();
    if (!benefit || getBenefits().includes(benefit)) return;
    setCustomBenefits((prev) => [...prev, benefit]);
    setCustomBenefitInput("");
  };

  const updateSelectedBenefit = (currentBenefit: string, nextBenefit: string) => {
    const replaceBenefit = (benefits: string[]) => benefits.map((benefit) => (
      benefit === currentBenefit ? nextBenefit : benefit
    ));

    if (bagages.includes(currentBenefit)) {
      setBagages(replaceBenefit);
    } else if (checkIns.includes(currentBenefit)) {
      setCheckIns(replaceBenefit);
    } else if (changes.includes(currentBenefit)) {
      setChanges(replaceBenefit);
    } else {
      setCustomBenefits(replaceBenefit);
    }
  };

  const removeSelectedBenefit = (benefitToRemove: string) => {
    setBagages((prev) => prev.filter((benefit) => benefit !== benefitToRemove));
    setCheckIns((prev) => prev.filter((benefit) => benefit !== benefitToRemove));
    setChanges((prev) => prev.filter((benefit) => benefit !== benefitToRemove));
    setCustomBenefits((prev) => prev.filter((benefit) => benefit !== benefitToRemove));
  };

  const openBenefitEditor = () => {
    setShowBenefitEditor(true);
    window.requestAnimationFrame(() => {
      firstBenefitInputRef.current?.focus();
      firstBenefitInputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const toggleBagage = (bagage: string) => {
    setBagages((prev) =>
      prev.includes(bagage) ? prev.filter((b) => b !== bagage) : [...prev, bagage]
    );
  };

  const toggleCheckIn = (checkIn: string) => {
    setCheckIns((prev) =>
      prev.includes(checkIn) ? prev.filter((c) => c !== checkIn) : [...prev, checkIn]
    );
  };

  const toggleChange = (change: string) => {
    setChanges((prev) =>
      prev.includes(change) ? prev.filter((c) => c !== change) : [...prev, change]
    );
  };

  const togglePayment = (payment: string) => {
    setPaymentMethods((prev) =>
      prev.includes(payment) ? prev.filter((p) => p !== payment) : [...prev, payment]
    );
  };

  const resetForm = () => {
    setName("");
    setBagages(["Bolsa ou mochila de até 10kg"]);
    setCheckIns([]);
    setChanges([]);
    setCustomBenefits([]);
    setCustomBenefitInput("");
    setShowBenefitEditor(false);
    setFlightPrice(0);
    setHighlighted(false);
    setPaymentMethods([]);
    setInstallments(1);
    setEditingId(null);
  };

  const handleEdit = (tier: any) => {
    setEditingId(tier.id);
    setName(tier.name);
    setBagages(tier.bagages || []);
    setCheckIns(tier.checkIns || []);
    setChanges(tier.changes || []);
    const configuredBenefits = [...(tier.bagages || []), ...(tier.checkIns || []), ...(tier.changes || [])];
    setCustomBenefits((tier.benefits || []).filter((benefit: string) => !configuredBenefits.includes(benefit)));
    setCustomBenefitInput("");
    setShowBenefitEditor(false);
    setFlightPrice(tier.flightPrice || 0);
    setHighlighted(tier.highlighted || false);
    setPaymentMethods(tier.paymentMethods || []);
    setInstallments(tier.installments || 1);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome da tarifa é obrigatório");
      return;
    }

    if (editingId) {
      updateFareTier(editingId, {
        name: name.trim(),
        bagages,
        checkIns,
        changes,
        benefits: getBenefits(),
        flightPrice,
        highlighted,
        paymentMethods,
        installments,
      });
      toast.success("Tarifa atualizada com sucesso!");
      setShowForm(false);
      resetForm();
      setExpandedTiers(new Set());
      return;
    }

    addFareTier({
      name: name.trim(),
      bagages,
      checkIns,
      changes,
      flightPrice,
      highlighted,
      paymentMethods,
      installments,
      benefits: getBenefits(),
    });

    toast.success("Tarifa adicionada com sucesso!");
    resetForm();
    setShowForm(false);
    setExpandedTiers(new Set());
  };

  return (
    <div className="space-y-3">
      {/* Existing tiers */}
      {fareComparison.tiers.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {fareComparison.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-lg border p-3 ${
                tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedTiers);
                      if (newExpanded.has(tier.id)) {
                        newExpanded.delete(tier.id);
                      } else {
                        newExpanded.add(tier.id);
                      }
                      setExpandedTiers(newExpanded);
                    }}
                    className="p-0.5 hover:bg-slate-100 rounded"
                  >
                    {expandedTiers.has(tier.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {tier.highlighted && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  <span className="font-bold text-[#1a2e4a]">{tier.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tier)}
                    className="text-blue-500 hover:text-blue-700 h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFareTier(tier.id)}
                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expandedTiers.has(tier.id) && (
                <div className="space-y-2 text-xs mb-2">
                  <div>
                  <Label className="text-[10px] text-slate-500 font-semibold">Bagagem</Label>
                  <div className="space-y-1 mt-1">
                    {bagageOptions.map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox
                          checked={(tier.bagages || []).includes(opt)}
                          onCheckedChange={(checked) => {
                            const newBagages = checked
                              ? [...(tier.bagages || []), opt]
                              : (tier.bagages || []).filter((b) => b !== opt);
                            updateFareTier(tier.id, { bagages: newBagages });
                          }}
                        />
                        <span className="text-slate-600">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-slate-500 font-semibold">Check-in</Label>
                  <div className="space-y-1 mt-1">
                    {checkInOptions.map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox
                          checked={(tier.checkIns || []).includes(opt)}
                          onCheckedChange={(checked) => {
                            const newCheckIns = checked
                              ? [...(tier.checkIns || []), opt]
                              : (tier.checkIns || []).filter((c) => c !== opt);
                            updateFareTier(tier.id, { checkIns: newCheckIns });
                          }}
                        />
                        <span className="text-slate-600">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[10px] text-slate-500 font-semibold">Alterações/Reembolso</Label>
                  <div className="space-y-1 mt-1">
                    {changesOptions.map((opt) => (
                      <div key={opt} className="flex items-center gap-2">
                        <Checkbox
                          checked={(tier.changes || []).includes(opt)}
                          onCheckedChange={(checked) => {
                            const newChanges = checked
                              ? [...(tier.changes || []), opt]
                              : (tier.changes || []).filter((c) => c !== opt);
                            updateFareTier(tier.id, { changes: newChanges });
                          }}
                        />
                        <span className="text-slate-600">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Valor Total (R$)</Label>
                  <Input
                    type="number"
                    value={tier.flightPrice || ""}
                    onChange={(e) =>
                      updateFareTier(tier.id, { flightPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant={tier.highlighted ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFareTier(tier.id, { highlighted: !tier.highlighted })}
                    className={`w-full ${tier.highlighted ? "bg-amber-400 text-[#1a2e4a] hover:bg-amber-300" : ""}`}
                  >
                    {tier.highlighted ? "★ Destacada" : "Destacar"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Tarifa
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1a2e4a]">Nova Tarifa</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
          </div>

          <div>
            <Label className="text-xs">Nome da Tarifa</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: BASIC, LIGHT, FULL, Premium"
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Bagagem</Label>
            <div className="space-y-1.5">
              {bagageOptions.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    checked={bagages.includes(opt)}
                    onCheckedChange={() => toggleBagage(opt)}
                  />
                  <span className="text-xs text-slate-600">{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Check-in</Label>
            <div className="space-y-1.5">
              {checkInOptions.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    checked={checkIns.includes(opt)}
                    onCheckedChange={() => toggleCheckIn(opt)}
                  />
                  <span className="text-xs text-slate-600">{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Alterações/Reembolso</Label>
            <div className="space-y-1.5">
              {changesOptions.map((opt) => (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    checked={changes.includes(opt)}
                    onCheckedChange={() => toggleChange(opt)}
                  />
                  <span className="text-xs text-slate-600">{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Opcionais selecionados</Label>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-500">
                {getBenefits().length} opcional(is) selecionado(s). Edite somente se necessário.
              </p>
              {getBenefits().length > 0 && !showBenefitEditor && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openBenefitEditor}
                  className="h-7 shrink-0 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Editar opcionais
                </Button>
              )}
              {showBenefitEditor && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBenefitEditor(false)}
                  className="h-7 shrink-0 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Concluir edição
                </Button>
              )}
            </div>
            {showBenefitEditor && getBenefits().length > 0 && (
              <div className="space-y-1.5">
                {getBenefits().map((benefit, index) => (
                  <div key={`selected-benefit-${index}`} className="flex items-center gap-2">
                    <Input
                      ref={index === 0 ? firstBenefitInputRef : undefined}
                      value={benefit}
                      onChange={(event) => updateSelectedBenefit(benefit, event.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedBenefit(benefit)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      aria-label={`Remover ${benefit}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={customBenefitInput}
                onChange={(event) => setCustomBenefitInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomBenefit();
                  }
                }}
                placeholder="Incluir outro opcional"
                className="h-8 text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomBenefit} className="h-8 whitespace-nowrap">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Incluir
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs">Valor Total dos Voos (R$)</Label>
            <Input
              type="number"
              value={flightPrice || ""}
              onChange={(e) => setFlightPrice(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="mt-1"
            />
          </div>



          <div className="flex items-center gap-2">
            <Checkbox checked={highlighted} onCheckedChange={(c) => setHighlighted(c === true)} />
            <span className="text-xs text-slate-600">Destacar esta tarifa no orçamento</span>
          </div>

          <Button onClick={handleSave} className="w-full">
            Salvar Tarifa
          </Button>
        </div>
      )}
    </div>
  );
}
