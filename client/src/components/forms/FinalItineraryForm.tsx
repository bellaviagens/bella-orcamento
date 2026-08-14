import { useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, CalendarDays, CarFront, GripVertical, Hotel, Link2, Plane, Plus, Trash2 } from "lucide-react";
import type { FinalItineraryEventKind } from "@shared/budgetTypes";

const EVENT_LABELS: Record<FinalItineraryEventKind, string> = {
  arrival: "Chegada",
  transfer: "Transfer",
  hotel: "Hospedagem",
  flight: "Voo",
  return: "Retorno",
  tour: "Passeio",
  custom: "Informação livre",
};

const EVENT_ORDER: Record<FinalItineraryEventKind, number> = {
  flight: 0,
  arrival: 1,
  transfer: 2,
  hotel: 3,
  tour: 4,
  return: 5,
  custom: 6,
};

export function FinalItineraryForm() {
  const {
    budget,
    updateFinalItinerary,
    addFinalItineraryEvent,
    updateFinalItineraryEvent,
    removeFinalItineraryEvent,
    reorderFinalItineraryEvents,
    addFlightToFinalItinerary,
    addHotelToFinalItinerary,
    addTourToFinalItinerary,
  } = useBudget();
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);
  const finalItinerary = budget.finalItinerary;
  const events = [...finalItinerary.events].sort((first, second) =>
    first.day - second.day || EVENT_ORDER[first.kind] - EVENT_ORDER[second.kind] || first.time.localeCompare(second.time),
  );

  const reorder = (targetId: string) => {
    if (!draggedEventId || draggedEventId === targetId) return;
    const sourceIndex = events.findIndex((event) => event.id === draggedEventId);
    const targetIndex = events.findIndex((event) => event.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const nextEvents = [...events];
    const [moved] = nextEvents.splice(sourceIndex, 1);
    nextEvents.splice(targetIndex, 0, moved);
    reorderFinalItineraryEvents(nextEvents);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
        <strong>Roteiro Final pós-aprovação.</strong> Use esta etapa somente quando os passeios forem aprovados. Ela é independente da proposta e reúne informações práticas para a viagem.
      </div>

      <div className="rounded-lg border border-[#1a2e4a]/15 bg-blue-50/60 p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a2e4a]"><CalendarDays className="h-4 w-4" />Abertura do roteiro final</div>
        <div className="grid gap-3">
          <div><Label htmlFor="final-title">Título</Label><Input id="final-title" value={finalItinerary.title} onChange={(event) => updateFinalItinerary({ title: event.target.value, enabled: true })} className="mt-1 bg-white" /></div>
          <div><Label htmlFor="final-intro">Mensagem inicial</Label><Textarea id="final-intro" value={finalItinerary.introMessage} onChange={(event) => updateFinalItinerary({ introMessage: event.target.value, enabled: true })} placeholder="Ex.: Olá, Suelen! Abaixo está o seu roteiro completo, com horários e contatos importantes." className="mt-1 min-h-20 bg-white" /></div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3"><h4 className="text-sm font-bold text-[#1a2e4a]">Adicionar informações já cadastradas</h4><p className="mt-1 text-xs text-slate-500">Os itens são copiados para o roteiro final; os cadastros de Voos, Hotéis e Passeios permanecem intactos.</p></div>
        <div className="space-y-3">
          {budget.flights.length > 0 && <div><p className="mb-1.5 text-xs font-bold text-slate-600">Voos</p><div className="flex flex-wrap gap-2">{budget.flights.map((flight) => <Button key={flight.id} type="button" variant="outline" size="sm" onClick={() => addFlightToFinalItinerary(flight.id)} className="bg-white text-xs"><Plane className="mr-1.5 h-3.5 w-3.5" />{flight.type === "ida" ? "Adicionar voo de ida" : "Adicionar voo de retorno"}</Button>)}</div></div>}
          {budget.hotels.length > 0 && <div><p className="mb-1.5 text-xs font-bold text-slate-600">Hospedagem</p><div className="flex flex-wrap gap-2">{budget.hotels.map((hotel) => <Button key={hotel.id} type="button" variant="outline" size="sm" onClick={() => addHotelToFinalItinerary(hotel.id)} className="max-w-full bg-white text-xs"><Hotel className="mr-1.5 h-3.5 w-3.5" /><span className="truncate">{hotel.name}</span></Button>)}</div></div>}
          {budget.tours.length > 0 && <div><p className="mb-1.5 text-xs font-bold text-slate-600">Passeios aprovados</p><div className="flex flex-wrap gap-2">{budget.tours.map((tour) => <Button key={tour.id} type="button" variant="outline" size="sm" onClick={() => addTourToFinalItinerary(tour.id)} className="max-w-full bg-white text-xs"><Building2 className="mr-1.5 h-3.5 w-3.5" /><span className="truncate">{tour.name}</span></Button>)}</div></div>}
        </div>
      </section>

      {events.map((event) => (
        <article
          key={event.id}
          onDragOver={(nativeEvent) => { nativeEvent.preventDefault(); if (draggedEventId && draggedEventId !== event.id) setDragOverEventId(event.id); }}
          onDragLeave={() => dragOverEventId === event.id && setDragOverEventId(null)}
          onDrop={(nativeEvent) => { nativeEvent.preventDefault(); reorder(event.id); setDraggedEventId(null); setDragOverEventId(null); }}
          className={`rounded-lg border p-3 ${dragOverEventId === event.id ? "border-[#1a2e4a] bg-blue-50" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><button type="button" draggable onDragStart={(nativeEvent) => { nativeEvent.dataTransfer.effectAllowed = "move"; setDraggedEventId(event.id); }} onDragEnd={() => { setDraggedEventId(null); setDragOverEventId(null); }} className="cursor-grab text-slate-400 hover:text-[#1a2e4a]" title="Arraste para reordenar"><GripVertical className="h-5 w-5" /></button><span className="rounded-full bg-[#1a2e4a] px-2 py-1 text-xs font-bold text-white">Dia {event.day}</span><span className="text-sm font-bold text-[#1a2e4a]">{EVENT_LABELS[event.kind]}</span></div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeFinalItineraryEvent(event.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title="Remover item"><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Tipo</Label><Select value={event.kind} onValueChange={(value) => updateFinalItineraryEvent(event.id, { kind: value as FinalItineraryEventKind })}><SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>Dia</Label><Input type="number" min="1" value={event.day} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { day: Math.max(1, Number(nativeEvent.target.value) || 1) })} className="mt-1 bg-white" /></div><div><Label>Horário</Label><Input value={event.time} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { time: nativeEvent.target.value })} placeholder="Ex.: 09:30" className="mt-1 bg-white" /></div></div>
            <div className="sm:col-span-2"><Label>Título</Label><Input value={event.title} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { title: nativeEvent.target.value })} placeholder="Ex.: Transfer irá buscar você no aeroporto" className="mt-1 bg-white" /></div>
            <div className="sm:col-span-2"><Label>Detalhes e observações</Label><Textarea value={event.description} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { description: nativeEvent.target.value })} placeholder="Escreva as orientações, contato, ponto de encontro ou qualquer informação importante." className="mt-1 min-h-20 bg-white" /></div>
            <div><Label>Link útil (WhatsApp, empresa ou cartão de embarque)</Label><Input type="url" value={event.linkUrl} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { linkUrl: nativeEvent.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
            <div><Label>Link da foto</Label><Input type="url" value={event.photoUrl} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { photoUrl: nativeEvent.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
          </div>
        </article>
      ))}

      {events.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"><CarFront className="mx-auto mb-2 h-5 w-5 text-slate-400" />Adicione o primeiro compromisso prático ou reutilize os dados que já estão no orçamento.</div>}
      <Button type="button" variant="outline" onClick={() => addFinalItineraryEvent({ kind: "custom", title: "Novo compromisso" })} className="h-12 w-full text-base font-bold shadow-md"><Plus className="mr-2 h-5 w-5" />Adicionar informação ao roteiro final</Button>
      <p className="flex items-center gap-1.5 text-xs text-slate-500"><Link2 className="h-3.5 w-3.5" />O link pode ser do WhatsApp, empresa, cartão de embarque ou fotos. Ele será clicável no PDF.</p>
    </div>
  );
}
