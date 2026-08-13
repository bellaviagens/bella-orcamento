import { useRef, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Copy, Edit2, ExternalLink, GripVertical, Images, Loader2, MapPin, Plus, Trash2, Upload } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import type { Tour } from "@shared/budgetTypes";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseCurrency(value: string) {
  const sanitized = value.replace(/[^\d.,]/g, "");
  if (!sanitized) return 0;
  return Number.parseFloat(sanitized.includes(",") ? sanitized.replace(/\./g, "").replace(",", ".") : sanitized) || 0;
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={editing ? draft : value > 0 ? formatCurrency(value) : ""}
      onFocus={() => { setEditing(true); setDraft(value > 0 ? value.toFixed(2).replace(".", ",") : ""); }}
      onChange={(event) => { setDraft(event.target.value); onChange(parseCurrency(event.target.value)); }}
      onBlur={() => { setEditing(false); setDraft(""); }}
      placeholder="R$ 0,00"
    />
  );
}

const emptyTour = (): Omit<Tour, "id"> => ({
  name: "",
  location: "",
  duration: "",
  description: "",
  totalPrice: 0,
  pageUrl: "",
  photosUrl: "",
});

export function TourForm() {
  const { budget, addTour, updateTour, removeTour, duplicateTour, reorderTours } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Tour, "id">>(emptyTour());
  const [parsing, setParsing] = useState(false);
  const [draggedTourId, setDraggedTourId] = useState<string | null>(null);
  const [dragOverTourId, setDragOverTourId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseTourMutation = trpc.parseTourScreenshot.useMutation();

  const updateField = <K extends keyof Omit<Tour, "id">>(field: K, value: Omit<Tour, "id">[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyTour());
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Nome do passeio é obrigatório");
      return;
    }
    const tour: Tour = { ...form, id: editingId || nanoid() };
    if (editingId) {
      updateTour(editingId, tour);
      toast.success("Passeio atualizado com sucesso!");
    } else {
      addTour(tour);
      toast.success("Passeio adicionado com sucesso!");
    }
    closeForm();
  };

  const handleEdit = (tour: Tour) => {
    const { id: _id, ...values } = tour;
    setEditingId(tour.id);
    setForm(values);
    setShowForm(true);
  };

  const handleTourDrop = (targetTourId: string) => {
    if (!draggedTourId || draggedTourId === targetTourId) return;
    const sourceIndex = budget.tours.findIndex((tour) => tour.id === draggedTourId);
    const targetIndex = budget.tours.findIndex((tour) => tour.id === targetTourId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const nextTours = [...budget.tours];
    const [movedTour] = nextTours.splice(sourceIndex, 1);
    nextTours.splice(targetIndex, 0, movedTour);
    reorderTours(nextTours);
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setParsing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = await parseTourMutation.mutateAsync({ imageBase64: reader.result as string });
        setForm({
          ...emptyTour(),
          name: parsed.name || "",
          location: parsed.location || "",
          duration: parsed.duration || "",
          description: parsed.description || "",
          totalPrice: parsed.totalPrice || 0,
        });
        setEditingId(null);
        setShowForm(true);
        toast.success("Dados do passeio preenchidos. Revise antes de salvar.");
      } catch (error) {
        console.error("Tour screenshot parse error:", error);
        toast.error("Não foi possível analisar o screenshot. Tente novamente ou preencha manualmente.");
      } finally {
        setParsing(false);
        event.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {budget.tours.map((tour) => (
        <div
          key={tour.id}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (draggedTourId && draggedTourId !== tour.id) setDragOverTourId(tour.id);
          }}
          onDragLeave={() => {
            if (dragOverTourId === tour.id) setDragOverTourId(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleTourDrop(tour.id);
            setDraggedTourId(null);
            setDragOverTourId(null);
          }}
          className={`flex items-start gap-3 rounded-lg border bg-slate-50 p-3 transition-colors ${
            dragOverTourId === tour.id ? "border-[#1a2e4a] bg-blue-50" : "border-slate-200"
          }`}
        >
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", tour.id);
              setDraggedTourId(tour.id);
            }}
            onDragEnd={() => {
              setDraggedTourId(null);
              setDragOverTourId(null);
            }}
            className="flex h-8 w-5 cursor-grab items-center justify-center rounded text-slate-400 hover:bg-white hover:text-[#1a2e4a] active:cursor-grabbing"
            title="Arraste para reordenar"
            aria-label={`Arrastar ${tour.name} para reordenar`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a2e4a] text-white">
            <Camera className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h4 className="text-sm font-semibold text-[#1a2e4a]">{tour.name}</h4>
              {tour.duration && <span className="text-xs text-slate-500">{tour.duration}</span>}
            </div>
            {tour.location && <div className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" />{tour.location}</div>}
            {tour.description && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{tour.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {tour.totalPrice > 0 && <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#1a2e4a] shadow-sm">{formatCurrency(tour.totalPrice)}</span>}
            {tour.pageUrl && <a href={tour.pageUrl} target="_blank" rel="noreferrer" className="rounded p-2 text-slate-500 hover:bg-white hover:text-[#1a2e4a]" title="Abrir página do passeio"><ExternalLink className="h-4 w-4" /></a>}
            {tour.photosUrl && <a href={tour.photosUrl} target="_blank" rel="noreferrer" className="rounded p-2 text-slate-500 hover:bg-white hover:text-[#1a2e4a]" title="Abrir fotos do passeio"><Images className="h-4 w-4" /></a>}
            <Button variant="ghost" size="sm" onClick={() => handleEdit(tour)} className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 hover:text-blue-700" title="Editar passeio"><Edit2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => { duplicateTour(tour.id); toast.success("Passeio duplicado. Edite os dados necessários na nova opção."); }} className="h-8 w-8 p-0 text-[#1a2e4a] hover:bg-white hover:text-[#1a2e4a]" title="Duplicar passeio" aria-label={`Duplicar ${tour.name}`}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => removeTour(tour.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title="Remover passeio"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}

      <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={parsing} className="h-12 w-full text-base font-bold shadow-md">
          {parsing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analisando screenshot...</> : <><Upload className="mr-2 h-5 w-5" />Importar passeio de screenshot</>}
        </Button>
        <p className="mt-2 text-xs text-slate-400">O nome, local, duração, descrição e valor visíveis serão preenchidos para revisão.</p>
      </div>

      {!showForm && <Button variant="outline" onClick={() => setShowForm(true)} className="h-12 w-full text-base font-bold shadow-md"><Plus className="mr-2 h-5 w-5" />Adicionar passeio manualmente</Button>}

      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex items-center justify-between"><h4 className="text-sm font-bold text-[#1a2e4a]">{editingId ? "Editar passeio" : "Novo passeio"}</h4><Button variant="ghost" size="sm" onClick={closeForm}>Cancelar</Button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome do passeio</Label><Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Ex.: Vinícola e degustação" className="mt-1" /></div>
            <div><Label>Local ou ponto de encontro</Label><Input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Ex.: Vale do Casablanca" className="mt-1" /></div>
            <div><Label>Duração</Label><Input value={form.duration} onChange={(event) => updateField("duration", event.target.value)} placeholder="Ex.: 6 horas" className="mt-1" /></div>
            <div><Label>Valor total (R$)</Label><CurrencyInput value={form.totalPrice} onChange={(value) => updateField("totalPrice", value)} /></div>
            <div><Label>Link da página</Label><Input type="url" value={form.pageUrl || ""} onChange={(event) => updateField("pageUrl", event.target.value)} placeholder="https://" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Link de fotos</Label><Input type="url" value={form.photosUrl || ""} onChange={(event) => updateField("photosUrl", event.target.value)} placeholder="https://" className="mt-1" /></div>
            <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Informações importantes do passeio" className="mt-1 min-h-20" /></div>
          </div>
          <Button onClick={handleSave} className="w-full bg-[#1a2e4a] text-white hover:bg-[#243d61]">{editingId ? "Salvar alterações" : "Adicionar passeio"}</Button>
        </div>
      )}
    </div>
  );
}
