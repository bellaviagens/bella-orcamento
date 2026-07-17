import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BaggageForm() {
  const { budget, updateBaggage } = useBudget();
  const { baggage } = budget;

  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold text-slate-500 uppercase">Bagagens</Label>
      {baggage.map((b, i) => (
        <div key={i} className="rounded border border-slate-100 bg-slate-50 p-2">
          <div className="grid grid-cols-4 gap-1.5 items-end">
            <div>
              <Label className="text-[9px] text-slate-400">Tipo</Label>
              <Input
                value={b.type}
                onChange={(e) => updateBaggage(i, "type", e.target.value)}
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[9px] text-slate-400">Peso</Label>
              <Input
                value={b.weight}
                onChange={(e) => updateBaggage(i, "weight", e.target.value)}
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[9px] text-slate-400">Antec. (R$)</Label>
              <Input
                type="number"
                value={b.priceAdvance || ""}
                onChange={(e) => updateBaggage(i, "priceAdvance", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[9px] text-slate-400">Aero. (R$)</Label>
              <Input
                type="number"
                value={b.priceAirport || ""}
                onChange={(e) => updateBaggage(i, "priceAirport", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
