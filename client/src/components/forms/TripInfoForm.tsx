import { useBudget } from "@/contexts/BudgetContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TripInfoForm() {
  const { budget, updateTripInfo } = useBudget();
  const { tripInfo } = budget;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Destino</Label>
          <Input
            value={tripInfo.destination}
            onChange={(e) => updateTripInfo("destination", e.target.value)}
            placeholder="Ex: Santiago, Chile"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Período</Label>
          <Input
            value={tripInfo.period}
            onChange={(e) => updateTripInfo("period", e.target.value)}
            placeholder="Ex: 15/01 a 22/01/2026"
            className="mt-1"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-slate-600">Passageiros</Label>
          <Input
            value={tripInfo.passengers}
            onChange={(e) => updateTripInfo("passengers", e.target.value)}
            placeholder="Ex: 2 Adultos"
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Cia. Aérea</Label>
          <Input
            value={tripInfo.airline}
            onChange={(e) => updateTripInfo("airline", e.target.value)}
            placeholder="Ex: LATAM"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-600">Texto de Introdução</Label>
        <Textarea
          value={tripInfo.introText}
          onChange={(e) => updateTripInfo("introText", e.target.value)}
          placeholder="Texto personalizado para o cliente"
          className="mt-1"
          rows={3}
        />
      </div>
    </div>
  );
}
