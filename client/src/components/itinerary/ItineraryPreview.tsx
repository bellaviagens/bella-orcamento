import type { BudgetData } from "@shared/budgetTypes";
import { CalendarDays, Images, MapPin, ExternalLink, Users } from "lucide-react";
import { calculateTourTotal, getTourTravelerCount } from "@shared/tourPricing";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface DescriptionBlock {
  title: string;
  paragraphs: string[];
  items: string[];
}

function organizeDescription(description: string): DescriptionBlock[] {
  const lines = description
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const blocks: DescriptionBlock[] = [];
  let active: DescriptionBlock = { title: "Detalhes do passeio", paragraphs: [], items: [] };
  const saveActive = () => {
    if (active.paragraphs.length || active.items.length) blocks.push(active);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const isBullet = /^[-•–]\s+/.test(line);
    const nextIsBullet = /^[-•–]\s+/.test(lines[index + 1] || "");
    const isUppercaseHeading = line.length <= 110 && line === line.toUpperCase() && /[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(line);
    const isSectionHeading = /^(roteiro|itinerário|itinerario|inclui|não inclui|na experiência|detalhes)$/i.test(line) || (nextIsBullet && line.length <= 70);

    if (!isBullet && (isUppercaseHeading || isSectionHeading)) {
      saveActive();
      active = { title: line.replace(/:$/, ""), paragraphs: [], items: [] };
      continue;
    }

    if (isBullet) {
      active.items.push(line.replace(/^[-•–]\s+/, ""));
    } else {
      active.paragraphs.push(line);
    }
  }

  saveActive();
  return blocks;
}

export function ItineraryPreview({ data }: { data: BudgetData }) {
  const days = [...data.itinerary].sort((left, right) => left.day - right.day);
  const defaultTravelerCount = Math.max(1, Number.parseInt(data.tripInfo.passengers, 10) || 1);
  const totalTours = data.tours.reduce((total, tour) => total + calculateTourTotal(tour, defaultTravelerCount), 0);
  const proposal = data.tourProposal || { title: "Proposta de passeios", introMessage: "", paymentDetails: "" };

  return (
    <div id="itinerary-document" className="w-full max-w-2xl rounded-2xl bg-white p-7 text-[#1a2e4a] shadow-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="border-b-2 border-amber-400 pb-5">
        <div className="mb-2 flex items-center gap-2 text-amber-600">
          <CalendarDays className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-[0.18em]">Bella Viagens</span>
        </div>
        <h2 className="text-2xl font-extrabold">{proposal.title || "Proposta de passeios"}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {data.tripInfo.destination || "Destino da viagem"}
          {data.tripInfo.period ? ` • ${data.tripInfo.period}` : ""}
        </p>
        {proposal.introMessage && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{proposal.introMessage}</p>}
      </div>

      {days.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Adicione os passeios e as datas na aba <strong>Roteiro</strong> para montar esta proposta.
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {days.map((day) => {
            const tour = day.tourId ? data.tours.find((currentTour) => currentTour.id === day.tourId) : undefined;
            const hasAdditionalNotes = Boolean(day.notes && day.notes.trim() !== tour?.description.trim());
            const descriptionBlocks = organizeDescription(tour?.description || "");
            const total = tour ? calculateTourTotal(tour, defaultTravelerCount) : 0;
            const travelers = tour ? getTourTravelerCount(tour, defaultTravelerCount) : 0;

            return (
              <article key={day.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a2e4a] text-sm font-bold text-white">
                    {day.day}
                  </div>
                  <div className="mt-2 w-px flex-1 bg-slate-200" />
                </div>

                <div className="min-w-0 flex-1 pb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-600">Dia {day.day}</p>
                  <h3 className="mt-1 text-base font-bold">{day.title || "Dia livre"}</h3>

                  {tour && (
                    <div data-pdf-keep-together="true" className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex gap-3">
                        {tour.photosUrl && (
                          <a
                            href={tour.photosUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0"
                            aria-label={`Abrir foto de ${tour.name}`}
                          >
                            <img
                              src={tour.photosUrl}
                              alt={`Foto do passeio ${tour.name}`}
                              crossOrigin="anonymous"
                              onError={(event) => {
                                event.currentTarget.parentElement?.remove();
                              }}
                              className="h-20 w-24 rounded-md border border-slate-200 object-cover"
                            />
                          </a>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{tour.name}</p>
                              {tour.location && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                  <MapPin className="h-3 w-3" />
                                  {tour.location}
                                </p>
                              )}
                              {tour.duration && <p className="mt-1 text-xs text-slate-500">Duração: {tour.duration}</p>}
                            </div>
                            {total > 0 && <span className="rounded bg-white px-2 py-1 text-xs font-bold shadow-sm">{formatCurrency(total)}</span>}
                          </div>

                          {total > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-white p-2 text-center text-xs">
                              <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Por pessoa</p><p className="mt-1 font-semibold">{formatCurrency(tour.pricingMode === "perPerson" ? Number(tour.pricePerPerson) || 0 : total / travelers)}</p></div>
                              <div><p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><Users className="h-3 w-3" />Pessoas</p><p className="mt-1 font-semibold">{travelers}</p></div>
                              <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p><p className="mt-1 font-bold text-[#1a2e4a]">{formatCurrency(total)}</p></div>
                            </div>
                          )}

                          {descriptionBlocks.map((block, index) => (
                            <section key={`${block.title}-${index}`} className="mt-3 rounded-md bg-white p-2.5">
                              <h4 className="text-xs font-bold uppercase tracking-wide text-[#1a2e4a]">{block.title}</h4>
                              {block.paragraphs.map((paragraph, paragraphIndex) => <p key={`${paragraphIndex}-${paragraph.slice(0, 16)}`} className="mt-1.5 text-xs leading-relaxed text-slate-600">{paragraph}</p>)}
                              {block.items.length > 0 && <ul className="mt-2 space-y-1 text-xs leading-relaxed text-slate-600">{block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item.slice(0, 16)}`} className="flex gap-1.5"><span className="font-bold text-amber-600">•</span><span>{item}</span></li>)}</ul>}
                            </section>
                          ))}

                          {tour.notes && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs leading-relaxed text-slate-700"><span className="font-bold text-amber-800">Observações importantes: </span>{tour.notes}</div>}

                          <div className="mt-3 flex gap-3 text-xs font-semibold text-[#1a2e4a]">
                            {tour.pageUrl && (
                              <a data-pdf-link={tour.pageUrl} href={tour.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600">
                                <ExternalLink className="h-3 w-3" />
                                Mais informações
                              </a>
                            )}
                            {tour.photosUrl && (
                              <a data-pdf-link={tour.photosUrl} href={tour.photosUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-amber-600">
                                <Images className="h-3 w-3" />
                                Fotos
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasAdditionalNotes && <div className="mt-3 rounded-md bg-slate-100 p-2.5 text-sm leading-relaxed text-slate-600"><span className="font-semibold text-[#1a2e4a]">Observações do dia: </span>{day.notes}</div>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {days.length > 0 && (
        <section data-pdf-keep-together="true" className="mt-6 rounded-xl border-2 border-[#1a2e4a] bg-[#1a2e4a] p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-300">Investimento da proposta</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold">Total dos passeios</h3><p className="mt-1 text-xs text-slate-200">{data.tours.length} passeio(s) na proposta</p></div><strong className="text-2xl">{formatCurrency(totalTours)}</strong></div>
          {proposal.paymentDetails && <div className="mt-4 border-t border-white/20 pt-3"><p className="text-xs font-bold uppercase tracking-wide text-amber-300">Forma de pagamento</p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white">{proposal.paymentDetails}</p></div>}
        </section>
      )}
    </div>
  );
}
