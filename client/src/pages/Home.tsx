import { useEffect, useMemo, useState } from "react";
import { BudgetProvider, useBudget } from "@/contexts/BudgetContext";
import { TripInfoForm } from "@/components/forms/TripInfoForm";
import { FlightForm } from "@/components/forms/FlightForm";
import { HotelForm } from "@/components/forms/HotelForm";
import { ItineraryForm } from "@/components/forms/ItineraryForm";
import { FinalItineraryForm } from "@/components/forms/FinalItineraryForm";
import { TravelClientsPanel } from "@/components/forms/TravelClientsPanel";
import { TravelLibraryPanel } from "@/components/forms/TravelLibraryPanel";
import { TravelDraftsPanel } from "@/components/forms/TravelDraftsPanel";
import { FareForm } from "@/components/forms/FareForm";
import { BaggageForm } from "@/components/forms/BaggageForm";
import { InstallmentsForm } from "@/components/forms/InstallmentsForm";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ItineraryPreview } from "@/components/itinerary/ItineraryPreview";
import { FinalItineraryPreview } from "@/components/itinerary/FinalItineraryPreview";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plane, Building2, Settings, FileText, Download, Eye, EyeOff, CalendarDays, MapPinned, FolderOpen, Save, Pencil, Search, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { filterSavedTourProposals, filterSavedTourProposalsByStatus, type SavedTourProposalStatusFilter } from "@/components/forms/tourProposalListState";

const SAVED_ITEM_STATUS_OPTIONS = [
  ["pending", "Pendente"],
  ["sent", "Enviada"],
  ["approved", "Aprovada"],
] as const;

