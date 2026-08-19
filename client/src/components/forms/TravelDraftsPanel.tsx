import { useMemo, useState } from "react";
import { CalendarDays, FileText, FolderOpen, MapPinned, Pencil, Save, Search, Trash2 } from "lucide-react";
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

type SavedItemStatus = Exclude<SavedTourProposalStatusFilter, "all">;

type TravelDraftsPanelProps = {
  currentDraftId?: string;
  draftLabel: string;
  onCurrentDraftIdChange: (id?: string) => void;
  onDraftLabelChange: (label: string) => void;
  onOpenTravelBudget: (id: string) => void;
  onOpenTourProposal: (id: string) => void;
  onOpenFinalItinerary: (id: string) => void;
};

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

function StatusFilterButtons({
  value,
  onChange,
}: {
  value: SavedTourProposalStatusFilter;
  onChange: (value: SavedTourProposalStatusFilter) => void;
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
          {label}
        </Button>
      ))}
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

export function TravelDraftsPanel({
  currentDraftId,
  draftLabel,
  onCurrentDraftIdChange,
  onDraftLabelChange,
  onOpenTravelBudget,
  onOpenTourProposal,
  onOpenFinalItinerary,
}: TravelDraftsPanelProps) {
  const { budget } = useBudget();
  const utils = trpc.useUtils();
  const [activeType, setActiveType] = useState<"complete-budget" | "tour-proposal" | "final-itinerary">("complete-budget");
  const [travelSearch, setTravelSearch] = useState("");
  const [tourSearch, setTourSearch] = useState("");
  const [finalSearch, setFinalSearch] = useState("");
  const [travelStatusFilter, setTravelStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [tourStatusFilter, setTourStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [finalStatusFilter, setFinalStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftLabel, setEditingDraftLabel] = useState("");

  const travelDraftsQuery = trpc.budgetDrafts.list.useQuery({ search: travelSearch });
  const finalDraftsQuery = trpc.budgetDrafts.list.useQuery({ search: finalSearch });
  const tourProposalsQuery = trpc.tourProposals.list.useQuery();
  const saveDraftMutation = trpc.budgetDrafts.save.useMutation();
  const renameDraftMutation = trpc.budgetDrafts.rename.useMutation();
  const deleteDraftMutation = trpc.budgetDrafts.delete.useMutation();
  const updateDraftStatusMutation = trpc.budgetDrafts.updateStatus.useMutation();
  const updateTourStatusMutation = trpc.tourProposals.updateStatus.useMutation();

  const travelDrafts = (travelDraftsQuery.data || []).filter(
    (draft) => draft.kind !== "final-itinerary" && (travelStatusFilter === "all" || draft.status === travelStatusFilter),
  );
  const finalDrafts = (finalDraftsQuery.data || []).filter(
    (draft) => draft.kind === "final-itinerary" && (finalStatusFilter === "all" || draft.status === finalStatusFilter),
  );
  const tourProposals = useMemo(
    () => filterSavedTourProposalsByStatus(filterSavedTourProposals(tourProposalsQuery.data || [], tourSearch), tourStatusFilter),
    [tourProposalsQuery.data, tourSearch, tourStatusFilter],
  );

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
      toast.success("Status atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o status.");
    }
  };

  const draftCard = (draft: { id: string; label: string; clientName: string; destination: string; updatedAt: Date | string; status: SavedItemStatus }, onOpen: () => void) => (
    <div key={draft.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        {editingDraftId === draft.id ? (
          <Input value={editingDraftLabel} onChange={(event) => setEditingDraftLabel(event.target.value)} className="h-9 max-w-xl text-sm" autoFocus />
        ) : (
          <p className="truncate text-sm font-semibold text-[#1a2e4a]">{draft.label}</p>
        )}
        <p className="mt-1 text-xs text-slate-600">{[draft.clientName && `Cliente: ${draft.clientName}`, draft.destination && `Destino: ${draft.destination}`].filter(Boolean).join(" • ") || "Cliente e destino não informados"}</p>
        <p className="mt-1 text-[11px] text-slate-500">Atualizado em {new Date(draft.updatedAt).toLocaleString("pt-BR")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <select aria-label={`Status de ${draft.label}`} value={draft.status} onChange={(event) => updateDraftStatus(draft.id, event.target.value as SavedItemStatus)} disabled={updateDraftStatusMutation.isPending} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1a2e4a]">
          {STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}
        </select>
        {editingDraftId === draft.id ? (
          <Button type="button" size="sm" className="h-9 bg-[#1a2e4a] px-3 text-xs text-white hover:bg-[#243c62]" onClick={renameDraft} disabled={renameDraftMutation.isPending}>Salvar nome</Button>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={onOpen}>Abrir</Button>
            <Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => { setEditingDraftId(draft.id); setEditingDraftLabel(draft.label); }}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar nome</Button>
          </>
        )}
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${draft.label}`} onClick={() => deleteDraft(draft.id, draft.label)} disabled={deleteDraftMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2.5"><FolderOpen className="mt-0.5 h-5 w-5 text-[#1a2e4a]" /><div><h2 className="text-sm font-bold text-[#1a2e4a]">Gestão de rascunhos</h2><p className="mt-0.5 text-[11px] text-slate-500">Organize orçamentos de viagem, propostas de passeios e roteiros finais em uma única tela.</p></div></div>
        <p className="text-[11px] font-medium text-slate-500">Abra qualquer item para continuar editando.</p>
      </div>

      <div className="p-4">
        <Tabs value={activeType} onValueChange={(value) => setActiveType(value as "complete-budget" | "tour-proposal" | "final-itinerary")}>
          <TabsList className="grid h-auto w-full grid-cols-3 bg-slate-200 p-1">
            <TabsTrigger value="complete-budget" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Orçamento de viagem</TabsTrigger>
            <TabsTrigger value="tour-proposal" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Proposta de passeios</TabsTrigger>
            <TabsTrigger value="final-itinerary" className="min-h-10 px-2 text-xs leading-tight data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a]">Roteiro final</TabsTrigger>
          </TabsList>

          <TabsContent value="complete-budget" className="mt-5 space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-[#1a2e4a]" /><h3 className="text-sm font-semibold text-[#1a2e4a]">Salvar orçamento de viagem</h3></div>
              <div className="flex flex-col gap-2 md:flex-row"><div className="min-w-0 flex-1"><Label htmlFor="travel-budget-label" className="sr-only">Nome do orçamento</Label><Input id="travel-budget-label" value={draftLabel} onChange={(event) => onDraftLabelChange(event.target.value)} placeholder="Ex.: Orçamento de viagem — Santiago" className="h-10 bg-white text-sm" /></div><Button type="button" className="h-10 bg-[#1a2e4a] px-4 text-white hover:bg-[#243c62]" onClick={saveTravelBudget} disabled={saveDraftMutation.isPending}><Save className="mr-2 h-4 w-4" />{saveDraftMutation.isPending ? "Salvando..." : "Salvar orçamento"}</Button></div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Guarda cliente, voos, hotéis, tarifas e pagamentos da viagem atual.</p>
            </div>
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#1a2e4a]" /><h3 className="text-sm font-semibold text-[#1a2e4a]">Orçamentos de viagem salvos</h3></div>
              <SearchField value={travelSearch} onChange={setTravelSearch} placeholder="Buscar por cliente, destino ou nome" />
              <StatusFilterButtons value={travelStatusFilter} onChange={setTravelStatusFilter} />
              {travelDraftsQuery.isLoading ? <p className="py-8 text-center text-sm text-slate-500">Carregando orçamentos de viagem...</p> : travelDrafts.length ? <div className="space-y-2">{travelDrafts.map((draft) => draftCard(draft, () => onOpenTravelBudget(draft.id)))}</div> : <p className="rounded-md bg-white py-8 text-center text-sm text-slate-500">{travelSearch || travelStatusFilter !== "all" ? "Nenhum orçamento de viagem encontrado com os filtros selecionados." : "Nenhum orçamento de viagem salvo ainda."}</p>}
            </div>
          </TabsContent>

          <TabsContent value="tour-proposal" className="mt-5 space-y-4">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3">
              <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1a2e4a]" /><div><h3 className="text-sm font-semibold text-[#1a2e4a]">Propostas de passeios salvas</h3><p className="text-[11px] text-slate-500">Abra uma proposta para revisar ou modificar passeios, valores e condições.</p></div></div>
              <SearchField value={tourSearch} onChange={setTourSearch} placeholder="Buscar por cliente, destino ou proposta" />
              <StatusFilterButtons value={tourStatusFilter} onChange={setTourStatusFilter} />
              {tourProposalsQuery.isLoading ? <p className="py-8 text-center text-sm text-slate-500">Carregando propostas de passeios...</p> : tourProposals.length ? <div className="space-y-2">{tourProposals.map((proposal) => <div key={proposal.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40 md:flex-row md:items-center md:justify-between"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#1a2e4a]">{proposal.proposalTitle || "Proposta de passeios"}</p><p className="mt-1 text-xs text-slate-600">Cliente: {proposal.clientName}{proposal.destination ? ` • Destino: ${proposal.destination}` : ""}</p><p className="mt-1 text-[11px] text-slate-500">Atualizada em {new Date(proposal.updatedAt).toLocaleString("pt-BR")}</p></div><div className="flex flex-wrap items-center gap-2 md:justify-end"><select aria-label={`Status de ${proposal.proposalTitle || "proposta de passeios"}`} value={proposal.status} onChange={(event) => updateTourStatus(proposal.id, event.target.value as SavedItemStatus)} disabled={updateTourStatusMutation.isPending} className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1a2e4a]">{STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select><Button type="button" variant="outline" size="sm" className="h-9 px-3 text-xs" onClick={() => onOpenTourProposal(proposal.id)}>Abrir</Button></div></div>)}</div> : <p className="rounded-md bg-white py-8 text-center text-sm text-slate-500">{tourSearch || tourStatusFilter !== "all" ? "Nenhuma proposta de passeios encontrada com os filtros selecionados." : "Nenhuma proposta de passeios salva ainda."}</p>}
            </div>
          </TabsContent>

          <TabsContent value="final-itinerary" className="mt-5 space-y-4">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/70 p-3">
              <div className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-[#1a2e4a]" /><div><h3 className="text-sm font-semibold text-[#1a2e4a]">Roteiros finais salvos</h3><p className="text-[11px] text-slate-500">Rascunhos de viagem que já possuem informações do Roteiro Final.</p></div></div>
              <SearchField value={finalSearch} onChange={setFinalSearch} placeholder="Buscar por cliente, destino ou nome" />
              <StatusFilterButtons value={finalStatusFilter} onChange={setFinalStatusFilter} />
              {finalDraftsQuery.isLoading ? <p className="py-8 text-center text-sm text-slate-500">Carregando roteiros finais...</p> : finalDrafts.length ? <div className="space-y-2">{finalDrafts.map((draft) => draftCard(draft, () => onOpenFinalItinerary(draft.id)))}</div> : <p className="rounded-md bg-white py-8 text-center text-sm text-slate-500">{finalSearch || finalStatusFilter !== "all" ? "Nenhum roteiro final encontrado com os filtros selecionados." : "Nenhum roteiro final salvo ainda."}</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
