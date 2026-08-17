import { getItineraryDayActivities, useBudget } from "@/contexts/BudgetContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, ChevronDown, ChevronUp, Copy, FilePlus2, FolderOpen, GripVertical, Link2, Loader2, Plus, Save, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { createEmptyGastronomySearchDraft } from "./itineraryFormState";

export function ItineraryForm() {
  const { budget, addGastronomyToDay, addGastronomyToUsefulTips, addItineraryDay, addItineraryActivity, importItineraryFromQuotation, moveItineraryActivity, removeGastronomyOption, removeItineraryActivity, reorderItineraryActivities, replaceBudget, resetTourProposal, saveGastronomyOption, updateItineraryActivity, updateTour, updateTourProposal, updateItineraryDay, removeItineraryDay, reorderItineraryDays } = useBudget();
  const itinerary = budget.itinerary;
  const [quotationUrl, setQuotationUrl] = useState("");
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<string | null>(null);
  const knownDayIdsRef = useRef<Set<string>>(new Set(itinerary.map((day) => day.id)));
  const [collapsedDayIds, setCollapsedDayIds] = useState<Set<string>>(
    () => new Set(itinerary.map((day) => day.id)),
  );
  const importQuotationMutation = trpc.importQuotationUrl.useMutation();
  const utils = trpc.useUtils();
  const saveProposalMutation = trpc.tourProposals.save.useMutation();
  const duplicateProposalMutation = trpc.tourProposals.duplicate.useMutation();
  const updateProposalStatusMutation = trpc.tourProposals.updateStatus.useMutation();
  const [savedProposalSearch, setSavedProposalSearch] = useState("");
  const savedProposalQueryInput = useMemo(
    () => ({ search: savedProposalSearch.trim() || undefined }),
    [savedProposalSearch],
  );
  const savedProposalsQuery = trpc.tourProposals.list.useQuery(savedProposalQueryInput);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [gastronomyName, setGastronomyName] = useState("");
  const [gastronomyLocation, setGastronomyLocation] = useState("");
  const [gastronomyTargetDays, setGastronomyTargetDays] = useState<Record<string, string>>({});
  const gastronomySearchInput = useMemo(
    () => ({ name: gastronomyName.trim() || "—", location: gastronomyLocation.trim() || "—" }),
    [gastronomyLocation, gastronomyName],
  );
  const gastronomySearchQuery = trpc.gastronomy.search.useQuery(gastronomySearchInput, { enabled: false, retry: false });
  const selectedProposalQuery = trpc.tourProposals.get.useQuery(
    { id: selectedProposalId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedProposalId) },
  );

  const handleGastronomySearch = async () => {
    if (gastronomyName.trim().length < 2 || gastronomyLocation.trim().length < 2) {
      toast.error("Informe o nome do local e a cidade ou região para pesquisar.");
      return;
    }

    try {
      const response = await gastronomySearchQuery.refetch();
      if (!response.data?.results.length) toast.message("Nenhum local foi encontrado. Confira o nome e a região.");
    } catch (error) {
      console.error("Gastronomy search error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível pesquisar este local agora.");
    }
  };

  const saveSearchedGastronomy = (result: NonNullable<typeof gastronomySearchQuery.data>["results"][number]) => {
    saveGastronomyOption(result);
    toast.success(`${result.name} foi salvo como opção gastronômica.`);
  };

  const handleSaveProposal = async () => {
    const clientName = budget.tourProposal.clientName?.trim();
    if (!clientName) {
      toast.error("Informe o nome do cliente antes de salvar a proposta.");
      return;
    }

    try {
      await saveProposalMutation.mutateAsync({
        clientName,
        proposalTitle: budget.tourProposal.title.trim() || "Proposta de passeios",
        snapshot: JSON.stringify(budget),
      });
      await utils.tourProposals.list.invalidate();
      toast.success(`Proposta de ${clientName} salva com sucesso.`);
    } catch (error) {
      console.error("Save tour proposal error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a proposta.");
    }
  };

  const handleLoadProposal = (id: string) => setSelectedProposalId(id);

  const handleDuplicateProposal = async (id: string) => {
    try {
      const duplicated = await duplicateProposalMutation.mutateAsync({ id });
      await utils.tourProposals.list.invalidate();
      handleLoadProposal(duplicated.id);
      toast.success("Proposta duplicada. Edite os dados da cópia antes de enviar.");
    } catch (error) {
      console.error("Duplicate tour proposal error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível duplicar a proposta.");
    }
  };

  const handleProposalStatus = async (id: string, status: "pending" | "sent" | "approved") => {
    try {
      await updateProposalStatusMutation.mutateAsync({ id, status });
      await utils.tourProposals.list.invalidate();
      toast.success("Status da proposta atualizado.");
    } catch (error) {
      console.error("Update proposal status error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    }
  };

  useEffect(() => {
    if (!selectedProposalQuery.data || !selectedProposalId) return;
    const saved = selectedProposalQuery.data;
    try {
      const restored = JSON.parse(saved.snapshot);
      if (!restored || typeof restored !== "object" || !Array.isArray(restored.tours) || !Array.isArray(restored.itinerary)) {
        throw new Error("O arquivo salvo desta proposta está inválido.");
      }
      replaceBudget(restored);
      setCollapsedDayIds(new Set(restored.itinerary.map((day: { id: string }) => day.id)));
      knownDayIdsRef.current = new Set(restored.itinerary.map((day: { id: string }) => day.id));
      toast.success(`Proposta de ${saved.clientName} carregada.`);
    } catch (error) {
      console.error("Load tour proposal error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar a proposta.");
    } finally {
      setSelectedProposalId(null);
    }
  }, [replaceBudget, selectedProposalId, selectedProposalQuery.data]);

  useEffect(() => {
    const addedDayIds = itinerary
      .map((day) => day.id)
      .filter((dayId) => !knownDayIdsRef.current.has(dayId));
    if (addedDayIds.length === 0) return;

    addedDayIds.forEach((dayId) => knownDayIdsRef.current.add(dayId));
    setCollapsedDayIds((current) => new Set(Array.from(current).concat(addedDayIds)));
  }, [itinerary]);

  const handleQuotationImport = async () => {
    const normalizedUrl = quotationUrl.trim();
    if (!normalizedUrl) {
      toast.error("Cole o link da cotação para importar o roteiro.");
      return;
    }

    try {
      const result = await importQuotationMutation.mutateAsync({ url: normalizedUrl });
      importItineraryFromQuotation(result.activities, normalizedUrl);
      const total = result.activities.length;
      toast.success(`${total} ${total === 1 ? "passeio foi organizado" : "passeios foram organizados"} por data, com os detalhes e fotos disponíveis.`);
      setQuotationUrl("");
    } catch (error) {
      console.error("Quotation itinerary import error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível importar esta cotação. Tente novamente.");
    }
  };

  const handleDayDrop = (targetDayId: string) => {
    if (!draggedDayId || draggedDayId === targetDayId) return;
    const sourceIndex = itinerary.findIndex((day) => day.id === draggedDayId);
    const targetIndex = itinerary.findIndex((day) => day.id === targetDayId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextDays = [...itinerary];
    const [movedDay] = nextDays.splice(sourceIndex, 1);
    nextDays.splice(targetIndex, 0, movedDay);
    reorderItineraryDays(nextDays);
  };

  const toggleDayCollapsed = (dayId: string) => {
    setCollapsedDayIds((current) => {
      const next = new Set(current);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const handleNewProposal = () => {
    if (!window.confirm("Iniciar uma nova proposta? Os passeios, dias e dados da proposta atual serão limpos. O Roteiro Final e as propostas salvas permanecerão preservados.")) return;
    resetTourProposal();
    setCollapsedDayIds(new Set());
    knownDayIdsRef.current = new Set();
    setQuotationUrl("");
    const emptyGastronomySearch = createEmptyGastronomySearchDraft();
    setGastronomyName(emptyGastronomySearch.name);
    setGastronomyLocation(emptyGastronomySearch.location);
    setGastronomyTargetDays(emptyGastronomySearch.targetDays);
    toast.success("Nova proposta iniciada. O Roteiro Final e as propostas salvas foram preservados.");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#1a2e4a]">
        Esta é a proposta de passeios para aprovação. Ela tem visualização e PDF próprios e não altera o orçamento principal. Após a aprovação, esta mesma aba receberá os dados práticos do roteiro final.
      </div>

      <div className="rounded-lg border border-[#1a2e4a]/15 bg-blue-50/60 p-3">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#1a2e4a]">Abertura e pagamento da proposta</h4>
            <p className="mt-1 text-xs text-slate-500">Essas informações aparecem antes e depois dos passeios no documento de aprovação.</p>
          </div>
          <Button type="button" variant="outline" onClick={handleNewProposal} className="h-9 shrink-0 bg-white text-xs font-bold"><FilePlus2 className="mr-1.5 h-4 w-4" />Nova proposta</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="proposal-client">Cliente</Label><Input id="proposal-client" value={budget.tourProposal.clientName || ""} onChange={(event) => updateTourProposal({ clientName: event.target.value })} placeholder="Ex.: Suelen Vieira" className="mt-1 bg-white" /></div>
          <div><Label htmlFor="proposal-title">Título da proposta</Label><Input id="proposal-title" value={budget.tourProposal.title} onChange={(event) => updateTourProposal({ title: event.target.value })} placeholder="Ex.: Passeios em Santiago" className="mt-1 bg-white" /></div>
          <div className="sm:col-span-2"><Label htmlFor="proposal-intro">Mensagem inicial</Label><Textarea id="proposal-intro" value={budget.tourProposal.introMessage} onChange={(event) => updateTourProposal({ introMessage: event.target.value })} placeholder="Ex.: Olá, Suelen! Preparamos estas opções de passeios para a sua viagem..." className="mt-1 min-h-16 bg-white" /></div>
	          <div><Label htmlFor="proposal-installments">Parcelamento</Label><Select value={String(budget.tourProposal.installments || 1)} onValueChange={(value) => updateTourProposal({ installments: Number(value) })}><SelectTrigger id="proposal-installments" className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">À vista</SelectItem><SelectItem value="2">2x</SelectItem><SelectItem value="3">3x</SelectItem><SelectItem value="4">4x</SelectItem><SelectItem value="5">5x</SelectItem><SelectItem value="6">6x</SelectItem><SelectItem value="8">8x</SelectItem><SelectItem value="10">10x</SelectItem><SelectItem value="12">12x</SelectItem></SelectContent></Select></div>
	          <div><Label htmlFor="proposal-payment">Forma de pagamento</Label><Textarea id="proposal-payment" value={budget.tourProposal.paymentDetails} onChange={(event) => updateTourProposal({ paymentDetails: event.target.value })} placeholder="Ex.: PIX, cartão ou condições combinadas" className="mt-1 min-h-16 bg-white" /></div>
	          <div><Label htmlFor="proposal-summary-font">Fonte do resumo da capa</Label><Select value={budget.tourProposal.coverSummaryFontSize || "medium"} onValueChange={(value) => updateTourProposal({ coverSummaryFontSize: value as "small" | "medium" | "large" })}><SelectTrigger id="proposal-summary-font" className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="small">Compacta</SelectItem><SelectItem value="medium">Padrão</SelectItem><SelectItem value="large">Maior</SelectItem></SelectContent></Select></div>
	          {itinerary.length > 6 && (() => {
	            const defaultDayIds = itinerary.slice(0, 6).map((day) => day.id);
	            const selectedDayIds = budget.tourProposal.coverSummaryDayIds || defaultDayIds;
	            return <div className="sm:col-span-2 rounded-md border border-slate-200 bg-white p-3">
	              <p className="text-xs font-bold text-[#1a2e4a]">Dias exibidos no resumo da capa</p>
	              <p className="mt-0.5 text-[11px] text-slate-500">Escolha até seis dias. Os seis primeiros ficam selecionados por padrão.</p>
	              <div className="mt-2 grid gap-2 sm:grid-cols-3">
	                {itinerary.map((day) => {
	                  const selected = selectedDayIds.includes(day.id);
	                  const selectionLimitReached = !selected && selectedDayIds.length >= 6;
	                  return <label key={day.id} className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2 text-xs font-semibold ${selected ? "border-amber-300 bg-amber-50 text-[#1a2e4a]" : "border-slate-200 text-slate-600"} ${selectionLimitReached ? "cursor-not-allowed opacity-50" : ""}`}>
	                    <input type="checkbox" checked={selected} disabled={selectionLimitReached} onChange={() => updateTourProposal({ coverSummaryDayIds: selected ? selectedDayIds.filter((id) => id !== day.id) : [...selectedDayIds, day.id] })} className="h-3.5 w-3.5 accent-[#1a2e4a]" />
	                    Dia {day.day}{day.date ? ` • ${day.date}` : ""}
	                  </label>;
	                })}
	              </div>
	            </div>;
	          })()}
	          <div className="sm:col-span-2 rounded-md border border-slate-200 bg-white p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="button" onClick={handleSaveProposal} disabled={saveProposalMutation.isPending} className="h-10 font-bold"><Save className="mr-2 h-4 w-4" />{saveProposalMutation.isPending ? "Salvando..." : "Salvar proposta"}</Button>
            <Select onValueChange={handleLoadProposal} disabled={savedProposalsQuery.isLoading || selectedProposalQuery.isFetching}>
              <SelectTrigger className="h-10 flex-1"><FolderOpen className="mr-2 h-4 w-4" /><SelectValue placeholder={savedProposalsQuery.isLoading ? "Carregando propostas..." : "Abrir proposta já salva"} /></SelectTrigger>
              <SelectContent>{(savedProposalsQuery.data || []).map((saved) => <SelectItem key={saved.id} value={saved.id}>{saved.clientName} — {saved.proposalTitle}</SelectItem>)}</SelectContent>
            </Select>
            </div>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={savedProposalSearch} onChange={(event) => setSavedProposalSearch(event.target.value)} placeholder="Buscar proposta pelo nome do cliente" className="h-9 bg-slate-50 pl-8 text-sm" />
            </div>
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
              {(savedProposalsQuery.data || []).map((saved) => (
                <div key={saved.id} className="flex flex-col gap-2 rounded-md border border-slate-100 px-2.5 py-2 sm:flex-row sm:items-center">
                  <button type="button" onClick={() => handleLoadProposal(saved.id)} className="min-w-0 flex-1 text-left" title="Abrir proposta">
                    <span className="block truncate text-xs font-bold text-[#1a2e4a]">{saved.clientName}</span>
                    <span className="block truncate text-[11px] text-slate-500">{saved.proposalTitle}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Select value={saved.status} onValueChange={(status: "pending" | "sent" | "approved") => handleProposalStatus(saved.id, status)} disabled={updateProposalStatusMutation.isPending}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="sent">Enviada</SelectItem><SelectItem value="approved">Aprovada</SelectItem></SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleDuplicateProposal(saved.id)} disabled={duplicateProposalMutation.isPending} title="Duplicar proposta"><Copy className="mr-1 h-3.5 w-3.5" />Duplicar</Button>
                  </div>
                </div>
              ))}
              {!savedProposalsQuery.isLoading && (savedProposalsQuery.data || []).length === 0 && <p className="px-1 py-2 text-xs text-slate-500">Nenhuma proposta encontrada.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1a2e4a]">
          <Link2 className="h-4 w-4" /> Importar roteiro por link
        </div>
        <Label htmlFor="quotation-url" className="text-xs">Cole o link da cotação</Label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <Input
            id="quotation-url"
            type="url"
            value={quotationUrl}
            onChange={(event) => setQuotationUrl(event.target.value)}
            placeholder="https://.../quotations/..."
            className="bg-white"
          />
          <Button
            type="button"
            onClick={handleQuotationImport}
            disabled={!quotationUrl.trim() || importQuotationMutation.isPending}
            className="h-10 shrink-0 font-bold"
          >
            {importQuotationMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
            {importQuotationMutation.isPending ? "Importando..." : "Importar roteiro"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Os passeios identificados serão cadastrados e organizados cronologicamente pelos dias indicados na cotação.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1a2e4a]"><UtensilsCrossed className="h-4 w-4" /> Opções gastronômicas</div>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">Informe o nome e a região do restaurante. A busca retorna dados de localização para você validar antes de usar no roteiro.</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={gastronomyName} onChange={(event) => setGastronomyName(event.target.value)} placeholder="Nome do restaurante ou local" className="bg-white" />
          <Input value={gastronomyLocation} onChange={(event) => setGastronomyLocation(event.target.value)} placeholder="Cidade ou região" className="bg-white" />
          <Button type="button" onClick={handleGastronomySearch} disabled={gastronomySearchQuery.isFetching} className="h-10 font-bold">
            {gastronomySearchQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Pesquisar
          </Button>
        </div>

        {gastronomySearchQuery.data?.results.length ? <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-[#1a2e4a]">Resultados encontrados — valide antes de salvar:</p>
          {gastronomySearchQuery.data.results.map((result) => <div key={result.id} className="flex flex-col gap-2 rounded-md border border-amber-100 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between">
            {result.photoUrl && <img src={result.photoUrl} alt={`Foto de ${result.name}`} className="h-14 w-full rounded-md border border-slate-100 object-cover sm:w-20" />}
            <div className="min-w-0"><p className="text-sm font-bold text-[#1a2e4a]">{result.name}</p><p className="text-xs text-slate-600">{result.description || result.address}</p></div>
            <Button type="button" variant="outline" size="sm" onClick={() => saveSearchedGastronomy(result)} className="shrink-0 bg-white text-xs font-bold">Validar e salvar</Button>
          </div>)}
        </div> : null}

        {(budget.gastronomyOptions || []).length ? <div className="mt-3 border-t border-amber-200 pt-3">
          <p className="mb-2 text-xs font-semibold text-[#1a2e4a]">Opções validadas</p>
          <div className="space-y-2">{(budget.gastronomyOptions || []).map((option) => <div key={option.id} className="rounded-md border border-amber-100 bg-white p-2.5">
            {option.photoUrl && <img src={option.photoUrl} alt={`Foto de ${option.name}`} className="mb-2 h-24 w-full rounded-md border border-slate-100 object-cover sm:hidden" />}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-bold text-[#1a2e4a]">{option.name}</p><p className="text-xs text-slate-600">{option.description || option.address}</p></div><div className="flex flex-wrap items-center gap-1"><Button type="button" variant="outline" size="sm" asChild className="h-8 bg-white px-2 text-xs"><a href={option.mapsUrl} target="_blank" rel="noreferrer">Ver endereço</a></Button>{option.website && <Button type="button" variant="outline" size="sm" asChild className="h-8 bg-white px-2 text-xs"><a href={option.website} target="_blank" rel="noreferrer">Site / fotos</a></Button>}<Button type="button" variant="outline" size="sm" className="h-8 border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => removeGastronomyOption(option.id)} title={`Excluir ${option.name}`} aria-label={`Excluir restaurante ${option.name}`}><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div></div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row"><Select value={gastronomyTargetDays[option.id] || "none"} onValueChange={(dayId) => setGastronomyTargetDays((current) => ({ ...current, [option.id]: dayId }))}><SelectTrigger className="h-8 flex-1 bg-slate-50 text-xs"><SelectValue placeholder="Escolher dia para incluir" /></SelectTrigger><SelectContent><SelectItem value="none">Escolher dia para incluir</SelectItem>{itinerary.map((day) => <SelectItem key={day.id} value={day.id}>Dia {day.day} — {day.title || "Dia livre"}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" disabled={!gastronomyTargetDays[option.id] || gastronomyTargetDays[option.id] === "none"} onClick={() => { addGastronomyToDay(gastronomyTargetDays[option.id], option.id); toast.success(`${option.name} foi incluído na agenda do dia.`); }} className="h-8 bg-white text-xs font-semibold">Incluir no dia</Button><Button type="button" variant="outline" size="sm" onClick={() => { addGastronomyToUsefulTips(option.id); toast.success(`${option.name} foi incluído nas Dicas e Links Úteis.`); }} className="h-8 bg-white text-xs font-semibold">Enviar para dicas</Button></div>
          </div>)}</div>
        </div> : null}
      </div>

      {itinerary.map((day) => {
        const activities = getItineraryDayActivities(day);
        const firstTourActivity = activities.find((activity) => activity.tourId);
        const tour = firstTourActivity?.tourId ? budget.tours.find((currentTour) => currentTour.id === firstTourActivity.tourId) : undefined;
        const isCollapsed = collapsedDayIds.has(day.id);
        const quickValue = tour?.pricingMode === "perPerson" ? tour.pricePerPerson || 0 : tour?.totalPrice || 0;
        const valueLabel = tour?.pricingMode === "perPerson" ? "Valor adulto" : "Valor total";

        return <div
          key={day.id}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (draggedDayId && draggedDayId !== day.id) setDragOverDayId(day.id);
          }}
          onDragLeave={() => {
            if (dragOverDayId === day.id) setDragOverDayId(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleDayDrop(day.id);
            setDraggedDayId(null);
            setDragOverDayId(null);
          }}
          className={`rounded-lg border bg-slate-50 p-4 transition-colors ${
            dragOverDayId === day.id ? "border-[#1a2e4a] bg-blue-50" : "border-slate-200"
          }`}
        >
          <div className={`${isCollapsed ? "mb-0" : "mb-3"} flex items-center justify-between gap-2`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", day.id);
                  setDraggedDayId(day.id);
                }}
                onDragEnd={() => {
                  setDraggedDayId(null);
                  setDragOverDayId(null);
                }}
                className="flex h-8 w-5 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-white hover:text-[#1a2e4a] active:cursor-grabbing"
                title="Arraste para reordenar"
                aria-label={`Arrastar Dia ${day.day} para reordenar`}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{day.day}</div><span className="max-w-40 truncate text-sm font-bold text-[#1a2e4a]">Dia {day.day} — {day.title || "Dia livre"}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleDayCollapsed(day.id)} className="h-8 px-2 text-xs font-semibold text-[#1a2e4a] hover:bg-white" title={isCollapsed ? "Abrir edição" : "Recolher edição"}>{isCollapsed ? <><ChevronDown className="mr-1 h-4 w-4" />Abrir</> : <><ChevronUp className="mr-1 h-4 w-4" />Recolher</>}</Button>
              <Button variant="ghost" size="sm" onClick={() => removeItineraryDay(day.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title={`Remover dia ${day.day}`}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          {isCollapsed && tour && <div className="mb-3 flex max-w-xs items-end gap-2"><div className="flex-1"><Label className="text-xs">{valueLabel} (R$)</Label><Input type="number" min="0" step="0.01" inputMode="decimal" value={quickValue} onChange={(event) => updateTour(tour.id, { ...tour, [tour.pricingMode === "perPerson" ? "pricePerPerson" : "totalPrice"]: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 h-9 bg-white text-sm font-semibold" /></div>{tour.pricingMode === "perPerson" && <span className="pb-2 text-xs text-slate-500">por adulto</span>}</div>}
          {!isCollapsed && <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Título do dia</Label><Input value={day.title} onChange={(event) => updateItineraryDay(day.id, { title: event.target.value })} placeholder="Ex.: Chegada em Santiago" className="mt-1 bg-white" /></div>
              <div><Label>Observações gerais do dia</Label><Textarea value={day.notes} onChange={(event) => updateItineraryDay(day.id, { notes: event.target.value })} placeholder="Ex.: Levar documento e chegar cedo" className="mt-1 min-h-20 bg-white" /></div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-bold text-[#1a2e4a]">Agenda do dia</p><p className="text-xs text-slate-500">Inclua voo, passeio, jantar e outros compromissos na sequência desejada.</p></div>
                <Button type="button" variant="outline" size="sm" onClick={() => addItineraryActivity(day.id)} className="h-9 bg-white text-xs font-bold"><Plus className="mr-1.5 h-4 w-4" />Adicionar compromisso</Button>
              </div>

                <div className="mb-3 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-relaxed text-[#1a2e4a]">
                <strong>Organização da agenda:</strong> a sequência abaixo será exibida exatamente assim na prévia e no PDF. Use <strong>Subir</strong> e <strong>Descer</strong> para reorganizar o dia ou <strong>Mover para outro dia</strong> para transferir um compromisso completo para a agenda desejada.
              </div>

              <div className="space-y-3">
                {activities.map((activity, activityIndex) => {
                  const selectedTour = activity.tourId ? budget.tours.find((currentTour) => currentTour.id === activity.tourId) : undefined;
                  const selectedFlight = activity.flightId ? budget.flights.find((currentFlight) => currentFlight.id === activity.flightId) : undefined;
                  return <div key={activity.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-2"><span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1a2e4a] px-1 text-[11px] font-bold text-white">{activityIndex + 1}</span><p className="text-xs font-bold uppercase tracking-wide text-[#1a2e4a]">Ordem do compromisso</p></div><div className="flex flex-wrap items-center gap-1"><Select disabled={itinerary.length < 2} onValueChange={(targetDayId) => { const targetDay = itinerary.find((currentDay) => currentDay.id === targetDayId); moveItineraryActivity(day.id, activity.id, targetDayId); toast.success(`${activity.title || "Compromisso"} movido para Dia ${targetDay?.day || ""}.`); }}><SelectTrigger className="h-7 w-44 bg-white text-xs font-semibold"><SelectValue placeholder="Mover para outro dia" /></SelectTrigger><SelectContent>{itinerary.filter((currentDay) => currentDay.id !== day.id).map((currentDay) => <SelectItem key={currentDay.id} value={currentDay.id}>Dia {currentDay.day} — {currentDay.title || "Dia livre"}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="h-7 bg-white px-2 text-xs font-semibold" disabled={activityIndex === 0} onClick={() => { const next = [...activities]; [next[activityIndex - 1], next[activityIndex]] = [next[activityIndex], next[activityIndex - 1]]; reorderItineraryActivities(day.id, next); }} title="Mover este compromisso uma posição acima">Subir</Button><Button type="button" variant="outline" size="sm" className="h-7 bg-white px-2 text-xs font-semibold" disabled={activityIndex === activities.length - 1} onClick={() => { const next = [...activities]; [next[activityIndex], next[activityIndex + 1]] = [next[activityIndex + 1], next[activityIndex]]; reorderItineraryActivities(day.id, next); }} title="Mover este compromisso uma posição abaixo">Descer</Button><Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => removeItineraryActivity(day.id, activity.id)} title="Remover compromisso"><Trash2 className="h-3.5 w-3.5" /></Button></div></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><Label>Tipo</Label><Select value={activity.kind} onValueChange={(kind: "tour" | "flight" | "meal" | "custom") => updateItineraryActivity(day.id, activity.id, { kind })}><SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flight">Voo / chegada</SelectItem><SelectItem value="tour">Passeio</SelectItem><SelectItem value="meal">Jantar / refeição</SelectItem><SelectItem value="custom">Outro compromisso</SelectItem></SelectContent></Select></div>
                      <div><Label>Horário</Label><Input type="time" value={activity.time} onChange={(event) => updateItineraryActivity(day.id, activity.id, { time: event.target.value })} className="mt-1 bg-white" /></div>
                      {activity.kind === "tour" && <div className="sm:col-span-2"><Label>Vincular passeio cadastrado</Label><Select value={activity.tourId || "none"} onValueChange={(tourId) => { const nextTour = tourId === "none" ? undefined : budget.tours.find((currentTour) => currentTour.id === tourId); updateItineraryActivity(day.id, activity.id, { tourId: nextTour?.id, title: nextTour?.name || activity.title, description: nextTour?.description || activity.description, linkUrl: nextTour?.pageUrl || activity.linkUrl, photoUrl: nextTour?.photosUrl || activity.photoUrl }); }}><SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Escolher passeio" /></SelectTrigger><SelectContent><SelectItem value="none">Preencher manualmente</SelectItem>{budget.tours.map((currentTour) => <SelectItem key={currentTour.id} value={currentTour.id}>{currentTour.name}</SelectItem>)}</SelectContent></Select></div>}
                      {activity.kind === "flight" && <div className="sm:col-span-2"><Label>Vincular voo cadastrado</Label><Select value={activity.flightId || "none"} onValueChange={(flightId) => { const nextFlight = flightId === "none" ? undefined : budget.flights.find((currentFlight) => currentFlight.id === flightId); const segment = nextFlight?.segments[0]; updateItineraryActivity(day.id, activity.id, { flightId: nextFlight?.id, title: nextFlight ? (nextFlight.type === "ida" ? "Voo de ida" : "Voo de retorno") : activity.title, time: segment?.departureTime || activity.time, description: nextFlight ? [segment?.airline, segment?.flightNumber, segment?.departureCity || segment?.departureAirport, segment?.arrivalCity || segment?.arrivalAirport].filter(Boolean).join(" • ") : activity.description }); }}><SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Escolher voo" /></SelectTrigger><SelectContent><SelectItem value="none">Preencher manualmente</SelectItem>{budget.flights.map((currentFlight) => <SelectItem key={currentFlight.id} value={currentFlight.id}>{currentFlight.type === "ida" ? "Voo de ida" : "Voo de retorno"}{currentFlight.segments[0]?.airline ? ` — ${currentFlight.segments[0].airline}` : ""}</SelectItem>)}</SelectContent></Select></div>}
                      <div className="sm:col-span-2"><Label>Título</Label><Input value={activity.title} onChange={(event) => updateItineraryActivity(day.id, activity.id, { title: event.target.value })} placeholder="Ex.: Chegada no hotel, passeio ou jantar" className="mt-1 bg-white" /></div>
                      <div className="sm:col-span-2"><Label>Detalhes</Label><Textarea value={activity.description} onChange={(event) => updateItineraryActivity(day.id, activity.id, { description: event.target.value })} placeholder="Horário, ponto de encontro, transfer ou demais orientações" className="mt-1 min-h-16 bg-white" /></div>
                      <div><Label>Link útil</Label><Input type="url" value={activity.linkUrl} onChange={(event) => updateItineraryActivity(day.id, activity.id, { linkUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
                      <div><Label>Link de foto</Label><Input type="url" value={activity.photoUrl} onChange={(event) => updateItineraryActivity(day.id, activity.id, { photoUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
                      <div className="sm:col-span-2"><Label>Link para compra de ingresso</Label><Input type="url" value={activity.ticketUrl || ""} onChange={(event) => updateItineraryActivity(day.id, activity.id, { ticketUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
                      <div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3"><Label className="text-amber-900">Observação importante</Label><Textarea value={activity.importantNotes || ""} onChange={(event) => updateItineraryActivity(day.id, activity.id, { importantNotes: event.target.value })} placeholder="Ex.: comprar ingresso com antecedência, levar documento ou chegar 15 minutos antes." className="mt-1 min-h-16 border-amber-200 bg-white" /><p className="mt-1.5 text-[11px] text-amber-800">Essa mensagem aparecerá destacada em amarelo na proposta e no PDF.</p></div>
                    </div>
                    {(selectedTour || selectedFlight) && <p className="mt-2 text-[11px] text-slate-500">Dados vinculados ao {selectedTour ? "passeio" : "voo"} cadastrado. Você pode complementar os detalhes acima.</p>}
                  </div>;
                })}
              </div>
            </div>
          </div>}
        </div>;
      })}

      {itinerary.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"><CalendarDays className="mx-auto mb-2 h-5 w-5 text-slate-400" />Ainda não há dias no roteiro. Comece adicionando o primeiro dia.</div>}
      <Button variant="outline" onClick={addItineraryDay} className="h-12 w-full text-base font-bold shadow-md"><Plus className="mr-2 h-5 w-5" />Adicionar dia ao roteiro</Button>
    </div>
  );
}
