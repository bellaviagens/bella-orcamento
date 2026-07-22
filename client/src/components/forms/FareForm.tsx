import { useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Star, Edit2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export function FareForm() {
  const { budget, addFareTier, updateFareTier, removeFareTier } = useBudget();
  const { fareComparison } = budget;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [bagages, setBagages] = useState<string[]>([]);
  const [checkIns, setCheckIns] = useState<string[]>([]);
  const [changes, setChanges] = useState<string[]>([]);
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
    return [...bagages, ...checkIns, ...changes];
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
    setBagages(["Bagagem de mão"]);
    setCheckIns([]);
    setChanges([]);
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
        flightPrice,
        highlighted,
        paymentMethods,
        installments,
      });
      toast.success("Tarifa atualizada com sucesso!");
      setShowForm(false);
      resetForm();
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
                    onCheckedChange={() => togglePayment(method)}
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
