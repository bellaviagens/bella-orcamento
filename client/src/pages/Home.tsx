import { useEffect, useState } from "react";
import { BudgetProvider, useBudget } from "@/contexts/BudgetContext";
import { TripInfoForm } from "@/components/forms/TripInfoForm";
import { FlightForm } from "@/components/forms/FlightForm";
import { HotelForm } from "@/components/forms/HotelForm";
import { TourForm } from "@/components/forms/TourForm";
import { ItineraryForm } from "@/components/forms/ItineraryForm";
import { FinalItineraryForm } from "@/components/forms/FinalItineraryForm";
import { FareForm } from "@/components/forms/FareForm";
import { BaggageForm } from "@/components/forms/BaggageForm";
import { InstallmentsForm } from "@/components/forms/InstallmentsForm";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ItineraryPreview } from "@/components/itinerary/ItineraryPreview";
import { FinalItineraryPreview } from "@/components/itinerary/FinalItineraryPreview";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plane, Building2, Settings, FileText, Download, Eye, EyeOff, CalendarDays, MapPinned, FolderOpen, Save, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function BuilderContent() {
  const { budget, replaceBudget } = useBudget();
  const { generatePdf } = usePdfGenerator();
  const utils = trpc.useUtils();
  const [showPreview, setShowPreview] = useState(true);
  const [includeAirfare, setIncludeAirfare] = useState(true);
  const [includeHotel, setIncludeHotel] = useState(true);
  const [activeTab, setActiveTab] = useState("trip");
  const [itineraryMode, setItineraryMode] = useState<"proposal" | "final">("proposal");
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [draftSearch, setDraftSearch] = useState("");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingDraftLabel, setEditingDraftLabel] = useState("");
  const draftsQuery = trpc.budgetDrafts.list.useQuery({ search: draftSearch });
  const selectedDraftQuery = trpc.budgetDrafts.get.useQuery(
    { id: selectedDraftId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedDraftId) },
  );
  const saveDraftMutation = trpc.budgetDrafts.save.useMutation();
  const renameDraftMutation = trpc.budgetDrafts.rename.useMutation();
  const deleteDraftMutation = trpc.budgetDrafts.delete.useMutation();
  const showingItinerary = activeTab === "itinerary";
  const showingFinalItinerary = showingItinerary && itineraryMode === "final";

  useEffect(() => {
    if (!selectedDraftId || !selectedDraftQuery.data) return;
    try {
      replaceBudget(JSON.parse(selectedDraftQuery.data.snapshot));
      setCurrentDraftId(selectedDraftQuery.data.id);
      setDraftLabel(selectedDraftQuery.data.label);
      setSelectedDraftId(null);
      setDraftDialogOpen(false);
      toast.success("Rascunho aberto. Você pode continuar editando hotéis, voos e demais dados.");
    } catch {
      toast.error("Não foi possível abrir este rascunho.");
      setSelectedDraftId(null);
    }
  }, [replaceBudget, selectedDraftId, selectedDraftQuery.data]);

  const openDrafts = () => {
    if (!draftLabel.trim()) {
      setDraftLabel(budget.tripInfo.destination ? `Orçamento — ${budget.tripInfo.destination}` : "Orçamento em rascunho");
    }
    setDraftDialogOpen(true);
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
            Rascunho
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1a2e4a]">Rascunhos de orçamento</DialogTitle>
            <DialogDescription>Salve o trabalho atual e retome-o depois para editar voos, hotéis e todas as demais informações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="draft-label" className="text-xs font-semibold text-slate-600">Nome do rascunho</Label>
            <Input id="draft-label" value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} placeholder="Ex.: Orçamento — Santiago" />
            <Button type="button" className="w-full bg-[#1a2e4a] text-white hover:bg-[#243c62]" onClick={saveDraft} disabled={saveDraftMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveDraftMutation.isPending ? "Salvando..." : "Salvar rascunho atual"}
            </Button>
          </div>
          <div className="border-t border-slate-200 pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#1a2e4a]"><FolderOpen className="h-4 w-4" /> Rascunhos salvos</div>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Buscar por cliente, destino ou nome"
                className="h-9 pl-8 text-xs"
              />
            </div>
            {draftsQuery.isLoading ? (
              <p className="text-xs text-slate-500">Carregando rascunhos...</p>
            ) : draftsQuery.data?.length ? (
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {draftsQuery.data.map((draft) => (
                  <div key={draft.id} className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-left transition-colors hover:border-amber-300 hover:bg-amber-50">
                    <div className="min-w-0 flex-1">
                      {editingDraftId === draft.id ? (
                        <Input value={editingDraftLabel} onChange={(event) => setEditingDraftLabel(event.target.value)} className="h-8 text-xs" autoFocus />
                      ) : (
                        <span className="block truncate text-xs font-semibold text-[#1a2e4a]">{draft.label}</span>
                      )}
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {[draft.clientName && `Cliente: ${draft.clientName}`, draft.destination && `Destino: ${draft.destination}`].filter(Boolean).join(" • ") || "Cliente e destino não informados"}
                      </span>
                      <span className="block text-[10px] text-slate-500">Atualizado em {new Date(draft.updatedAt).toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {editingDraftId === draft.id ? (
                        <Button type="button" size="sm" className="h-7 bg-[#1a2e4a] px-2 text-[10px] text-white hover:bg-[#243c62]" onClick={renameDraft} disabled={renameDraftMutation.isPending}>Salvar</Button>
                      ) : (
                        <>
                          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setSelectedDraftId(draft.id)}>Abrir</Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-[#1a2e4a]" aria-label={`Renomear ${draft.label}`} onClick={() => { setEditingDraftId(draft.id); setEditingDraftLabel(draft.label); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        </>
                      )}
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Excluir ${draft.label}`} onClick={() => deleteDraft(draft.id, draft.label)} disabled={deleteDraftMutation.isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">{draftSearch ? "Nenhum rascunho encontrado." : "Nenhum rascunho salvo ainda."}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Forms */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} flex flex-col overflow-hidden border-r border-slate-200`}>
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                      <FlightForm />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hotels" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Hotéis
                    </h3>
                    <HotelForm />
                  </div>
                </TabsContent>

                <TabsContent value="itinerary" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><h3 className="text-sm font-bold text-[#1a2e4a]" style={{ fontFamily: "Poppins, sans-serif" }}>{itineraryMode === "proposal" ? "Proposta de passeios" : "Roteiro final pós-aprovação"}</h3><p className="mt-1 text-xs text-slate-500">{itineraryMode === "proposal" ? "Cadastre e organize apenas os passeios para enviar uma proposta de aprovação." : "Inclua chegada, transfer, hospedagem, voos, retorno e os passeios já aprovados."}</p></div>
                      <div className="inline-flex rounded-lg bg-slate-200 p-1"><Button type="button" size="sm" variant="ghost" onClick={() => setItineraryMode("proposal")} className={`h-8 text-xs ${itineraryMode === "proposal" ? "bg-white text-[#1a2e4a] shadow-sm" : "text-slate-600"}`}>Proposta</Button><Button type="button" size="sm" variant="ghost" onClick={() => setItineraryMode("final")} className={`h-8 text-xs ${itineraryMode === "final" ? "bg-white text-[#1a2e4a] shadow-sm" : "text-slate-600"}`}>Roteiro final</Button></div>
                    </div>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] space-y-6 overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      {itineraryMode === "proposal" ? <><section aria-labelledby="proposta-abertura">
                        <div className="mb-3 border-b border-slate-200 pb-3">
                          <h4 id="proposta-abertura" className="text-sm font-bold text-[#1a2e4a]">Abertura da proposta</h4>
                          <p className="mt-1 text-xs text-slate-500">Comece pela mensagem para a cliente, pela forma de pagamento e pela importação dos passeios.</p>
                        </div>
                        <ItineraryForm />
                      </section>
                      <section aria-labelledby="roteiro-passeios" className="border-t border-slate-200 pt-6">
                        <div className="mb-3">
                          <h4 id="roteiro-passeios" className="text-sm font-bold text-[#1a2e4a]">Passeios da proposta</h4>
                          <p className="mt-1 text-xs text-slate-500">Inclua somente os passeios que deseja apresentar para aprovação.</p>
                        </div>
                        <TourForm />
                      </section></> : <FinalItineraryForm />}
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
                      <FareForm />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baggage" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Bagagens
                    </h3>
                    <BaggageForm />
                  </div>
                </TabsContent>

                <TabsContent value="installments" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Parcelamento
                    </h3>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <InstallmentsForm />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        {/* Right: PDF Preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col overflow-hidden bg-slate-200">
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
