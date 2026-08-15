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

function formatDate(value: string | undefined) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function DetailCell({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null;
  return <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-xs font-semibold text-[#1a2e4a]">{value}</p></div>;
}

export function FinalItineraryPreview({ data }: { data: BudgetData }) {
  const finalItinerary = data.finalItinerary;
  const events = [...finalItinerary.events].sort((first, second) => first.day - second.day || EVENT_ORDER[first.kind] - EVENT_ORDER[second.kind] || first.time.localeCompare(second.time));

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
        const isFlight = event.kind === "flight" || event.kind === "return";
        const isHotel = event.kind === "hotel";
        const hasFlightDetails = isFlight && [event.flightAirline, event.flightNumber, event.flightDate, event.flightDepartureAirport, event.flightDepartureTime, event.flightArrivalAirport, event.flightArrivalTime, event.flightDepartureTerminal, event.flightArrivalTerminal].some(Boolean);

        return <div key={event.id} data-pdf-keep-together="true">
          {isNewDay && <div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{event.day}</span><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Dia {event.day}</p></div>}
          <article className="ml-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a2e4a] text-white"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">{EVENT_LABELS[event.kind]}</p>{event.time && <span className="rounded bg-white px-2 py-1 text-xs font-bold text-[#1a2e4a]">{event.time}</span>}</div>
                <h3 className="mt-1 text-base font-bold">{event.title}</h3>

                {hasFlightDetails && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 p-2.5">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <DetailCell label="Companhia" value={event.flightAirline} />
                    <DetailCell label="Voo" value={event.flightNumber} />
                    <DetailCell label="Data" value={formatDate(event.flightDate)} />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <DetailCell label="Partida" value={[event.flightDepartureAirport, event.flightDepartureTerminal, event.flightDepartureTime].filter(Boolean).join(" • ")} />
                    <DetailCell label="Chegada" value={[event.flightArrivalAirport, event.flightArrivalTerminal, event.flightArrivalTime].filter(Boolean).join(" • ")} />
                  </div>
                </div>}

                {isHotel && (event.hotelAddress || event.hotelCheckIn || event.hotelCheckOut) && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 p-2.5">
                  {event.hotelAddress && <div className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1a2e4a]" /><span>{event.hotelAddress}</span></div>}
                  {(event.hotelCheckIn || event.hotelCheckOut) && <div className="mt-2 grid grid-cols-2 gap-2"><DetailCell label="Check-in" value={formatDate(event.hotelCheckIn)} /><DetailCell label="Check-out" value={formatDate(event.hotelCheckOut)} /></div>}
                  {event.hotelMapUrl && <a data-pdf-link={event.hotelMapUrl} href={event.hotelMapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] hover:text-amber-600"><MapPin className="h-3.5 w-3.5" />Abrir localização no Google Maps</a>}
                </div>}

                {event.photoUrl && <a href={event.photoUrl} target="_blank" rel="noreferrer" className="mt-3 block" aria-label={`Abrir foto de ${event.title}`}><img src={event.photoUrl} alt={`Foto de ${event.title}`} crossOrigin="anonymous" onError={(nativeEvent) => nativeEvent.currentTarget.remove()} className="h-40 w-full rounded-lg border border-slate-200 object-cover" /></a>}
                {event.description && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.description}</p>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {event.linkUrl && <a data-pdf-link={event.linkUrl} href={event.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] hover:text-amber-600"><ExternalLink className="h-3.5 w-3.5" />Acessar informações</a>}
                  {event.photoUrl && <a data-pdf-link={event.photoUrl} href={event.photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] hover:text-amber-600"><Images className="h-3.5 w-3.5" />Fotos</a>}
                </div>
              </div>
            </div>
          </article>
        </div>;
      })}</div>}
    </div>
  );
}
