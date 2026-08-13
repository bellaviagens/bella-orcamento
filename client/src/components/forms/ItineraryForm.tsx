import { useBudget } from "@/contexts/BudgetContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2 } from "lucide-react";

export function ItineraryForm() {
  const { budget, addItineraryDay, updateItineraryDay, removeItineraryDay } = useBudget();
  const itinerary = [...budget.itinerary].sort((left, right) => left.day - right.day);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#1a2e4a]">
        Monte este roteiro após a aprovação do orçamento. Esta organização possui uma visualização própria e não é incluída no preview ou PDF do orçamento.
      </div>

      {itinerary.map((day) => (
        <div key={day.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{day.day}</div><span className="text-sm font-bold text-[#1a2e4a]">Dia {day.day}</span></div>
            <Button variant="ghost" size="sm" onClick={() => removeItineraryDay(day.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title={`Remover dia ${day.day}`}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Atividade</Label><Select value={day.tourId || "free"} onValueChange={(value) => {
              if (value === "free") updateItineraryDay(day.id, { tourId: undefined, title: "Dia livre" });
              else {
                const tour = budget.tours.find((currentTour) => currentTour.id === value);
                updateItineraryDay(day.id, { tourId: value, title: tour?.name || day.title });
              }
            }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Dia livre</SelectItem>{budget.tours.map((tour) => <SelectItem key={tour.id} value={tour.id}>{tour.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Título exibido</Label><Input value={day.title} onChange={(event) => updateItineraryDay(day.id, { title: event.target.value })} placeholder="Ex.: Dia livre" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Observações do dia</Label><Textarea value={day.notes} onChange={(event) => updateItineraryDay(day.id, { notes: event.target.value })} placeholder="Horários, recomendações ou informações adicionais" className="mt-1 min-h-20" /></div>
          </div>
        </div>
      ))}

      {itinerary.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"><CalendarDays className="mx-auto mb-2 h-5 w-5 text-slate-400" />Ainda não há dias no roteiro. Comece adicionando o primeiro dia.</div>}
      <Button variant="outline" onClick={addItineraryDay} className="h-12 w-full text-base font-bold shadow-md"><Plus className="mr-2 h-5 w-5" />Adicionar dia ao roteiro</Button>
    </div>
  );
}
