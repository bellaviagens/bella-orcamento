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
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '');
              if (value.length > 0) {
                if (value.length <= 2) {
                  value = value;
                } else if (value.length <= 4) {
                  value = value.slice(0, 2) + '/' + value.slice(2);
                } else if (value.length <= 8) {
                  value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8);
                } else if (value.length <= 10) {
                  value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8) + ' \u00e0 ' + value.slice(8, 10);
                } else if (value.length <= 12) {
                  value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8) + ' \u00e0 ' + value.slice(8, 10) + '/' + value.slice(10, 12);
                } else {
                  value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4, 8) + ' \u00e0 ' + value.slice(8, 10) + '/' + value.slice(10, 12) + '/' + value.slice(12, 16);
                }
              }
              updateTripInfo("period", value);
            }}
            placeholder="__/__/____ \u00e0 __/__/____"
            className="mt-1"
            maxLength={27}
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
