import type { BudgetData, FinalItineraryEventKind } from "@shared/budgetTypes";
import { CalendarDays, CarFront, ExternalLink, Hotel, Images, MapPin, Plane, Sparkles } from "lucide-react";

const EVENT_ICONS: Record<FinalItineraryEventKind, typeof CalendarDays> = {
  arrival: MapPin,
  transfer: CarFront,
  hotel: Hotel,
  flight: Plane,
  return: Plane,
  tour: Sparkles,
  custom: CalendarDays,
};

const EVENT_LABELS: Record<FinalItineraryEventKind, string> = {
  arrival: "Chegada",
  transfer: "Transfer",
  hotel: "Hospedagem",
  flight: "Voo de ida",
  return: "Retorno",
  tour: "Passeio",
  custom: "Informação importante",
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

export function FinalItineraryPreview({ data }: { data: BudgetData }) {
  const finalItinerary = data.finalItinerary;
  const events = [...finalItinerary.events].sort((first, second) =>
    first.day - second.day || EVENT_ORDER[first.kind] - EVENT_ORDER[second.kind] || first.time.localeCompare(second.time),
  );

  return (
    <div id="final-itinerary-document" className="w-full max-w-2xl rounded-2xl bg-white p-7 text-[#1a2e4a] shadow-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
      <header className="border-b-2 border-amber-400 pb-5">
        <div className="mb-2 flex items-center gap-2 text-amber-600"><CalendarDays className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Bella Viagens</span></div>
        <h2 className="text-2xl font-extrabold">{finalItinerary.title || "Roteiro final da viagem"}</h2>
        <p className="mt-1 text-sm text-slate-500">{data.tripInfo.destination || "Destino da viagem"}{data.tripInfo.period ? ` • ${data.tripInfo.period}` : ""}</p>
        {finalItinerary.introMessage && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{finalItinerary.introMessage}</p>}
      </header>

      {events.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Inclua chegada, transfers, hospedagem, voos e passeios na aba <strong>Roteiro Final</strong> para gerar o documento pós-aprovação.</div> : <div className="mt-6 space-y-6">{events.map((event, index) => {
        const Icon = EVENT_ICONS[event.kind];
        const isNewDay = index === 0 || events[index - 1].day !== event.day;
        return <div key={event.id} data-pdf-keep-together="true">{isNewDay && <div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{event.day}</span><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Dia {event.day}</p></div>}<article className="ml-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a2e4a] text-white"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">{EVENT_LABELS[event.kind]}</p>{event.time && <span className="rounded bg-white px-2 py-1 text-xs font-bold text-[#1a2e4a]">{event.time}</span>}</div><h3 className="mt-1 text-base font-bold">{event.title}</h3>{event.photoUrl && <a href={event.photoUrl} target="_blank" rel="noreferrer" className="mt-3 block" aria-label={`Abrir foto de ${event.title}`}><img src={event.photoUrl} alt={`Foto de ${event.title}`} crossOrigin="anonymous" onError={(nativeEvent) => nativeEvent.currentTarget.remove()} className="h-40 w-full rounded-lg border border-slate-200 object-cover" /></a>}{event.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.description}</p>}{event.linkUrl && <a data-pdf-link={event.linkUrl} href={event.linkUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] hover:text-amber-600"><ExternalLink className="h-3.5 w-3.5" />Acessar informações</a>}{event.photoUrl && <a data-pdf-link={event.photoUrl} href={event.photoUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] hover:text-amber-600"><Images className="h-3.5 w-3.5" />Fotos</a>}</div></div></article></div>;
      })}</div>}
    </div>
  );
}
