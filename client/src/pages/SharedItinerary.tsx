import { useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import { AlertCircle, CalendarDays, Loader2 } from "lucide-react";
import { FinalItineraryPreview } from "@/components/itinerary/FinalItineraryPreview";
import { trpc } from "@/lib/trpc";
import type { BudgetData } from "@shared/budgetTypes";

export default function SharedItinerary() {
  const [, params] = useRoute("/roteiro/:token");
  const token = params?.token || "";
  const { data, isLoading, error } = trpc.sharedItineraries.get.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const unavailableMessage = error?.message.startsWith("Este link de roteiro")
    ? error.message
    : "Este link não foi encontrado ou pode estar incompleto. Peça à sua consultora um novo link do roteiro.";
  const snapshot = useMemo(() => {
    if (!data?.snapshot) return null;
    try {
      return JSON.parse(data.snapshot) as BudgetData;
    } catch {
      return null;
    }
  }, [data?.snapshot]);

  useEffect(() => {
    if (snapshot?.finalItinerary.title) document.title = `${snapshot.finalItinerary.title} | Bella Viagens`;
  }, [snapshot?.finalItinerary.title]);

  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="rounded-xl bg-white px-5 py-4 text-sm font-semibold text-[#1a2e4a] shadow"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Abrindo o roteiro compartilhado...</div></main>;
  if (error || !snapshot?.finalItinerary) return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl bg-white p-7 text-center shadow-xl"><AlertCircle className="mx-auto h-9 w-9 text-amber-500" /><h1 className="mt-3 text-xl font-bold text-[#1a2e4a]">Roteiro indisponível</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">{unavailableMessage}</p></div></main>;

  return <main className="min-h-screen bg-slate-100 px-4 py-7 sm:px-6"><div className="mx-auto mb-4 flex max-w-2xl items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#1a2e4a]"><CalendarDays className="h-4 w-4 text-amber-600" />Roteiro compartilhado</div><FinalItineraryPreview data={snapshot} /></main>;
}