function BuilderContent() {
  const { budget, replaceBudget, updateTripInfo, clearBudgetOnly } = useBudget();
  const { generatePdf } = usePdfGenerator();
  const utils = trpc.useUtils();
  const [showPreview, setShowPreview] = useState(true);
  const [includeAirfare, setIncludeAirfare] = useState(true);
  const [includeHotel, setIncludeHotel] = useState(true);
  const [activeTab, setActiveTab] = useState("trip");
  const [sideView, setSideView] = useState<"budget" | "library" | "clients" | "drafts">("budget");
  const [itineraryMode, setItineraryMode] = useState<"proposal" | "final">("proposal");
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const [budgetLoadKey, setBudgetLoadKey] = useState(0);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [selectedTourProposalId, setSelectedTourProposalId] = useState<string | null>(null);
  const [draftKind, setDraftKind] = useState<"complete-budget" | "tour-proposal" | "final-itinerary">("complete-budget");
  const [draftSearch, setDraftSearch] = useState("");
  const [tourProposalSearch, setTourProposalSearch] = useState("");
  const [tourProposalStatusFilter, setTourProposalStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [finalItineraryDraftSearch, setFinalItineraryDraftSearch] = useState("");
  const [travelBudgetStatusFilter, setTravelBudgetStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [finalItineraryStatusFilter, setFinalItineraryStatusFilter] = useState<SavedTourProposalStatusFilter>("all");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftLabel, setEditingDraftLabel] = useState("");
  const draftsQuery = trpc.budgetDrafts.list.useQuery({ search: draftSearch });
  const finalItineraryDraftsQuery = trpc.budgetDrafts.list.useQuery({ search: finalItineraryDraftSearch });
  const tourProposalsQuery = trpc.tourProposals.list.useQuery();
  const selectedDraftQuery = trpc.budgetDrafts.get.useQuery(
    { id: selectedDraftId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedDraftId) },
  );
  const selectedTourProposalQuery = trpc.tourProposals.get.useQuery(
    { id: selectedTourProposalId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedTourProposalId) },
  );
  const saveDraftMutation = trpc.budgetDrafts.save.useMutation();
  const renameDraftMutation = trpc.budgetDrafts.rename.useMutation();
  const deleteDraftMutation = trpc.budgetDrafts.delete.useMutation();
  const updateBudgetDraftStatusMutation = trpc.budgetDrafts.updateStatus.useMutation();
  const updateTourProposalStatusMutation = trpc.tourProposals.updateStatus.useMutation();
  const completeBudgetDrafts = (draftsQuery.data || []).filter((draft) => draft.kind !== "final-itinerary" && (travelBudgetStatusFilter === "all" || draft.status === travelBudgetStatusFilter));
  const finalItineraryDrafts = (finalItineraryDraftsQuery.data || []).filter((draft) => draft.kind === "final-itinerary" && (finalItineraryStatusFilter === "all" || draft.status === finalItineraryStatusFilter));
  const filteredTourProposals = useMemo(
    () => filterSavedTourProposalsByStatus(
      filterSavedTourProposals(tourProposalsQuery.data || [], tourProposalSearch),
      tourProposalStatusFilter,
    ),
    [tourProposalSearch, tourProposalStatusFilter, tourProposalsQuery.data],
  );
  const showingItinerary = sideView === "budget" && activeTab === "itinerary";
  const showingFinalItinerary = showingItinerary && itineraryMode === "final";

  useEffect(() => {
    if (!selectedDraftId || !selectedDraftQuery.data) return;
    try {
      replaceBudget(JSON.parse(selectedDraftQuery.data.snapshot));
      setCurrentDraftId(selectedDraftQuery.data.id);
      setDraftLabel(selectedDraftQuery.data.label);
      setBudgetLoadKey((currentKey) => currentKey + 1);
      setSelectedDraftId(null);
      setDraftDialogOpen(false);
      toast.success("Rascunho aberto. Você pode continuar editando hotéis, voos e demais dados.");
    } catch {
      toast.error("Não foi possível abrir este rascunho.");
      setSelectedDraftId(null);
    }
  }, [replaceBudget, selectedDraftId, selectedDraftQuery.data]);

  useEffect(() => {
    if (!selectedTourProposalId || !selectedTourProposalQuery.data) return;
    try {
      const restored = JSON.parse(selectedTourProposalQuery.data.snapshot);
      if (!restored || typeof restored !== "object" || !Array.isArray(restored.tours) || !Array.isArray(restored.itinerary)) {
        throw new Error("O arquivo salvo desta proposta está inválido.");
      }
      replaceBudget(restored);
      setCurrentDraftId(undefined);
      setDraftLabel("");
      setBudgetLoadKey((currentKey) => currentKey + 1);
      setSideView("budget");
      setActiveTab("itinerary");
      setItineraryMode("proposal");
      setSelectedTourProposalId(null);
      setDraftDialogOpen(false);
      toast.success(`Proposta de ${selectedTourProposalQuery.data.clientName} carregada.`);
    } catch (error) {
      console.error("Load tour proposal from drafts error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir esta proposta de passeios.");
      setSelectedTourProposalId(null);
    }
  }, [replaceBudget, selectedTourProposalId, selectedTourProposalQuery.data]);

  const openDrafts = () => {
    if (!draftLabel.trim()) {
      setDraftLabel(budget.tripInfo.destination ? `Orçamento de viagem — ${budget.tripInfo.destination}` : "Orçamento de viagem em rascunho");
    }
    setSideView("drafts");
  };

  const saveDraft = async () => {
    const label = draftLabel.trim();
    if (!label) {
      toast.error("Informe um nome para o rascunho.");
      return;
    }
    try {
      const result = await saveDraftMutation.mutateAsync({ id: currentDraftId, label, snapshot: JSON.stringify(budget) });
      setCurrentDraftId(result.id);
      await utils.budgetDrafts.list.invalidate();
      toast.success("Orçamento salvo como rascunho.");
    } catch {
      toast.error("Não foi possível salvar o rascunho. Tente novamente.");
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
      if (currentDraftId === editingDraftId) setDraftLabel(label);
      setEditingDraftId(null);
      await utils.budgetDrafts.list.invalidate();
      toast.success("Rascunho renomeado.");
    } catch {
      toast.error("Não foi possível renomear o rascunho.");
    }
  };

  const deleteDraft = async (id: string, label: string) => {
    if (!window.confirm(`Excluir o rascunho “${label}”? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDraftMutation.mutateAsync({ id });
      if (currentDraftId === id) setCurrentDraftId(undefined);
      if (editingDraftId === id) setEditingDraftId(null);
      await utils.budgetDrafts.list.invalidate();
      toast.success("Rascunho excluído.");
    } catch {
      toast.error("Não foi possível excluir o rascunho.");
    }
  };

  const updateBudgetDraftStatus = async (id: string, status: Exclude<SavedTourProposalStatusFilter, "all">) => {
    try {
      await updateBudgetDraftStatusMutation.mutateAsync({ id, status });
      await utils.budgetDrafts.list.invalidate();
      toast.success("Status do rascunho atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o status do rascunho.");
    }
  };

  const updateTourProposalStatus = async (id: string, status: Exclude<SavedTourProposalStatusFilter, "all">) => {
    try {
      await updateTourProposalStatusMutation.mutateAsync({ id, status });
      await utils.tourProposals.list.invalidate();
      toast.success("Status da proposta atualizado.");
    } catch {
      toast.error("Não foi possível atualizar o status da proposta.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <header className="bg-[#1a2e4a] text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "Poppins, sans-serif" }}>
              Bella Viagens e Milhas
            </h1>
            <p className="text-[10px] text-amber-400 tracking-wide">Acumule. Viaje. Viva.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openDrafts}
            className="text-white hover:bg-white/10"
          >
            <Save className="h-4 w-4 mr-2" />
            Rascunhos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-white hover:bg-white/10"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Ocultar Preview" : "Mostrar Preview"}
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-airfare"
                checked={includeAirfare}
                onCheckedChange={(checked) => setIncludeAirfare(checked as boolean)}
              />
              <Label htmlFor="include-airfare" className="text-xs text-white cursor-pointer">
                Incluir Aéreo
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-hotel"
                checked={includeHotel}
                onCheckedChange={(checked) => setIncludeHotel(checked as boolean)}
              />
              <Label htmlFor="include-hotel" className="text-xs text-white cursor-pointer">
                Incluir Hotel
              </Label>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                toast.loading("Gerando PDF...", { id: "pdf-gen" });
                try {
                  await generatePdf();
                  toast.success("PDF gerado! Verifique a pasta Downloads do seu computador.", { id: "pdf-gen" });
                } catch (err) {
                  console.error("PDF error:", err);
                  toast.error("Erro ao gerar PDF. Tente novamente.", { id: "pdf-gen" });
                }
              }}
              className="bg-amber-400 text-[#1a2e4a] hover:bg-amber-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={draftDialogOpen} onOpenChange={setDraftDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[#1a2e4a]">Abrir ou salvar rascunhos</DialogTitle>
            <DialogDescription>Escolha o tipo que deseja consultar. Cada lista mantém sua própria busca e abre diretamente no ponto correto do sistema.</DialogDescription>
          </DialogHeader>
          <Tabs value={draftKind} onValueChange={(value) => setDraftKind(value as "complete-budget" | "tour-proposal" | "final-itinerary")}>
            <TabsList className="grid h-auto w-full grid-cols-3 bg-slate-100 p-1">
              <TabsTrigger value="complete-budget" className="px-2 py-2 text-[11px] leading-tight data-[state=active]:text-[#1a2e4a]">Orçamento de viagem</TabsTrigger>
              <TabsTrigger value="tour-proposal" className="px-2 py-2 text-[11px] leading-tight data-[state=active]:text-[#1a2e4a]">Proposta de passeios</TabsTrigger>
              <TabsTrigger value="final-itinerary" className="px-2 py-2 text-[11px] leading-tight data-[state=active]:text-[#1a2e4a]">Roteiro final</TabsTrigger>
            </TabsList>

            <TabsContent value="complete-budget" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="draft-label" className="text-xs font-semibold text-slate-600">Nome do rascunho</Label>
                <Input id="draft-label" value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} placeholder="Ex.: Orçamento — Santiago" />
                <Button type="button" className="w-full bg-[#1a2e4a] text-white hover:bg-[#243c62]" onClick={saveDraft} disabled={saveDraftMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveDraftMutation.isPending ? "Salvando..." : "Salvar orçamento de viagem (rascunho)"}
                </Button>
                <p className="text-[11px] leading-relaxed text-slate-500">Este tipo guarda as informações da viagem — cliente, voos, hotéis, tarifas e pagamentos. Propostas de passeios e roteiros finais aparecem nas abas ao lado.</p>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1a2e4a]"><FolderOpen className="h-4 w-4" /> Orçamentos de viagem salvos</div>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} placeholder="Buscar por cliente, destino ou nome" className="h-9 pl-8 text-xs" />
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[11px] font-semibold text-slate-600">Status:</span>
                  {([ ["all", "Todos"], ["pending", "Pendentes"], ["sent", "Enviados"], ["approved", "Aprovados"] ] as const).map(([status, label]) => (
                    <Button key={status} type="button" variant="outline" size="sm" onClick={() => setTravelBudgetStatusFilter(status)} className={`h-7 px-2.5 text-[10px] ${travelBudgetStatusFilter === status ? "border-[#1a2e4a] bg-[#1a2e4a] text-white hover:bg-[#243c62] hover:text-white" : "border-slate-300 bg-white text-slate-600 hover:border-[#1a2e4a] hover:text-[#1a2e4a]"}`}>{label}</Button>
                  ))}
                </div>
                {draftsQuery.isLoading ? (
                  <p className="text-xs text-slate-500">Carregando orçamentos de viagem...</p>
                ) : completeBudgetDrafts.length ? (
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {completeBudgetDrafts.map((draft) => (
                      <div key={draft.id} className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50">
                        <div className="min-w-0 flex-1">
                          {editingDraftId === draft.id ? <Input value={editingDraftLabel} onChange={(event) => setEditingDraftLabel(event.target.value)} className="h-8 text-xs" autoFocus /> : <span className="block truncate text-xs font-semibold text-[#1a2e4a]">{draft.label}</span>}
                          <span className="mt-1 block text-[10px] text-slate-500">{[draft.clientName && `Cliente: ${draft.clientName}`, draft.destination && `Destino: ${draft.destination}`].filter(Boolean).join(" • ") || "Cliente e destino não informados"}</span>
                          <span className="block text-[10px] text-slate-500">Atualizado em {new Date(draft.updatedAt).toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                          <select aria-label={`Status de ${draft.label}`} value={draft.status} onChange={(event) => updateBudgetDraftStatus(draft.id, event.target.value as Exclude<SavedTourProposalStatusFilter, "all">)} disabled={updateBudgetDraftStatusMutation.isPending} className="h-7 max-w-24 rounded-md border border-slate-300 bg-white px-1.5 text-[10px] text-slate-600 outline-none focus:border-[#1a2e4a]">
                            {SAVED_ITEM_STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                          </select>
                          {editingDraftId === draft.id ? <Button type="button" size="sm" className="h-7 bg-[#1a2e4a] px-2 text-[10px] text-white hover:bg-[#243c62]" onClick={renameDraft} disabled={renameDraftMutation.isPending}>Salvar</Button> : <><Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setSelectedDraftId(draft.id)}>Abrir</Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1a2e4a]" aria-label={`Renomear ${draft.label}`} onClick={() => { setEditingDraftId(draft.id); setEditingDraftLabel(draft.label); }}><Pencil className="h-3.5 w-3.5" /></Button></>}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${draft.label}`} onClick={() => deleteDraft(draft.id, draft.label)} disabled={deleteDraftMutation.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-500">{draftSearch || travelBudgetStatusFilter !== "all" ? "Nenhum orçamento de viagem encontrado com os filtros selecionados." : "Nenhum orçamento de viagem salvo ainda."}</p>}
              </div>
            </TabsContent>

            <TabsContent value="tour-proposal" className="mt-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1a2e4a]"><CalendarDays className="h-4 w-4" /> Propostas de passeios salvas</div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Abre somente a proposta de passeios no modo Proposta, sem confundir com o orçamento completo.</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input value={tourProposalSearch} onChange={(event) => setTourProposalSearch(event.target.value)} placeholder="Buscar por cliente, destino ou proposta" className="h-9 pl-8 text-xs" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-semibold text-slate-600">Status:</span>
                {([
                  ["all", "Todos"],
                  ["pending", "Pendentes"],
                  ["sent", "Enviadas"],
                  ["approved", "Aprovadas"],
                ] as const).map(([status, label]) => (
                  <Button
                    key={status}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTourProposalStatusFilter(status)}
                    className={`h-7 px-2.5 text-[10px] ${tourProposalStatusFilter === status ? "border-[#1a2e4a] bg-[#1a2e4a] text-white hover:bg-[#243c62] hover:text-white" : "border-slate-300 bg-white text-slate-600 hover:border-[#1a2e4a] hover:text-[#1a2e4a]"}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {tourProposalsQuery.isLoading ? (
                <p className="text-xs text-slate-500">Carregando propostas de passeios...</p>
              ) : filteredTourProposals.length ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {filteredTourProposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:border-amber-300 hover:bg-amber-50">
                        <div className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#1a2e4a]">{proposal.proposalTitle || "Proposta de passeios"}</span><span className="mt-1 block truncate text-[10px] text-slate-500">Cliente: {proposal.clientName}{proposal.destination ? ` • Destino: ${proposal.destination}` : ""}</span><span className="block text-[10px] text-slate-500">Atualizada em {new Date(proposal.updatedAt).toLocaleString("pt-BR")}</span></div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1"><select aria-label={`Status de ${proposal.proposalTitle}`} value={proposal.status} onChange={(event) => updateTourProposalStatus(proposal.id, event.target.value as Exclude<SavedTourProposalStatusFilter, "all">)} disabled={updateTourProposalStatusMutation.isPending} className="h-7 max-w-24 rounded-md border border-slate-300 bg-white px-1.5 text-[10px] text-slate-600 outline-none focus:border-[#1a2e4a]">{SAVED_ITEM_STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select><Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setSelectedTourProposalId(proposal.id)}>Abrir</Button></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-500">{tourProposalSearch || tourProposalStatusFilter !== "all" ? "Nenhuma proposta de passeios encontrada com os filtros selecionados." : "Nenhuma proposta de passeios salva ainda."}</p>}
            </TabsContent>

            <TabsContent value="final-itinerary" className="mt-4 space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1a2e4a]"><MapPinned className="h-4 w-4" /> Roteiros finais salvos</div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">Aqui aparecem os rascunhos completos que já possuem informações no Roteiro Final. Ao abrir, você segue direto para o modo Roteiro Final.</p>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input value={finalItineraryDraftSearch} onChange={(event) => setFinalItineraryDraftSearch(event.target.value)} placeholder="Buscar por cliente, destino ou nome" className="h-9 pl-8 text-xs" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-semibold text-slate-600">Status:</span>
                {([ ["all", "Todos"], ["pending", "Pendentes"], ["sent", "Enviados"], ["approved", "Aprovados"] ] as const).map(([status, label]) => (
                  <Button key={status} type="button" variant="outline" size="sm" onClick={() => setFinalItineraryStatusFilter(status)} className={`h-7 px-2.5 text-[10px] ${finalItineraryStatusFilter === status ? "border-[#1a2e4a] bg-[#1a2e4a] text-white hover:bg-[#243c62] hover:text-white" : "border-slate-300 bg-white text-slate-600 hover:border-[#1a2e4a] hover:text-[#1a2e4a]"}`}>{label}</Button>
                ))}
              </div>
              {finalItineraryDraftsQuery.isLoading ? (
                <p className="text-xs text-slate-500">Carregando roteiros finais...</p>
              ) : finalItineraryDrafts.length ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {finalItineraryDrafts.map((draft) => (
                    <div key={draft.id} className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50">
                      <div className="min-w-0 flex-1">
                        {editingDraftId === draft.id ? <Input value={editingDraftLabel} onChange={(event) => setEditingDraftLabel(event.target.value)} className="h-8 text-xs" autoFocus /> : <span className="block truncate text-xs font-semibold text-[#1a2e4a]">{draft.label}</span>}
                        <span className="mt-1 block text-[10px] text-slate-500">{[draft.clientName && `Cliente: ${draft.clientName}`, draft.destination && `Destino: ${draft.destination}`].filter(Boolean).join(" • ") || "Cliente e destino não informados"}</span>
                        <span className="block text-[10px] text-slate-500">Atualizado em {new Date(draft.updatedAt).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                        <select aria-label={`Status de ${draft.label}`} value={draft.status} onChange={(event) => updateBudgetDraftStatus(draft.id, event.target.value as Exclude<SavedTourProposalStatusFilter, "all">)} disabled={updateBudgetDraftStatusMutation.isPending} className="h-7 max-w-24 rounded-md border border-slate-300 bg-white px-1.5 text-[10px] text-slate-600 outline-none focus:border-[#1a2e4a]">
                          {SAVED_ITEM_STATUS_OPTIONS.map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                        </select>
                        {editingDraftId === draft.id ? <Button type="button" size="sm" className="h-7 bg-[#1a2e4a] px-2 text-[10px] text-white hover:bg-[#243c62]" onClick={renameDraft} disabled={renameDraftMutation.isPending}>Salvar</Button> : <><Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => { setSelectedDraftId(draft.id); setSideView("budget"); setActiveTab("itinerary"); setItineraryMode("final"); }}>Abrir</Button><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1a2e4a]" aria-label={`Renomear ${draft.label}`} onClick={() => { setEditingDraftId(draft.id); setEditingDraftLabel(draft.label); }}><Pencil className="h-3.5 w-3.5" /></Button></>}
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${draft.label}`} onClick={() => deleteDraft(draft.id, draft.label)} disabled={deleteDraftMutation.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-slate-500">{finalItineraryDraftSearch || finalItineraryStatusFilter !== "all" ? "Nenhum roteiro final encontrado com os filtros selecionados." : "Nenhum roteiro final salvo ainda."}</p>}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden w-48 shrink-0 flex-col border-r border-slate-200 bg-white p-3 lg:flex">
          <div className="mb-3 border-b border-slate-100 pb-3"><p className="text-xs font-bold text-[#1a2e4a]">Acesso rápido</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">Cadastros e atalhos do orçamento.</p></div>
          <div className="space-y-1">
            <Button type="button" variant="ghost" onClick={() => { setSideView("budget"); setActiveTab("trip"); }} className={`h-9 w-full justify-start px-2 text-xs ${sideView === "budget" && activeTab === "trip" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}><Users className="mr-2 h-4 w-4" />Orçamento</Button>
            <Button type="button" variant="ghost" onClick={() => { setSideView("clients"); }} className={`h-9 w-full justify-start px-2 text-xs ${sideView === "clients" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}><Users className="mr-2 h-4 w-4" />Clientes</Button>
            <Button type="button" variant="ghost" onClick={() => { setSideView("budget"); setActiveTab("hotels"); }} className={`h-9 w-full justify-start px-2 text-xs ${sideView === "budget" && activeTab === "hotels" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}><Building2 className="mr-2 h-4 w-4" />Hotéis</Button>
            <Button type="button" variant="ghost" onClick={() => setSideView("library")} className={`h-9 w-full justify-start px-2 text-xs ${sideView === "library" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}><FolderOpen className="mr-2 h-4 w-4" />Biblioteca</Button>
            <Button type="button" variant="ghost" onClick={openDrafts} className={`h-9 w-full justify-start px-2 text-xs ${sideView === "drafts" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}><Save className="mr-2 h-4 w-4" />Rascunhos</Button>
          </div>
          <div className="mt-auto rounded-md border border-blue-100 bg-blue-50 p-2.5 text-[11px] leading-relaxed text-[#1a2e4a]">A <strong>Biblioteca</strong> reúne hotéis, passeios, restaurantes e transfers por destino. A aba <strong>Roteiro</strong> continua dedicada às propostas e ao roteiro final.</div>
        </aside>
        {/* Left: Forms */}
        <div className={`${showPreview && sideView === "budget" ? "w-full md:w-1/2" : "w-full"} flex flex-col overflow-hidden border-r border-slate-200`}>
          <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 bg-white p-2 lg:hidden">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSideView("budget")} className={`h-10 shrink-0 px-3 text-xs ${sideView === "budget" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}>Orçamento</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSideView("clients")} className={`h-10 shrink-0 px-3 text-xs ${sideView === "clients" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}>Clientes</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSideView("library")} className={`h-10 shrink-0 px-3 text-xs ${sideView === "library" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}>Biblioteca</Button>
            <Button type="button" variant="ghost" size="sm" onClick={openDrafts} className={`h-10 shrink-0 px-3 text-xs ${sideView === "drafts" ? "bg-blue-50 font-semibold text-[#1a2e4a]" : "text-slate-600"}`}>Rascunhos</Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6">
              {sideView === "budget" && <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  <TabsList className="flex h-auto min-w-max w-full flex-nowrap gap-1.5 rounded-lg bg-slate-200 p-1.5">
                  <TabsTrigger value="trip" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Viagem
                  </TabsTrigger>
                  <TabsTrigger value="flights" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Plane className="h-4 w-4 mr-1.5" />
                    Voos
                  </TabsTrigger>
                  <TabsTrigger value="fares" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Tarifas
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Building2 className="h-4 w-4 mr-1.5" />
                    Hotéis
                  </TabsTrigger>
                  <TabsTrigger value="baggage" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Bagagens
                  </TabsTrigger>
                  <TabsTrigger value="installments" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Parcelamento
                  </TabsTrigger>
                  <TabsTrigger value="itinerary" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <CalendarDays className="h-4 w-4 mr-1.5" />
                    Roteiro
                  </TabsTrigger>
                  </TabsList>
                </div>

                <div className="mb-4 flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline" className="min-h-10 border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Limpar orçamento
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar orçamento de viagem?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação removerá os dados das abas Viagem, Voos, Tarifas, Hotéis, Bagagens e Parcelamento. A Proposta de passeios e o Roteiro final serão preservados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { clearBudgetOnly(); setBudgetLoadKey((currentKey) => currentKey + 1); setActiveTab("trip"); toast.success("Orçamento de viagem limpo."); }}>
                          Limpar orçamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <TabsContent value="trip" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Informações da Viagem
                    </h3>
                    <TripInfoForm />
                  </div>
                </TabsContent>

                <TabsContent value="flights" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Voos
                    </h3>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <FlightForm key={`flights-${budgetLoadKey}`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hotels" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Hotéis
                    </h3>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <HotelForm key={`hotels-${budgetLoadKey}`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="itinerary" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><h3 className="text-sm font-bold text-[#1a2e4a]" style={{ fontFamily: "Poppins, sans-serif" }}>{itineraryMode === "proposal" ? "Proposta de passeios" : "Roteiro final pós-aprovação"}</h3><p className="mt-1 text-xs text-slate-500">{itineraryMode === "proposal" ? "Cadastre e organize cada passeio diretamente no respectivo dia para enviar uma proposta de aprovação." : "Inclua chegada, transfer, hospedagem, voos, retorno e os passeios já aprovados."}</p></div>
                      <div className="inline-flex rounded-lg bg-slate-200 p-1"><Button type="button" size="sm" variant="ghost" onClick={() => setItineraryMode("proposal")} className={`h-8 text-xs ${itineraryMode === "proposal" ? "bg-white text-[#1a2e4a] shadow-sm" : "text-slate-600"}`}>Proposta</Button><Button type="button" size="sm" variant="ghost" onClick={() => setItineraryMode("final")} className={`h-8 text-xs ${itineraryMode === "final" ? "bg-white text-[#1a2e4a] shadow-sm" : "text-slate-600"}`}>Roteiro final</Button></div>
                    </div>
                    <div className="h-[calc(100dvh-14rem)] min-h-[36rem] space-y-6 overflow-y-auto overscroll-contain pb-16 pr-3 [scrollbar-gutter:stable]">
                      {itineraryMode === "proposal" ? <><section aria-labelledby="proposta-abertura">
                        <div className="mb-3 border-b border-slate-200 pb-3">
                          <h4 id="proposta-abertura" className="text-sm font-bold text-[#1a2e4a]">Abertura da proposta</h4>
                          <p className="mt-1 text-xs text-slate-500">Comece pela mensagem para a cliente, pela forma de pagamento e pela importação dos passeios.</p>
                        </div>
                        <ItineraryForm />
                      </section>
                      </> : <FinalItineraryForm />}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fares" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Tarifas
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Adicione quantas tarifas quiser com nomes customizáveis. Você pode destacar uma para que apaça em destaque no orçamento.
                    </p>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <FareForm key={`fares-${budgetLoadKey}`} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baggage" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Bagagens
                    </h3>
                    <BaggageForm key={`baggage-${budgetLoadKey}`} />
                  </div>
                </TabsContent>

                <TabsContent value="installments" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Parcelamento
                    </h3>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <InstallmentsForm key={`installments-${budgetLoadKey}`} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>}
              {sideView === "library" && <TravelLibraryPanel initiallyOpen />}
              {sideView === "clients" && <TravelClientsPanel onUseClient={(name) => { updateTripInfo("clientName", name); setSideView("budget"); setActiveTab("trip"); toast.success("Cliente aplicado ao orçamento atual."); }} />}
              {sideView === "drafts" && <TravelDraftsPanel
                currentDraftId={currentDraftId}
                draftLabel={draftLabel}
                onCurrentDraftIdChange={setCurrentDraftId}
                onDraftLabelChange={setDraftLabel}
                onOpenTravelBudget={(id) => { setSideView("budget"); setActiveTab("trip"); setSelectedDraftId(id); }}
                onOpenTourProposal={(id) => { setSideView("budget"); setActiveTab("itinerary"); setItineraryMode("proposal"); setSelectedTourProposalId(id); }}
                onOpenFinalItinerary={(id) => { setSideView("budget"); setActiveTab("itinerary"); setItineraryMode("final"); setSelectedDraftId(id); }}
              />}
            </div>
          </ScrollArea>
        </div>

        {/* Right: PDF Preview */}
        {showPreview && sideView === "budget" && (
          <div className="hidden w-1/2 flex-col overflow-hidden bg-slate-200 md:flex">
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {showingItinerary ? (showingFinalItinerary ? "Visualização do roteiro final" : "Visualização da proposta de passeios") : "Preview do PDF"}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {showingItinerary ? (showingFinalItinerary ? `${budget.finalItinerary.events.length} informação(ões) do roteiro` : `${budget.itinerary.length} dia(s) • ${budget.tours.length} passeio(s)`) : `${budget.flights.length} voo(s) • ${budget.hotels.length} hotel(is) • ${budget.fareComparison.tiers.length} tarifa(s)`}
                </span>
                {showingItinerary && (
                  <Button
                    size="sm"
                    onClick={async () => {
                        toast.loading(showingFinalItinerary ? "Gerando PDF do roteiro final..." : "Gerando PDF da proposta de passeios...", { id: "itinerary-pdf-gen" });
                        try {
                        await generatePdf(showingFinalItinerary ? "roteiro-final-bella-viagens.pdf" : "proposta-passeios-bella-viagens.pdf", showingFinalItinerary ? "final-itinerary-document" : "itinerary-document");
                        toast.success(showingFinalItinerary ? "PDF do roteiro final gerado! Verifique a pasta Downloads do seu computador." : "PDF da proposta de passeios gerado! Verifique a pasta Downloads do seu computador.", { id: "itinerary-pdf-gen" });
                      } catch (err) {
                        console.error("Itinerary PDF error:", err);
                        toast.error("Erro ao gerar o PDF do roteiro. Tente novamente.", { id: "itinerary-pdf-gen" });
                      }
                    }}
                    className="h-8 bg-[#1a2e4a] px-3 text-xs text-white hover:bg-[#243d61]"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {showingFinalItinerary ? "Gerar PDF do Roteiro" : "Gerar PDF da Proposta"}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 flex justify-center">
                <div className="shadow-2xl w-full max-w-2xl">
                  {showingItinerary ? (showingFinalItinerary ? <FinalItineraryPreview data={budget} /> : <ItineraryPreview data={budget} />) : <PdfPreview data={budget} includeAirfare={includeAirfare} includeHotel={includeHotel} />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <BudgetProvider>
      <BuilderContent />
    </BudgetProvider>
  );
}
