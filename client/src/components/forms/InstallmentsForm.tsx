import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function InstallmentsForm() {
  const { budget, updateInstallments } = useBudget();
  const { installments } = budget;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Parcelamento do Aéreo</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min="1"
            value={installments?.flight || ""}
            onChange={(e) => updateInstallments("flight", parseInt(e.target.value) || 1)}
            placeholder="Ex: 4"
            className="h-8 text-sm"
          />
          <span className="text-xs text-slate-500">vezes</span>
        </div>
      </div>

      <div>
        <Label className="text-[11px] font-semibold text-slate-500 uppercase">Parcelamento do Hotel</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            min="1"
            value={installments?.hotel || ""}
            onChange={(e) => updateInstallments("hotel", parseInt(e.target.value) || 1)}
            placeholder="Ex: 10"
            className="h-8 text-sm"
          />
          <span className="text-xs text-slate-500">vezes</span>
        </div>
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
      </div>
    </div>
  );
}
