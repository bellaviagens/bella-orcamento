import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, FileText, FolderOpen, Hotel, MapPinned, Pencil, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  filterSavedTourProposals,
  filterSavedTourProposalsByStatus,
  type SavedTourProposalStatusFilter,
} from "./tourProposalListState";
import { followUpDateToInput, followUpInputToDate, formatFollowUpDate } from "./travelDraftFollowUpDate";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BudgetData } from "@shared/budgetTypes";

type SavedItemStatus = Exclude<SavedTourProposalStatusFilter, "all">;
type DraftTab = "all" | "complete-budget" | "tour-proposal" | "final-itinerary";

type TravelDraftsPanelProps = {
  currentDraftId?: string;
  draftLabel: string;
  onCurrentDraftIdChange: (id?: string) => void;
  onDraftLabelChange: (label: string) => void;
  onOpenTravelBudget: (id: string) => void;
  onOpenTourProposal: (id: string) => void;
  onOpenTourProposalInFinalItinerary: (id: string) => void;
  onOpenFinalItinerary: (id: string) => void;
};

type BudgetDraftListItem = {
  id: string;
  label: string;
  clientName: string;
  destination: string;
  updatedAt: Date | string;
  status: SavedItemStatus;
  followUpAt?: Date | string | null;
  kind: "complete-budget" | "final-itinerary";
};

type TourProposalListItem = {
  id: string;
  clientName: string;
  proposalTitle: string;
  destination?: string;
  updatedAt: Date | string;
  status: SavedItemStatus;
  followUpAt?: Date | string | null;
};

type UnifiedDraftItem = {
  id: string;
  kind: Exclude<DraftTab, "all">;
  typeLabel: string;
  label: string;
  clientName: string;
  destination: string;
  updatedAt: Date | string;
  status: SavedItemStatus;
  followUpAt?: Date | string | null;
};

type ApprovedProposalPrompt = { id: string; title: string; step: "proposal" | "final" };

const STATUS_OPTIONS: readonly [SavedItemStatus, string][] = [
  ["pending", "Pendente"],
  ["sent", "Enviada"],
  ["approved", "Aprovada"],
];

const STATUS_FILTERS = [
  ["all", "Todos"],
  ["pending", "Pendentes"],
  ["sent", "Enviadas"],
  ["approved", "Aprovadas"],
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function draftMatchesSearch(draft: { label: string; clientName: string; destination: string }, search: string) {
  const query = normalize(search);
  if (!query) return true;
  return [draft.label, draft.clientName, draft.destination].some((value) => normalize(value || "").includes(query));
}

function StatusFilterButtons({
  value,
  onChange,
  counts,
}: {
  value: SavedTourProposalStatusFilter;
  onChange: (value: SavedTourProposalStatusFilter) => void;
  counts?: Record<SavedItemStatus, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-semibold text-slate-600">Status:</span>
      {STATUS_FILTERS.map(([status, label]) => (
        <Button
          key={status}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(status)}
          className={`h-8 px-3 text-[11px] ${value === status ? "border-[#1a2e4a] bg-[#1a2e4a] text-white hover:bg-[#243c62] hover:text-white" : "border-slate-300 bg-white text-slate-600 hover:border-[#1a2e4a] hover:text-[#1a2e4a]"}`}
        >
          {status === "all" || !counts ? label : `${label} (${counts[status]})`}
        </Button>
      ))}
    </div>
  );
}

function StatusCounters({ counts }: { counts: Record<SavedItemStatus, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      <span className="font-semibold text-slate-600">Acompanhamento:</span>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Pendentes: {counts.pending}</span>
      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-800">Enviadas: {counts.sent}</span>
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">Aprovadas: {counts.approved}</span>
    </div>
  );
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 bg-white pl-9 text-xs" />
    </div>
  );
}

function TypeBadge({ typeLabel }: { typeLabel: string }) {
  return <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{typeLabel}</span>;
}

function countStatusItems(items: { status: SavedItemStatus }[]) {
  return items.reduce<Record<SavedItemStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { pending: 0, sent: 0, approved: 0 });
}

