import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BaggageForm() {
  const { budget, updateBaggage } = useBudget();
  const { baggage } = budget;

  return (
    <div className="space-y-3">
      <Label className="text-xs font-bold text-slate-600">Guia de Bagagens (Avulsas)</Label>
      {baggage.map((b, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="grid grid-cols-4 gap-2 items-end">
            <div>
              <Label className="text-[10px] text-slate-500">Tipo</Label>
              <Input
                value={b.type}
                onChange={(e) => updateBaggage(i, "type", e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Peso</Label>
              <Input
                value={b.weight}
                onChange={(e) => updateBaggage(i, "weight", e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">Com antecedência (R$)</Label>
              <Input
                type="number"
                value={b.priceAdvance || ""}
                onChange={(e) => updateBaggage(i, "priceAdvance", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] text-slate-500">No aeroporto (R$)</Label>
              <Input
                type="number"
                value={b.priceAirport || ""}
                onChange={(e) => updateBaggage(i, "priceAirport", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
