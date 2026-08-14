import { useBudget } from "@/contexts/BudgetContext";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, FolderOpen, GripVertical, Link2, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ItineraryForm() {
  const { budget, addItineraryDay, importItineraryFromQuotation, replaceBudget, updateTourProposal, updateItineraryDay, removeItineraryDay, reorderItineraryDays } = useBudget();
  const itinerary = budget.itinerary;
  const [quotationUrl, setQuotationUrl] = useState("");
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<string | null>(null);
  const importQuotationMutation = trpc.importQuotationUrl.useMutation();
  const utils = trpc.useUtils();
  const savedProposalsQuery = trpc.tourProposals.list.useQuery();
  const saveProposalMutation = trpc.tourProposals.save.useMutation();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const selectedProposalQuery = trpc.tourProposals.get.useQuery(
    { id: selectedProposalId || "00000000-0000-0000-0000-000000000000" },
    { enabled: Boolean(selectedProposalId) },
  );

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

  useEffect(() => {
    if (!selectedProposalQuery.data || !selectedProposalId) return;
    const saved = selectedProposalQuery.data;
    try {
      const restored = JSON.parse(saved.snapshot);
      if (!restored || typeof restored !== "object" || !Array.isArray(restored.tours) || !Array.isArray(restored.itinerary)) {
        throw new Error("O arquivo salvo desta proposta está inválido.");
      }
      replaceBudget(restored);
      toast.success(`Proposta de ${saved.clientName} carregada.`);
    } catch (error) {
      console.error("Load tour proposal error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar a proposta.");
    } finally {
      setSelectedProposalId(null);
    }
  }, [replaceBudget, selectedProposalId, selectedProposalQuery.data]);

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

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-[#1a2e4a]">
        Esta é a proposta de passeios para aprovação. Ela tem visualização e PDF próprios e não altera o orçamento principal. Após a aprovação, esta mesma aba receberá os dados práticos do roteiro final.
      </div>

      <div className="rounded-lg border border-[#1a2e4a]/15 bg-blue-50/60 p-3">
        <div className="mb-3">
          <h4 className="text-sm font-bold text-[#1a2e4a]">Abertura e pagamento da proposta</h4>
          <p className="mt-1 text-xs text-slate-500">Essas informações aparecem antes e depois dos passeios no documento de aprovação.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="proposal-client">Cliente</Label><Input id="proposal-client" value={budget.tourProposal.clientName || ""} onChange={(event) => updateTourProposal({ clientName: event.target.value })} placeholder="Ex.: Suelen Vieira" className="mt-1 bg-white" /></div>
          <div><Label htmlFor="proposal-title">Título da proposta</Label><Input id="proposal-title" value={budget.tourProposal.title} onChange={(event) => updateTourProposal({ title: event.target.value })} placeholder="Ex.: Passeios em Santiago" className="mt-1 bg-white" /></div>
          <div className="sm:col-span-2"><Label htmlFor="proposal-intro">Mensagem inicial</Label><Textarea id="proposal-intro" value={budget.tourProposal.introMessage} onChange={(event) => updateTourProposal({ introMessage: event.target.value })} placeholder="Ex.: Olá, Suelen! Preparamos estas opções de passeios para a sua viagem..." className="mt-1 min-h-16 bg-white" /></div>
          <div><Label htmlFor="proposal-installments">Parcelamento</Label><Select value={String(budget.tourProposal.installments || 1)} onValueChange={(value) => updateTourProposal({ installments: Number(value) })}><SelectTrigger id="proposal-installments" className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">À vista</SelectItem><SelectItem value="2">2x</SelectItem><SelectItem value="3">3x</SelectItem><SelectItem value="4">4x</SelectItem><SelectItem value="5">5x</SelectItem><SelectItem value="6">6x</SelectItem><SelectItem value="8">8x</SelectItem><SelectItem value="10">10x</SelectItem><SelectItem value="12">12x</SelectItem></SelectContent></Select></div>
          <div><Label htmlFor="proposal-payment">Forma de pagamento</Label><Textarea id="proposal-payment" value={budget.tourProposal.paymentDetails} onChange={(event) => updateTourProposal({ paymentDetails: event.target.value })} placeholder="Ex.: PIX, cartão ou condições combinadas" className="mt-1 min-h-16 bg-white" /></div>
          <div className="sm:col-span-2 flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-2.5 sm:flex-row sm:items-center">
            <Button type="button" onClick={handleSaveProposal} disabled={saveProposalMutation.isPending} className="h-10 font-bold"><Save className="mr-2 h-4 w-4" />{saveProposalMutation.isPending ? "Salvando..." : "Salvar proposta"}</Button>
            <Select onValueChange={handleLoadProposal} disabled={savedProposalsQuery.isLoading || selectedProposalQuery.isFetching}>
              <SelectTrigger className="h-10 flex-1"><FolderOpen className="mr-2 h-4 w-4" /><SelectValue placeholder={savedProposalsQuery.isLoading ? "Carregando propostas..." : "Abrir proposta já salva"} /></SelectTrigger>
              <SelectContent>{(savedProposalsQuery.data || []).map((saved) => <SelectItem key={saved.id} value={saved.id}>{saved.clientName} — {saved.proposalTitle}</SelectItem>)}</SelectContent>
            </Select>
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

      {itinerary.map((day) => (
        <div
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
          <div className="mb-3 flex items-center justify-between">
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-xs font-bold text-white">{day.day}</div><span className="text-sm font-bold text-[#1a2e4a]">Dia {day.day}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeItineraryDay(day.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title={`Remover dia ${day.day}`}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Atividade</Label><Select value={day.tourId || "free"} onValueChange={(value) => {
              if (value === "free") updateItineraryDay(day.id, { tourId: undefined, title: "Dia livre" });
              else {
                const tour = budget.tours.find((currentTour) => currentTour.id === value);
                updateItineraryDay(day.id, { tourId: value, title: tour?.name || day.title });
              }
            }}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="free">Dia livre</SelectItem>{budget.tours.map((tour) => <SelectItem key={tour.id} value={tour.id}>{tour.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Título exibido</Label><Input value={day.title} onChange={(event) => updateItineraryDay(day.id, { title: event.target.value })} placeholder="Ex.: Dia livre" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Observações do dia</Label><Textarea value={day.notes} onChange={(event) => updateItineraryDay(day.id, { notes: event.target.value })} placeholder="Horários, recomendações ou informações adicionais" className="mt-1 min-h-20" /></div>
          </div>
        </div>
      ))}

      {itinerary.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"><CalendarDays className="mx-auto mb-2 h-5 w-5 text-slate-400" />Ainda não há dias no roteiro. Comece adicionando o primeiro dia.</div>}
      <Button variant="outline" onClick={addItineraryDay} className="h-12 w-full text-base font-bold shadow-md"><Plus className="mr-2 h-5 w-5" />Adicionar dia ao roteiro</Button>
    </div>
  );
}