function ExpandedTourProposalDetails({ proposalId }: { proposalId: string }) {
  const proposalQuery = trpc.tourProposals.get.useQuery({ id: proposalId });
  if (proposalQuery.isLoading) return <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">Carregando detalhes da proposta...</div>;
  if (!proposalQuery.data) return <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">Não foi possível carregar os detalhes desta proposta.</div>;

  let snapshot: BudgetData;
  try {
    snapshot = JSON.parse(proposalQuery.data.snapshot) as BudgetData;
  } catch {
    return <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">Os detalhes deste documento salvo não estão disponíveis.</div>;
  }

  const proposal = snapshot.tourProposal;
  const selectedHotel = proposal.includedHotelId ? snapshot.hotels?.find((hotel) => hotel.id === proposal.includedHotelId) : undefined;
  const days = [...(snapshot.itinerary || [])].sort((left, right) => left.day - right.day);
  return <div className="mt-1 border-t border-slate-200 pt-3">
    <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-[#1a2e4a]"><Hotel className="h-3.5 w-3.5" />Chegada e hospedagem</p>
        {selectedHotel ? <div className="mt-2 space-y-1 text-xs text-slate-600">
          <p className="font-semibold text-[#1a2e4a]">{selectedHotel.name || "Hospedagem"}</p>
          {proposal.airportHotelTransfer && <p><span className="font-semibold text-[#1a2e4a]">Transfer:</span> {proposal.airportHotelTransfer}{proposal.airportHotelTransferTime ? ` • ${proposal.airportHotelTransferTime}` : ""}</p>}
          {proposal.hotelArrivalTime && <p><span className="font-semibold text-[#1a2e4a]">Chegada estimada:</span> {proposal.hotelArrivalTime}</p>}
          {(proposal.hotelCheckInTime || proposal.hotelCheckOutTime) && <p><span className="font-semibold text-[#1a2e4a]">Hospedagem:</span> {proposal.hotelCheckInTime ? `Check-in ${proposal.hotelCheckInTime}` : ""}{proposal.hotelCheckInTime && proposal.hotelCheckOutTime ? " • " : ""}{proposal.hotelCheckOutTime ? `Check-out ${proposal.hotelCheckOutTime}` : ""}</p>}
          {selectedHotel.address && <p>{selectedHotel.address}</p>}
        </div> : <p className="mt-2 text-xs text-slate-500">Nenhuma hospedagem foi incluída nesta proposta.</p>}
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-bold text-[#1a2e4a]"><CalendarDays className="h-3.5 w-3.5" />Passeios e programação</p>
        {days.length ? <div className="mt-2 space-y-2">{days.map((day) => {
          const activities = day.activities?.length ? day.activities : day.tourId ? [{ id: day.tourId, title: snapshot.tours?.find((tour) => tour.id === day.tourId)?.name || "Passeio", time: "" }] : [];
          return <div key={day.id} className="border-l-2 border-amber-300 pl-2 text-xs text-slate-600"><p className="font-semibold text-[#1a2e4a]">Dia {day.day}{day.date ? ` • ${day.date}` : ""}{day.title ? ` — ${day.title}` : ""}</p>{activities.length ? <p className="mt-0.5">{activities.map((activity) => `${activity.time ? `${activity.time} • ` : ""}${activity.title || "Compromisso"}`).join(" · ")}</p> : <p className="mt-0.5 text-slate-500">Dia livre</p>}</div>;
        })}</div> : <p className="mt-2 text-xs text-slate-500">Nenhum passeio cadastrado nesta proposta.</p>}
      </div>
    </div>
  </div>;
}

export function TravelDraftsPanel({
  currentDraftId,
  draftLabel,
  onCurrentDraftIdChange,
  onDraftLabelChange,
  onOpenTravelBudget,
  onOpenTourProposal,
  onOpenTourProposalInFinalItinerary,
  onOpenFinalItinerary,
}: TravelDraftsPanelProps) {
  const { budget } = useBudget();
  const utils = trpc.useUtils();
  const [activeType, setActiveType] = useState<DraftTab>("all");
  const [travelSearch, setTravelSearch] = useState("");
  const [tourSearch, setTourSearch] = useState("");
  const [finalSearch, setFinalSearch] = useState("");
  const [allSearch, setAllSearch] = useState("");
  const [travelStatusFilter, setTravelStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [tourStatusFilter, setTourStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [finalStatusFilter, setFinalStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [allStatusFilter, setAllStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftLabel, setEditingDraftLabel] = useState("");
  const [expandedTourProposalId, setExpandedTourProposalId] = useState<string | null>(null);
  const [approvedProposalPrompt, setApprovedProposalPrompt] = useState<ApprovedProposalPrompt | null>(null);

  const budgetDraftsQuery = trpc.budgetDrafts.list.useQuery({ search: "" });
  const tourProposalsQuery = trpc.tourProposals.list.useQuery();
  const saveDraftMutation = trpc.budgetDrafts.save.useMutation();
  const renameDraftMutation = trpc.budgetDrafts.rename.useMutation();
  const deleteDraftMutation = trpc.budgetDrafts.delete.useMutation();
  const updateDraftStatusMutation = trpc.budgetDrafts.updateStatus.useMutation();
  const updateTourStatusMutation = trpc.tourProposals.updateStatus.useMutation();
  const updateDraftFollowUpMutation = trpc.budgetDrafts.updateFollowUp.useMutation();
  const updateTourFollowUpMutation = trpc.tourProposals.updateFollowUp.useMutation();

  const budgetDrafts = (budgetDraftsQuery.data || []) as BudgetDraftListItem[];
  const savedTourProposals = (tourProposalsQuery.data || []) as TourProposalListItem[];
  const travelDrafts = budgetDrafts.filter((draft) => draft.kind !== "final-itinerary" && draftMatchesSearch(draft, travelSearch) && (travelStatusFilter === "all" || draft.status === travelStatusFilter));
  const finalDrafts = budgetDrafts.filter((draft) => draft.kind === "final-itinerary" && draftMatchesSearch(draft, finalSearch) && (finalStatusFilter === "all" || draft.status === finalStatusFilter));
  const tourProposals = useMemo(
    () => filterSavedTourProposalsByStatus(filterSavedTourProposals(savedTourProposals, tourSearch), tourStatusFilter),
    [savedTourProposals, tourSearch, tourStatusFilter],
  );
  const allItems = useMemo<UnifiedDraftItem[]>(() => {
    const drafts = budgetDrafts.map((draft) => ({
      id: draft.id,
      kind: draft.kind,
      typeLabel: draft.kind === "final-itinerary" ? "Roteiro final" : "Orçamento de viagem",
      label: draft.label,
      clientName: draft.clientName,
      destination: draft.destination,
      updatedAt: draft.updatedAt,
      status: draft.status,
      followUpAt: draft.followUpAt,
    }));
    const proposals = savedTourProposals.map((proposal) => ({
      id: proposal.id,
      kind: "tour-proposal" as const,
      typeLabel: "Proposta de passeios",
      label: proposal.proposalTitle || "Proposta de passeios",
      clientName: proposal.clientName,
      destination: proposal.destination || "",
      updatedAt: proposal.updatedAt,
      status: proposal.status,
      followUpAt: proposal.followUpAt,
    }));
    return [...drafts, ...proposals]
      .filter((item) => draftMatchesSearch(item, allSearch) && (allStatusFilter === "all" || item.status === allStatusFilter))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [allSearch, allStatusFilter, budgetDrafts, savedTourProposals]);
  const travelStatusCounts = useMemo(() => countStatusItems(budgetDrafts.filter((draft) => draft.kind !== "final-itinerary")), [budgetDrafts]);
  const tourStatusCounts = useMemo(() => countStatusItems(savedTourProposals), [savedTourProposals]);
  const finalStatusCounts = useMemo(() => countStatusItems(budgetDrafts.filter((draft) => draft.kind === "final-itinerary")), [budgetDrafts]);
  const statusCounts = useMemo(() => countStatusItems([...budgetDrafts, ...savedTourProposals]), [budgetDrafts, savedTourProposals]);

  const refreshDrafts = async () => {
    await utils.budgetDrafts.list.invalidate();
  };

  const saveTravelBudget = async () => {
    const label = draftLabel.trim();
    if (!label) {
      toast.error("Informe um nome para o orçamento de viagem.");
      return;
    }
    try {
      const result = await saveDraftMutation.mutateAsync({ id: currentDraftId, label, snapshot: JSON.stringify(budget) });
      onCurrentDraftIdChange(result.id);
      await refreshDrafts();
      toast.success("Orçamento de viagem salvo.");
    } catch {
      toast.error("Não foi possível salvar o orçamento de viagem.");
    }
  };

  const renameDraft = async () => {
    const label = editingDraftLabel.trim();
    if (!editingDraftId || !label) {
      toast.error("Informe um nome para o rascunho.");
      return;
    }
    try {
      await renameDraftMutation.mutateAsync({ id: editingDraftId, label });
      if (editingDraftId === currentDraftId) onDraftLabelChange(label);
      setEditingDraftId(null);
      await refreshDrafts();
      toast.success("Nome do rascunho atualizado.");
    } catch {
      toast.error("Não foi possível renomear o rascunho.");
    }
  };

  const deleteDraft = async (id: string, label: string) => {
    if (!window.confirm(`Excluir o rascunho “${label}”? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDraftMutation.mutateAsync({ id });
      if (id === currentDraftId) onCurrentDraftIdChange(undefined);
      if (id === editingDraftId) setEditingDraftId(null);
      await refreshDrafts();
      toast.success("Rascunho excluído.");
    } catch {
      toast.error("Não foi possível excluir o rascunho.");
    }
  };

  const updateDraftStatus = async (id: string, status: SavedItemStatus) => {
    try {
      await updateDraftStatusMutation.mutateAsync({ id, status });
      await refreshDrafts();
      toast.success("Status atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  };

  const updateTourStatus = async (id: string, status: SavedItemStatus) => {
    try {
      await updateTourStatusMutation.mutateAsync({ id, status });
      await utils.tourProposals.list.invalidate();
      const currentProposal = savedTourProposals.find((proposal) => proposal.id === id);
      if (status === "approved" && currentProposal?.status !== "approved") {
        setApprovedProposalPrompt({ id, title: currentProposal?.proposalTitle || "Proposta de passeios", step: "proposal" });
        toast.success("Proposta marcada como aprovada.");
      } else {
        toast.success("Status atualizado.");
      }
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  };

  const updateDraftFollowUp = async (id: string, value: string) => {
    try {
      await updateDraftFollowUpMutation.mutateAsync({ id, followUpAt: followUpInputToDate(value) });
      await refreshDrafts();
      toast.success(value ? "Data de retorno atualizada." : "Data de retorno removida.");
    } catch {
      toast.error("Não foi possível atualizar a data de retorno.");
    }
  };

  const updateTourFollowUp = async (id: string, value: string) => {
    try {
      await updateTourFollowUpMutation.mutateAsync({ id, followUpAt: followUpInputToDate(value) });
      await utils.tourProposals.list.invalidate();
      toast.success(value ? "Data de retorno atualizada." : "Data de retorno removida.");
    } catch {
      toast.error("Não foi possível atualizar a data de retorno.");
    }
  };

  const followUpField = (item: { id: string; label: string; status: SavedItemStatus; followUpAt?: Date | string | null }, onChange: (value: string) => void, pending: boolean) => {
    if (item.status !== "pending") return null;
    return (
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
        Retorno:
        <input
          aria-label={`Data de retorno de ${item.label}`}
          type="date"
          value={followUpDateToInput(item.followUpAt)}
          onChange={(event) => onChange(event.target.value)}
          disabled={pending}
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1a2e4a]"
        />
      </label>
    );
  };

  const draftCard = (draft: BudgetDraftListItem, onOpen: () => void, typeLabel?: string) => (
    <div key={draft.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {editingDraftId === draft.id ? <Input value={editingDraftLabel} onChange={(event) => setEditingDraftLabel(event.target.value)} className="h-9 max-w-xl text-sm" autoFocus /> : <p className="truncate text-sm font-semibold text-[#1a2e4a]">{draft.label}</p>}
          {typeLabel ? <TypeBadge typeLabel={typeLabel} /> : null}
        </div>
        <p className="mt-1 text-xs text-slate-600">{[draft.clientName && `Cliente: ${draft.clientName}`, draft.destination && `Destino: ${draft.destination}`].filter(Boolean).join(" • ") || "Cliente e destino não informados"}</p>
        <p className="mt-1 text-[11px] text-slate-500">Atualizado em {new Date(draft.updatedAt).toLocaleString("pt-BR")}{draft.status === "pending" && formatFollowUpDate(draft.followUpAt) ? ` • Retorno: ${formatFollowUpDate(draft.followUpAt)}` : ""}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <select aria-label={`Status de ${draft.label}`} value={draft.status} onChange={(event) => updateDraftStatus(draft.id, event.target.value as SavedItemStatus)} disabled={updateDraftStatusMutation.isPending} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1a2e4a]">
          {STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}
        </select>
        {followUpField(draft, (value) => updateDraftFollowUp(draft.id, value), updateDraftFollowUpMutation.isPending)}
        {editingDraftId === draft.id ? <Button type="button" size="sm" className="h-9 bg-[#1a2e4a] px-3 text-xs text-white hover:bg-[#243c62]" onClick={renameDraft} disabled={renameDraftMutation.isPending}>Salvar nome</Button> : <><Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={onOpen}>Abrir</Button><Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => { setEditingDraftId(draft.id); setEditingDraftLabel(draft.label); }}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar nome</Button></>}
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${draft.label}`} onClick={() => deleteDraft(draft.id, draft.label)} disabled={deleteDraftMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  const tourProposalCard = (proposal: TourProposalListItem, typeLabel?: string) => (
    <div key={proposal.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-[#1a2e4a]">{proposal.proposalTitle || "Proposta de passeios"}</p>{typeLabel ? <TypeBadge typeLabel={typeLabel} /> : null}</div>
          <p className="mt-1 text-xs text-slate-600">Cliente: {proposal.clientName}{proposal.destination ? ` • Destino: ${proposal.destination}` : ""}</p>
          <p className="mt-1 text-[11px] text-slate-500">Atualizada em {new Date(proposal.updatedAt).toLocaleString("pt-BR")}{proposal.status === "pending" && formatFollowUpDate(proposal.followUpAt) ? ` • Retorno: ${formatFollowUpDate(proposal.followUpAt)}` : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <select aria-label={`Status de ${proposal.proposalTitle || "proposta de passeios"}`} value={proposal.status} onChange={(event) => updateTourStatus(proposal.id, event.target.value as SavedItemStatus)} disabled={updateTourStatusMutation.isPending} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1a2e4a]">
            {STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}
          </select>
          {followUpField({ id: proposal.id, label: proposal.proposalTitle || "Proposta de passeios", status: proposal.status, followUpAt: proposal.followUpAt }, (value) => updateTourFollowUp(proposal.id, value), updateTourFollowUpMutation.isPending)}
          <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => setExpandedTourProposalId((currentId) => currentId === proposal.id ? null : proposal.id)}>{expandedTourProposalId === proposal.id ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}{expandedTourProposalId === proposal.id ? "Recolher" : "Ver proposta"}</Button>
          <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => onOpenTourProposal(proposal.id)}>Abrir</Button>
        </div>
      </div>
      {expandedTourProposalId === proposal.id && <ExpandedTourProposalDetails proposalId={proposal.id} />}
    </div>
  );

  const unifiedCard = (item: UnifiedDraftItem) => {
    if (item.kind === "tour-proposal") {
      return tourProposalCard({ id: item.id, clientName: item.clientName, proposalTitle: item.label, destination: item.destination, updatedAt: item.updatedAt, status: item.status, followUpAt: item.followUpAt }, item.typeLabel);
    }
    return draftCard({ id: item.id, label: item.label, clientName: item.clientName, destination: item.destination, updatedAt: item.updatedAt, status: item.status, followUpAt: item.followUpAt, kind: item.kind }, () => item.kind === "final-itinerary" ? onOpenFinalItinerary(item.id) : onOpenTravelBudget(item.id), item.typeLabel);
  };

  const listState = (loading: boolean, itemCount: number, emptyMessage: string, children: React.ReactNode) => loading ? <p className="py-8 text-center text-sm text-slate-500">Carregando documentos...</p> : itemCount ? <div className="space-y-2">{children}</div> : <p className="rounded-md bg-white py-8 text-center text-sm text-slate-500">{emptyMessage}</p>;

  return (
    <>
    <section className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2.5"><FolderOpen className="mt-0.5 h-5 w-5 text-[#1a2e4a]" /><div><h2 className="text-sm font-bold text-[#1a2e4a]">Acompanhamento de propostas</h2><p className="mt-0.5 text-[11px] text-slate-500">Organize orçamentos de viagem, propostas de passeios e roteiros finais em uma única tela.</p></div></div>
        <StatusCounters counts={statusCounts} />
      </div>

      <div className="p-4">
        <Tabs value={activeType} onValueChange={(value) => setActiveType(value as DraftTab)}>
          <TabsList className="grid h-auto w-full grid-cols-2 bg-slate-200 p-1 md:grid-cols-4">
            <TabsTrigger value="all" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Todos ({allItems.length})</TabsTrigger>
            <TabsTrigger value="complete-budget" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Orçamento de viagem</TabsTrigger>
            <TabsTrigger value="tour-proposal" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Proposta de passeios</TabsTrigger>
            <TabsTrigger value="final-itinerary" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Roteiro final</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-5 space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3">
            <div className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-[#1a2e4a]" /><div><h3 className="text-sm font-semibold text-[#1a2e4a]">Todos os documentos</h3><p className="text-[11px] text-slate-500">Pesquise e acompanhe todos os orçamentos, propostas e roteiros no mesmo lugar.</p></div></div>
            <SearchField value={allSearch} onChange={setAllSearch} placeholder="Buscar por cliente, destino ou nome do documento" />
            <StatusFilterButtons value={allStatusFilter} onChange={setAllStatusFilter} counts={statusCounts} />
            {listState(budgetDraftsQuery.isLoading || tourProposalsQuery.isLoading, allItems.length, allSearch || allStatusFilter !== "all" ? "Nenhum documento encontrado com os filtros selecionados." : "Nenhum documento salvo ainda.", allItems.map(unifiedCard))}
          </TabsContent>

          <TabsContent value="complete-budget" className="mt-5 space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#1a2e4a]" /><h3 className="text-sm font-semibold text-[#1a2e4a]">Salvar orçamento de viagem</h3></div>
              <div className="flex flex-col gap-2 md:flex-row"><div className="min-w-0 flex-1"><Label htmlFor="travel-budget-label" className="sr-only">Nome do orçamento</Label><Input id="travel-budget-label" value={draftLabel} onChange={(event) => onDraftLabelChange(event.target.value)} placeholder="Ex.: Orçamento de viagem — Santiago" className="h-10 bg-white text-sm" /></div><Button type="button" className="h-10 bg-[#1a2e4a] px-4 text-white hover:bg-[#243c62]" onClick={saveTravelBudget} disabled={saveDraftMutation.isPending}><Save className="mr-2 h-4 w-4" />{saveDraftMutation.isPending ? "Salvando..." : "Salvar orçamento"}</Button></div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Guarda cliente, voos, hotéis, tarifas e pagamentos da viagem atual.</p>
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#1a2e4a]" /><h3 className="text-sm font-semibold text-[#1a2e4a]">Orçamentos de viagem salvos</h3></div><SearchField value={travelSearch} onChange={setTravelSearch} placeholder="Buscar por cliente, destino ou nome" /><StatusFilterButtons value={travelStatusFilter} onChange={setTravelStatusFilter} counts={travelStatusCounts} />{listState(budgetDraftsQuery.isLoading, travelDrafts.length, travelSearch || travelStatusFilter !== "all" ? "Nenhum orçamento de viagem encontrado com os filtros selecionados." : "Nenhum orçamento de viagem salvo ainda.", travelDrafts.map((draft) => draftCard(draft, () => onOpenTravelBudget(draft.id))))}</div>
          </TabsContent>

          <TabsContent value="tour-proposal" className="mt-5 space-y-4"><div className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1a2e4a]" /><div><h3 className="text-sm font-semibold text-[#1a2e4a]">Propostas de passeios salvas</h3><p className="text-[11px] text-slate-500">Abra uma proposta para revisar ou modificar passeios, valores e condições.</p></div></div><SearchField value={tourSearch} onChange={setTourSearch} placeholder="Buscar por cliente, destino ou proposta" /><StatusFilterButtons value={tourStatusFilter} onChange={setTourStatusFilter} counts={tourStatusCounts} />{listState(tourProposalsQuery.isLoading, tourProposals.length, tourSearch || tourStatusFilter !== "all" ? "Nenhuma proposta de passeios encontrada com os filtros selecionados." : "Nenhuma proposta de passeios salva ainda.", tourProposals.map((proposal) => tourProposalCard(proposal)))}</div></TabsContent>

          <TabsContent value="final-itinerary" className="mt-5 space-y-4"><div className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3"><div className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-[#1a2e4a]" /><div><h3 className="text-sm font-semibold text-[#1a2e4a]">Roteiros finais salvos</h3><p className="text-[11px] text-slate-500">Rascunhos de viagem que já possuem informações do Roteiro Final.</p></div></div><SearchField value={finalSearch} onChange={setFinalSearch} placeholder="Buscar por cliente, destino ou nome" /><StatusFilterButtons value={finalStatusFilter} onChange={setFinalStatusFilter} counts={finalStatusCounts} />{listState(budgetDraftsQuery.isLoading, finalDrafts.length, finalSearch || finalStatusFilter !== "all" ? "Nenhum roteiro final encontrado com os filtros selecionados." : "Nenhum roteiro final salvo ainda.", finalDrafts.map((draft) => draftCard(draft, () => onOpenFinalItinerary(draft.id))))}</div></TabsContent>
        </Tabs>
      </div>
    </section>
    <Dialog open={Boolean(approvedProposalPrompt)} onOpenChange={(open) => { if (!open) setApprovedProposalPrompt(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{approvedProposalPrompt?.step === "final" ? "Abrir Roteiro final?" : "Abrir Proposta de passeios?"}</DialogTitle>
          <DialogDescription>
            {approvedProposalPrompt?.step === "final"
              ? `Deseja abrir o Roteiro final de “${approvedProposalPrompt?.title}” para complementar a viagem?`
              : `“${approvedProposalPrompt?.title}” foi aprovada. Deseja abrir a Proposta de passeios para revisar os detalhes?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            if (approvedProposalPrompt?.step === "proposal") setApprovedProposalPrompt((current) => current ? { ...current, step: "final" } : null);
            else setApprovedProposalPrompt(null);
          }}>
            {approvedProposalPrompt?.step === "proposal" ? "Não, seguir para Roteiro final" : "Não agora"}
          </Button>
          <Button type="button" className="bg-[#1a2e4a] text-white hover:bg-[#243c62]" onClick={() => {
            if (!approvedProposalPrompt) return;
            if (approvedProposalPrompt.step === "proposal") onOpenTourProposal(approvedProposalPrompt.id);
            else onOpenTourProposalInFinalItinerary(approvedProposalPrompt.id);
            setApprovedProposalPrompt(null);
          }}>
            {approvedProposalPrompt?.step === "proposal" ? "Sim, abrir proposta" : "Sim, abrir Roteiro final"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
