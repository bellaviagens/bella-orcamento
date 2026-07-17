import { useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Star } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export function FareForm() {
  const { budget, addFareTier, updateFareTier, removeFareTier } = useBudget();
  const { fareComparison } = budget;
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [carryOn, setCarryOn] = useState(false);
  const [checkedBag, setCheckedBag] = useState(false);
  const [seatSelection, setSeatSelection] = useState(false);
  const [changes, setChanges] = useState(false);
  const [flightPrice, setFlightPrice] = useState(0);
  const [highlighted, setHighlighted] = useState(false);

  // Gerar benefícios baseado nas checkboxes
  const getBenefits = () => {
    const benefits = [];
    if (carryOn) benefits.push("Mala de Mão");
    if (checkedBag) benefits.push("Mala Despachada");
    if (seatSelection) benefits.push("Seleção de Assento");
    if (changes) benefits.push("Alterações/Reembolso");
    return benefits;
  };

  const resetForm = () => {
    setName("");
    setCarryOn(false);
    setCheckedBag(false);
    setSeatSelection(false);
    setChanges(false);
    setFlightPrice(0);
    setHighlighted(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome da tarifa é obrigatório");
      return;
    }

    addFareTier({
      name: name.trim(),
      carryOn,
      checkedBag,
      seatSelection,
      changes,
      flightPrice,
      highlighted,
      benefits: getBenefits(),
    });

    toast.success("Tarifa adicionada com sucesso!");
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Existing tiers */}
      {fareComparison.tiers.length > 0 && (
        <div className="space-y-2">
          {fareComparison.tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-lg border p-3 ${
                tier.highlighted ? "bg-amber-50 border-amber-300" : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {tier.highlighted && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  <span className="font-bold text-[#1a2e4a]">{tier.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFareTier(tier.id)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={tier.carryOn}
                    onCheckedChange={(checked) =>
                      updateFareTier(tier.id, { carryOn: checked === true })
                    }
                  />
                  <span className="text-slate-600">Mala de Mão</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={tier.checkedBag}
                    onCheckedChange={(checked) =>
                      updateFareTier(tier.id, { checkedBag: checked === true })
                    }
                  />
                  <span className="text-slate-600">Mala Despachada</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={tier.seatSelection}
                    onCheckedChange={(checked) =>
                      updateFareTier(tier.id, { seatSelection: checked === true })
                    }
                  />
                  <span className="text-slate-600">Seleção de Assento</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={tier.changes}
                    onCheckedChange={(checked) =>
                      updateFareTier(tier.id, { changes: checked === true })
                    }
                  />
                  <span className="text-slate-600">Alterações/Reembolso</span>
                </div>
              </div>

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
            <Label className="text-xs font-semibold">Benefícios</Label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox checked={carryOn} onCheckedChange={(c) => setCarryOn(c === true)} />
                <span className="text-xs text-slate-600">Mala de Mão</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={checkedBag} onCheckedChange={(c) => setCheckedBag(c === true)} />
                <span className="text-xs text-slate-600">Mala Despachada</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={seatSelection} onCheckedChange={(c) => setSeatSelection(c === true)} />
                <span className="text-xs text-slate-600">Seleção de Assento</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={changes} onCheckedChange={(c) => setChanges(c === true)} />
                <span className="text-xs text-slate-600">Alterações / Reembolso</span>
              </div>
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
