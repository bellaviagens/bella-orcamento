import type { BudgetData } from "@shared/budgetTypes";
import { CalendarDays, Images, MapPin, ExternalLink } from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function ItineraryPreview({ data }: { data: BudgetData }) {
  const days = [...data.itinerary].sort((left, right) => left.day - right.day);
  return (
    <div id="itinerary-document" className="w-full max-w-2xl rounded-2xl bg-white p-7 text-[#1a2e4a] shadow-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="border-b-2 border-amber-400 pb-5">
        <div className="mb-2 flex items-center gap-2 text-amber-600"><CalendarDays className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Pós-aprovação</span></div>
        <h2 className="text-2xl font-extrabold">Roteiro de viagem</h2>
        <p className="mt-1 text-sm text-slate-500">{data.tripInfo.destination || "Destino da viagem"}{data.tripInfo.period ? ` • ${data.tripInfo.period}` : ""}</p>
      </div>

      {days.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Adicione os dias na aba <strong>Roteiro</strong> para montar esta visualização.</div> : <div className="mt-6 space-y-5">{days.map((day) => {
        const tour = day.tourId ? data.tours.find((currentTour) => currentTour.id === day.tourId) : undefined;
        return <article key={day.id} className="flex gap-4"><div className="flex flex-col items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a2e4a] text-sm font-bold text-white">{day.day}</div><div className="mt-2 w-px flex-1 bg-slate-200" /></div><div className="min-w-0 flex-1 pb-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-600">Dia {day.day}</p><h3 className="mt-1 text-base font-bold">{day.title || "Dia livre"}</h3>{tour && <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">{tour.name}</p>{tour.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{tour.location}</p>}</div>{tour.totalPrice > 0 && <span className="rounded bg-white px-2 py-1 text-xs font-bold shadow-sm">{formatCurrency(tour.totalPrice)}</span>}</div>{tour.description && <p className="mt-2 text-xs leading-relaxed text-slate-600">{tour.description}</p>}<div className="mt-3 flex gap-3 text-xs font-semibold text-[#1a2e4a]">{tour.pageUrl && <a href={tour.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600"><ExternalLink className="h-3 w-3" />Página</a>}{tour.photosUrl && <a href={tour.photosUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600"><Images className="h-3 w-3" />Fotos</a>}</div></div>}{day.notes && <p className="mt-3 text-sm leading-relaxed text-slate-600">{day.notes}</p>}</div></article>;
      })}</div>}
    </div>
  );
}
