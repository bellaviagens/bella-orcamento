import type { BudgetData } from "@shared/budgetTypes";
import { CalendarDays, ExternalLink, Images, MapPin, Sparkles, Users } from "lucide-react";
import { calculateTourProposalInstallment, calculateTourTotal, getTourTravelerCount } from "@shared/tourPricing";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface DescriptionBlock {
  title: string;
  paragraphs: string[];
  items: string[];
}

function organizeDescription(description: string): DescriptionBlock[] {
  const lines = description.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const blocks: DescriptionBlock[] = [];
  let active: DescriptionBlock = { title: "Detalhes do passeio", paragraphs: [], items: [] };
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

export function ItineraryPreview({ data }: { data: BudgetData }) {
  const days = [...data.itinerary].sort((left, right) => left.day - right.day);
  const defaultTravelerCount = Math.max(1, Number.parseInt(data.tripInfo.passengers, 10) || 1);
  const totalTours = data.tours.reduce((total, tour) => total + calculateTourTotal(tour, defaultTravelerCount), 0);
  const proposal = data.tourProposal || { title: "Proposta de passeios", introMessage: "", paymentDetails: "" };
  const installment = calculateTourProposalInstallment(totalTours, proposal.installments);

  return (
    <div id="itinerary-document" className="w-full max-w-[794px] rounded-2xl bg-white p-5 text-[#1a2e4a] shadow-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
      <header className="border-b-2 border-amber-400 pb-4">
        <div className="mb-2 flex items-center gap-2 text-amber-600"><CalendarDays className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Bella Viagens</span></div>
        <h2 className="text-2xl font-extrabold">{proposal.title || "Proposta de passeios"}</h2>
        <p className="mt-1 text-sm text-slate-500">{data.tripInfo.destination || "Destino da viagem"}{data.tripInfo.period ? ` • ${data.tripInfo.period}` : ""}</p>
        {proposal.introMessage && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{proposal.introMessage}</p>}
      </header>

      {days.length === 0 ? <div className="py-16 text-center text-sm text-slate-500">Adicione os passeios e as datas na aba <strong>Roteiro</strong> para montar esta proposta.</div> : <div className="mt-5 space-y-5">{days.map((day) => {
        const tour = day.tourId ? data.tours.find((currentTour) => currentTour.id === day.tourId) : undefined;
        const hasAdditionalNotes = Boolean(day.notes && day.notes.trim() !== tour?.description.trim());
        const descriptionBlocks = organizeDescription(tour?.description || "");
        const total = tour ? calculateTourTotal(tour, defaultTravelerCount) : 0;
        const adults = tour ? getTourTravelerCount(tour, defaultTravelerCount) : 0;
        const children = tour ? Math.max(0, Math.round(Number(tour.childCount) || 0)) : 0;

        return <section key={day.id} data-pdf-keep-together="true">
          <div className="mb-3 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{day.day}</span><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Dia {day.day}</p></div>
          <article className="ml-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a2e4a] text-white"><Sparkles className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold">{day.title || "Dia livre"}</h3>
                {tour && <>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div><p className="text-sm font-semibold text-[#1a2e4a]">{tour.name}</p>{tour.location && <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{tour.location}</p>}{tour.duration && <p className="mt-1 text-xs text-slate-500">Duração: {tour.duration}</p>}</div>
                    {total > 0 && <span className="rounded bg-white px-2 py-1 text-xs font-bold text-[#1a2e4a] shadow-sm">{formatCurrency(total)}</span>}
                  </div>

                  {tour.photosUrl && <a href={tour.photosUrl} target="_blank" rel="noreferrer" className="mt-3 block" aria-label={`Abrir foto de ${tour.name}`}><img src={tour.photosUrl} alt={`Foto do passeio ${tour.name}`} crossOrigin="anonymous" onError={(event) => event.currentTarget.parentElement?.remove()} className="h-40 w-full rounded-lg border border-slate-200 object-cover" /></a>}

                  {total > 0 && <div className={`mt-3 grid gap-2 ${tour.pricingMode === "perPerson" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
                    {tour.pricingMode === "perPerson" ? <>
                      <PriceCell label="Adulto" value={formatCurrency(Number(tour.pricePerPerson) || 0)} />
                      <PriceCell label="Adultos" value={String(adults)} icon />
                      <PriceCell label={children > 0 ? `Criança (${children})` : "Criança"} value={children > 0 ? formatCurrency(Number(tour.childPrice) || 0) : "—"} />
                      <PriceCell label="Total" value={formatCurrency(total)} />
                    </> : <><PriceCell label="Valor do passeio" value={formatCurrency(total)} /><PriceCell label="Total" value={formatCurrency(total)} /></>}
                  </div>}

                  {descriptionBlocks.map((block, index) => <section key={`${block.title}-${index}`} className="mt-3 rounded-md bg-white p-3"><h4 className="text-xs font-bold uppercase tracking-wide text-[#1a2e4a]">{block.title}</h4>{block.paragraphs.map((paragraph, paragraphIndex) => <p key={`${paragraphIndex}-${paragraph.slice(0, 16)}`} className="mt-1.5 text-xs leading-relaxed text-slate-600">{paragraph}</p>)}{block.items.length > 0 && <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs leading-relaxed text-slate-600">{block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item.slice(0, 16)}`} className="flex gap-1.5"><span className="font-bold text-amber-600">•</span><span>{item}</span></li>)}</ul>}</section>)}
                  {tour.notes && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-slate-700"><span className="font-bold text-amber-800">Observações importantes: </span>{tour.notes}</div>}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#1a2e4a]">{tour.pageUrl && <a data-pdf-link={tour.pageUrl} href={tour.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600"><ExternalLink className="h-3 w-3" />Mais informações</a>}{tour.photosUrl && <a data-pdf-link={tour.photosUrl} href={tour.photosUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600"><Images className="h-3 w-3" />Fotos</a>}</div>
                </>}
                {!tour && <p className="mt-2 text-sm leading-relaxed text-slate-600">{day.notes || "Dia livre para aproveitar o destino."}</p>}
                {hasAdditionalNotes && <div className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-600"><span className="font-semibold text-[#1a2e4a]">Observações do dia: </span>{day.notes}</div>}
              </div>
            </div>
          </article>
        </section>;
      })}</div>}

      {days.length > 0 && <section data-pdf-keep-together="true" className="mt-5 rounded-xl border-2 border-[#1a2e4a] bg-[#1a2e4a] p-4 text-white"><p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Investimento da proposta</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold">Total dos passeios</h3><p className="mt-1 text-xs text-slate-200">{data.tours.length} passeio(s) na proposta</p></div><strong className="text-2xl">{formatCurrency(totalTours)}</strong></div><div className="mt-3 grid gap-3 border-t border-white/20 pt-3 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-amber-300">Parcelamento</p><p className="mt-1 text-sm font-bold text-white">{installment.count === 1 ? `À vista: ${formatCurrency(totalTours)}` : `${installment.count}x de ${formatCurrency(installment.value)}`}</p></div>{proposal.paymentDetails && <div><p className="text-xs font-bold uppercase tracking-wide text-amber-300">Forma de pagamento</p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white">{proposal.paymentDetails}</p></div>}</div></section>}
    </div>
  );
}
