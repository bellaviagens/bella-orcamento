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
  const [bagageType, setBagageType] = useState("");
  const [checkInType, setCheckInType] = useState("");
  const [changes, setChanges] = useState("");
  const [flightPrice, setFlightPrice] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [installments, setInstallments] = useState(1);

  const bagageOptions = [
    "Bagagem de mão",
    "Bagagem de 10 kg",
    "Bagagem de 23 kg",
  ];

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
    const benefits = [];
    if (bagageType) benefits.push(bagageType);
    if (checkInType) benefits.push(checkInType);
    if (changes) benefits.push(changes);
    return benefits;
  };

  const resetForm = () => {
    setName("");
    setBagageType("");
    setCheckInType("");
    setChanges("");
    setFlightPrice(0);
    setHighlighted(false);
    setPaymentMethods([]);
    setInstallments(1);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome da tarifa é obrigatório");
      return;
    }

    addFareTier({
      name: name.trim(),
      bagageType,
      checkInType,
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

              <div className="space-y-2 text-xs mb-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Bagagem</Label>
                  <select
                    value={tier.bagageType || ""}
                    onChange={(e) => updateFareTier(tier.id, { bagageType: e.target.value })}
                    className="w-full h-8 text-xs border border-slate-200 rounded px-2 mt-1"
                  >
                    <option value="">Selecionar...</option>
                    {bagageOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Check-in</Label>
                  <select
                    value={tier.checkInType || ""}
                    onChange={(e) => updateFareTier(tier.id, { checkInType: e.target.value })}
                    className="w-full h-8 text-xs border border-slate-200 rounded px-2 mt-1"
                  >
                    <option value="">Selecionar...</option>
                    {checkInOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Alterações/Reembolso</Label>
                  <select
                    value={tier.changes || ""}
                    onChange={(e) => updateFareTier(tier.id, { changes: e.target.value })}
                    className="w-full h-8 text-xs border border-slate-200 rounded px-2 mt-1"
                  >
                    <option value="">Selecionar...</option>
                    {changesOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
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
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Bagagem</Label>
                <select
                  value={bagageType}
                  onChange={(e) => setBagageType(e.target.value)}
                  className="w-full h-8 text-xs border border-slate-200 rounded px-2 mt-1"
                >
                  <option value="">Selecionar...</option>
                  {bagageOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Check-in</Label>
                <select
                  value={checkInType}
                  onChange={(e) => setCheckInType(e.target.value)}
                  className="w-full h-8 text-xs border border-slate-200 rounded px-2 mt-1"
                >
                  <option value="">Selecionar...</option>
                  {checkInOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Alterações/Reembolso</Label>
                <select
                  value={changes}
                  onChange={(e) => setChanges(e.target.value)}
                  className="w-full h-8 text-xs border border-slate-200 rounded px-2 mt-1"
                >
                  <option value="">Selecionar...</option>
                  {changesOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
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

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Forma de Pagamento</Label>
            <div className="space-y-1.5">
              {paymentOptions.map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <Checkbox
                    checked={paymentMethods.includes(method)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPaymentMethods([...paymentMethods, method]);
                      } else {
                        setPaymentMethods(paymentMethods.filter((m) => m !== method));
                      }
                    }}
                  />
                  <span className="text-xs text-slate-600">{method}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Parcelamento (vezes)</Label>
            <Input
              type="number"
              min="1"
              max="12"
              value={installments || 1}
              onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
              placeholder="1"
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
