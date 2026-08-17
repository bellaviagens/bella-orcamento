import type { BudgetData, ItineraryActivityKind } from "@shared/budgetTypes";
import { getItineraryDayActivities } from "@/contexts/BudgetContext";
import { CalendarDays, ExternalLink, Hotel, Images, MapPin, PlaneTakeoff, Sparkles, Utensils, Users } from "lucide-react";
import { calculateTourProposalInstallment, calculateTourTotal, getTourTravelerCount } from "@shared/tourPricing";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateWithWeekday(date?: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }).format(parsed);
}

interface DescriptionBlock {
  title: string;
  paragraphs: string[];
  items: string[];
}

function organizeDescription(description: string, defaultTitle: string = "Detalhes do passeio"): DescriptionBlock[] {
  const lines = description.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const blocks: DescriptionBlock[] = [];
  let active: DescriptionBlock = { title: defaultTitle, paragraphs: [], items: [] };
  const saveActive = () => { if (active.paragraphs.length || active.items.length) blocks.push(active); };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isBullet = /^[-•–]\s+/.test(line);
    const nextIsBullet = /^[-•–]\s+/.test(lines[index + 1] || "");
    const isUppercaseHeading = line.length <= 110 && line === line.toUpperCase() && /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(line);
    const isSectionHeading = /^(roteiro|itinerário|itinerario|inclui|não inclui|na experiência|detalhes)$/i.test(line) || (nextIsBullet && line.length <= 70);
    if (!isBullet && (isUppercaseHeading || isSectionHeading)) { saveActive(); active = { title: line.replace(/:$/, ""), paragraphs: [], items: [] }; continue; }
    if (isBullet) active.items.push(line.replace(/^[-•–]\s+/, ""));
    else active.paragraphs.push(line);
  }

  saveActive();
  return blocks;
}

