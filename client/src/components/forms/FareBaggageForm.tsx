import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function FareBaggageForm() {
  const { budget, updateFareTier, updateBaggage } = useBudget();
  const { fareComparison, baggage } = budget;

  const tiers: ("basic" | "light" | "full")[] = ["basic", "light", "full"];

  return (
    <div className="space-y-4">
      {/* Fare comparison */}
      <div>
        <Label className="text-xs font-bold text-slate-600">Comparativo de Tarifas (Aéreo)</Label>
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-2 text-left font-bold text-slate-500 uppercase">Benefício</th>
                {tiers.map((t) => (
                  <th
                    key={t}
                    className={`p-2 text-center font-bold uppercase ${t === "full" ? "text-[#1a2e4a] bg-amber-100" : "text-slate-500"}`}
                  >
                    {fareComparison[t].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <BenefitCheckboxRow
                label="Mala de Mão"
                values={tiers.map((t) => fareComparison[t].carryOn)}
                onChange={(tier, val) => updateFareTier(tier, "carryOn", val)}
              />
              <BenefitCheckboxRow
                label="Mala Despachada"
                values={tiers.map((t) => fareComparison[t].checkedBag)}
                onChange={(tier, val) => updateFareTier(tier, "checkedBag", val)}
              />
              <BenefitCheckboxRow
                label="Seleção de Assento"
                values={tiers.map((t) => fareComparison[t].seatSelection)}
                onChange={(tier, val) => updateFareTier(tier, "seatSelection", val)}
              />
              <BenefitCheckboxRow
                label="Alterações/Reembolso"
                values={tiers.map((t) => fareComparison[t].changes)}
                onChange={(tier, val) => updateFareTier(tier, "changes", val)}
              />
              <tr className="border-t border-slate-200">
                <td className="p-2 font-bold text-slate-600">Valor Total Voos (R$)</td>
                {tiers.map((t) => (
                  <td key={t} className={`p-2 ${t === "full" ? "bg-amber-50" : ""}`}>
                    <Input
                      type="number"
                      value={fareComparison[t].flightPrice || ""}
                      onChange={(e) => updateFareTier(t, "flightPrice", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="h-8 text-xs text-center"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Baggage guide */}
      <div>
        <Label className="text-xs font-bold text-slate-600">Guia de Bagagens (Avulsas)</Label>
        <div className="mt-2 space-y-2">
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
      </div>
    </div>
  );
}

function BenefitCheckboxRow({
  label,
  values,
  onChange,
}: {
  label: string;
  values: boolean[];
  onChange: (tier: "basic" | "light" | "full", val: boolean) => void;
}) {
  const tiers: ("basic" | "light" | "full")[] = ["basic", "light", "full"];
  return (
    <tr className="border-t border-slate-100">
      <td className="p-2 font-medium text-slate-600">{label}</td>
      {tiers.map((t, i) => (
        <td key={t} className={`p-2 text-center ${t === "full" ? "bg-amber-50" : ""}`}>
          <Checkbox
            checked={values[i]}
            onCheckedChange={(checked) => onChange(t, checked === true)}
          />
        </td>
      ))}
    </tr>
  );
}