function PriceCell({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return <div className="min-w-0 rounded-md border border-slate-200 bg-white px-2 py-2 text-center"><p className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{icon && <Users className="h-3 w-3" />}{label}</p><p className="mt-0.5 truncate text-xs font-semibold text-[#1a2e4a]">{value}</p></div>;
}

function CoverSummaryIcon({ kind, hasFlight }: { kind: ItineraryActivityKind; hasFlight: boolean }) {
  const iconClassName = "h-3.5 w-3.5";
  if (kind === "flight" || hasFlight) return <PlaneTakeoff className={iconClassName} />;
  if (kind === "meal") return <Utensils className={iconClassName} />;
  if (kind === "custom") return <Hotel className={iconClassName} />;
  return <Sparkles className={iconClassName} />;
}

export function ItineraryPreview({ data }: { data: BudgetData }) {
  const days = [...data.itinerary].sort((left, right) => left.day - right.day);
  const defaultTravelerCount = Math.max(1, Number.parseInt(data.tripInfo.passengers, 10) || 1);
  const totalTours = data.tours.reduce((total, tour) => total + calculateTourTotal(tour, defaultTravelerCount), 0);
  const proposal = data.tourProposal || { title: "Proposta de passeios", introMessage: "", paymentDetails: "", coverSummaryFontSize: "medium" as const };
  const installment = calculateTourProposalInstallment(totalTours, proposal.installments);
  const coverSummaryDays = days.map((day) => ({
    id: day.id,
    day: day.day,
    date: day.date,
    activities: getItineraryDayActivities(day).map((activity) => ({
      id: activity.id,
      time: activity.time,
      kind: activity.kind,
      hasFlight: Boolean(activity.flightId),
      type: activity.kind === "flight" || activity.flightId ? "Voo" : activity.kind === "meal" ? "Gastronomia" : activity.kind === "tour" ? "Passeio" : "Compromisso",
      title: activity.title || "Novo compromisso",
    })),
  })).filter((day) => day.activities.length > 0);
  const selectedCoverDayIds = proposal.coverSummaryDayIds;
  const visibleCoverSummaryDays = (selectedCoverDayIds?.length
    ? coverSummaryDays.filter((day) => selectedCoverDayIds.includes(day.id))
    : coverSummaryDays
  ).slice(0, 6);
  const summaryFontClasses = proposal.coverSummaryFontSize === "small"
    ? { type: "text-[10px]", body: "text-[10px]" }
    : proposal.coverSummaryFontSize === "large"
      ? { type: "text-xs", body: "text-xs" }
      : { type: "text-[11px]", body: "text-[11px]" };

  return (
    <div id="itinerary-document" className="w-full max-w-[794px] overflow-hidden bg-white text-[#1a2e4a] shadow-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
      <header data-pdf-proposal-header="true">
        <div className="flex items-center justify-between gap-6 bg-[#1a2e4a] px-5 py-5 text-white">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Bella Viagens e Milhas</h1>
            <p className="mt-0.5 text-sm font-medium tracking-wide text-amber-400">Acumule. Viaje. Viva.</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold">{proposal.title || "Proposta de passeios"}</h2>
            {data.tripInfo.destination && <p className="mt-0.5 text-sm text-white/80">{data.tripInfo.destination}</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 bg-slate-100 px-5 py-3 text-sm">
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Destino</p><p className="font-semibold text-[#1a2e4a]">{data.tripInfo.destination || "Destino da viagem"}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Período</p><p className="font-semibold text-[#1a2e4a]">{data.tripInfo.period || "A confirmar"}</p></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Viajantes</p><p className="font-semibold text-[#1a2e4a]">{data.tripInfo.passengers || "A confirmar"}</p></div>
        </div>
        {proposal.introMessage && <div className="border-b border-slate-200 px-5 py-3"><p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{proposal.introMessage}</p></div>}
        {visibleCoverSummaryDays.length > 0 && <div className="border-b border-slate-200 px-5 py-3" data-pdf-keep-together="true" data-cover-summary-font={proposal.coverSummaryFontSize || "medium"}>
          <div className="mb-2 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-600" /><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1a2e4a]">Resumo da proposta</p></div>
          <div className="grid gap-2 sm:grid-cols-2">{visibleCoverSummaryDays.map((day, dayIndex) => <section key={day.id} data-pdf-keep-together="true" className={`overflow-hidden rounded-md border border-l-4 shadow-sm ${dayIndex % 2 === 0 ? "border-[#1a2e4a] bg-[#f3f7fb]" : "border-amber-300 bg-[#fff9eb]"}`}>
            <div className={`border-b px-2.5 py-1.5 ${dayIndex % 2 === 0 ? "border-[#1a2e4a] bg-[#1a2e4a] text-white" : "border-amber-200 bg-amber-50 text-amber-800"}`}><p className="text-[10px] font-bold uppercase tracking-wide">Dia {day.day}{day.date ? ` • ${formatDateWithWeekday(day.date)}` : ""}</p></div>
            <div className="space-y-1.5 px-2.5 py-2">{day.activities.map((activity) => <div key={activity.id} className={`flex min-w-0 items-start gap-2 border-t pt-1.5 first:border-t-0 first:pt-0 ${dayIndex % 2 === 0 ? "border-slate-200" : "border-amber-100"}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-50 text-[#1a2e4a]"><CoverSummaryIcon kind={activity.kind} hasFlight={activity.hasFlight} /></span>
              <div className="min-w-0 flex-1"><p className={`${summaryFontClasses.type} font-bold text-[#1a2e4a]`}>{activity.time ? `${activity.time} • ` : ""}{activity.type}</p><p className={`break-words ${summaryFontClasses.body} leading-snug text-slate-600`}>{activity.title}</p></div>
            </div>)}</div>
          </section>)}</div>
          {coverSummaryDays.length > visibleCoverSummaryDays.length && <p className="mt-2 text-[11px] font-medium text-slate-500">+ {coverSummaryDays.length - visibleCoverSummaryDays.length} dia(s) detalhado(s) nas próximas páginas.</p>}
        </div>}
      </header>

      {days.length === 0 ? <div className="px-5 py-16 text-center text-sm text-slate-500">Adicione os passeios e as datas na aba <strong>Roteiro</strong> para montar esta proposta.</div> : <div className="space-y-4 px-5 py-4">{days.map((day) => {
        const activities = getItineraryDayActivities(day);
        return <section key={day.id} data-pdf-keep-together="true" data-proposal-day="true">
          <div className="mb-2 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{day.day}</span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Dia {day.day}{day.date ? ` • ${formatDateWithWeekday(day.date)}` : ""}</p><h3 className="text-sm font-bold text-[#1a2e4a]">{day.title || "Dia livre"}</h3></div></div>
          <div className="ml-4 space-y-2.5 border-l-2 border-amber-200 pl-4">
            {activities.length >= 3 && <div data-pdf-keep-together="true" className="flex items-center gap-3 pb-1 pt-0.5"><span className="h-px flex-1 bg-gradient-to-r from-amber-300 to-amber-100" /><span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700">Agenda do dia • {activities.length} compromissos</span><span className="h-px flex-1 bg-gradient-to-l from-amber-300 to-amber-100" /></div>}
            {activities.map((activity, activityIndex) => {
              const tour = activity.tourId ? data.tours.find((currentTour) => currentTour.id === activity.tourId) : undefined;
              const flight = activity.flightId ? data.flights.find((currentFlight) => currentFlight.id === activity.flightId) : undefined;
              const arrivalSegment = flight?.segments[flight.segments.length - 1];
              const isFlightActivity = activity.kind === "flight" || Boolean(activity.flightId);
              const descriptionBlocks = organizeDescription(tour?.description || activity.description || "", isFlightActivity ? "Detalhes do voo" : "Detalhes do passeio");
              const total = tour ? calculateTourTotal(tour, defaultTravelerCount) : 0;
              const adults = tour ? getTourTravelerCount(tour, defaultTravelerCount) : 0;
              const children = tour ? Math.max(0, Math.round(Number(tour.childCount) || 0)) : 0;
              const photoUrl = tour?.photosUrl || activity.photoUrl;
              const informationUrl = tour?.pageUrl || activity.linkUrl;

              const showActivitySeparator = activities.length >= 3 && activityIndex > 0;
              return <div key={activity.id} data-pdf-keep-together="true" className={showActivitySeparator ? "pt-1" : undefined}>
                {showActivitySeparator && <div className="flex items-center gap-2.5 pb-2 pt-0.5"><span className="h-px flex-1 bg-slate-200" /><span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Próximo compromisso</span><span className="h-px flex-1 bg-slate-200" /></div>}
                <article className="relative rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-white bg-[#1a2e4a]" />
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a2e4a] text-white">{isFlightActivity ? <PlaneTakeoff className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-base font-bold">{activity.title || "Novo compromisso"}</h4>{activity.time && <span className="rounded bg-white px-2 py-1 text-xs font-bold text-[#1a2e4a] shadow-sm">{activity.time}</span>}</div>{isFlightActivity && arrivalSegment?.arrivalTime && <p className="mt-1.5 text-xs font-semibold text-[#1a2e4a]">Chegada ao destino: {arrivalSegment.arrivalTime}{arrivalSegment.arrivalCity || arrivalSegment.arrivalAirport ? ` — ${arrivalSegment.arrivalCity || arrivalSegment.arrivalAirport}` : ""}</p>}{tour?.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{tour.location}</p>}{tour?.duration && !/\b\d+\s*dias?\b/i.test(tour.duration) && <p className="mt-1 text-xs text-slate-500">Duração: {tour.duration}</p>}</div>{total > 0 && <span className="rounded bg-white px-2 py-1 text-xs font-bold text-[#1a2e4a] shadow-sm">{formatCurrency(total)}</span>}</div>

                    {photoUrl && <a href={photoUrl} target="_blank" rel="noreferrer" className="mt-2.5 block" aria-label={`Abrir foto de ${activity.title}`}><img src={photoUrl} alt={`Foto de ${activity.title}`} crossOrigin="anonymous" onError={(event) => event.currentTarget.parentElement?.remove()} className="h-32 w-full rounded-lg border border-slate-200 object-cover" /></a>}

                    {total > 0 && tour && <div className={`mt-3 grid gap-2 ${tour.pricingMode === "perPerson" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>{tour.pricingMode === "perPerson" ? <><PriceCell label="Adulto" value={formatCurrency(Number(tour.pricePerPerson) || 0)} /><PriceCell label="Adultos" value={String(adults)} icon /><PriceCell label={children > 0 ? `Criança (${children})` : "Criança"} value={children > 0 ? formatCurrency(Number(tour.childPrice) || 0) : "—"} /><PriceCell label="Total" value={formatCurrency(total)} /></> : <><PriceCell label="Valor do passeio" value={formatCurrency(total)} /><PriceCell label="Total" value={formatCurrency(total)} /></>}</div>}

                    {descriptionBlocks.map((block, index) => <section key={`${activity.id}-${block.title}-${index}`} className="mt-2.5 rounded-md bg-white p-2.5"><h5 className="text-xs font-bold uppercase tracking-wide text-[#1a2e4a]">{block.title}</h5>{block.paragraphs.map((paragraph, paragraphIndex) => <p key={`${paragraphIndex}-${paragraph.slice(0, 16)}`} className="mt-1 text-xs leading-relaxed text-slate-600">{paragraph}</p>)}{block.items.length > 0 && <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs leading-relaxed text-slate-600">{block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item.slice(0, 16)}`} className="flex gap-1.5"><span className="font-bold text-amber-600">•</span><span>{item}</span></li>)}</ul>}</section>)}
                    {activity.importantNotes && <div className="mt-3 rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-xs leading-relaxed text-amber-950"><span className="font-bold">Atenção: </span><span className="whitespace-pre-line">{activity.importantNotes}</span></div>}
                    {tour?.notes && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-slate-700"><span className="font-bold text-amber-800">Observações importantes: </span><span className="whitespace-pre-line">{tour.notes}</span></div>}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#1a2e4a]">{informationUrl && <a data-pdf-link={informationUrl} href={informationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600"><ExternalLink className="h-3 w-3" />Mais informações</a>}{activity.ticketUrl && <a data-pdf-link={activity.ticketUrl} href={activity.ticketUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900"><ExternalLink className="h-3 w-3" />Comprar ingresso</a>}{photoUrl && <a data-pdf-link={photoUrl} href={photoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600"><Images className="h-3 w-3" />Fotos</a>}</div>
                  </div>
                </div>
                </article>
              </div>;
            })}
          </div>
          {day.notes && <div className="ml-4 mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-600"><span className="font-semibold text-[#1a2e4a]">Observações do dia: </span><span className="whitespace-pre-line">{day.notes}</span></div>}
        </section>;
      })}</div>}

      {days.length > 0 && <section data-pdf-keep-together="true" className="mx-5 mb-5 rounded-xl border-2 border-[#1a2e4a] bg-[#1a2e4a] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Investimento da proposta</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold">Total dos passeios</h3><p className="mt-1 text-xs text-slate-200">{data.tours.length} passeio(s) na proposta</p></div><strong className="text-2xl">{formatCurrency(totalTours)}</strong></div><div className="mt-3 grid gap-3 border-t border-white/20 pt-3 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-300">Parcelamento</p><p className="mt-1 text-sm font-bold text-white">{installment.count === 1 ? `À vista: ${formatCurrency(totalTours)}` : `${installment.count}x de ${formatCurrency(installment.value)}`}</p></div>{proposal.paymentDetails && <div><p className="text-xs font-bold uppercase tracking-wide text-amber-300">Forma de pagamento</p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white">{proposal.paymentDetails}</p></div>}</div></section>}
    </div>
  );
}
