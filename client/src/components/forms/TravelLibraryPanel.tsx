import { useMemo, useState } from "react";
import { Building2, BusFront, ChevronDown, FolderOpen, Hotel, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { filterTravelLibraryItems, getTravelLibraryFolders, TRAVEL_LIBRARY_CATEGORY_LABELS, type TravelLibraryCategory } from "./travelLibraryState";

const CATEGORY_ICONS: Record<TravelLibraryCategory, typeof Hotel> = {
  hotel: Hotel,
  tour: Building2,
  transfer: BusFront,
};

const EMPTY_DRAFT = {
  category: "hotel" as TravelLibraryCategory,
  folderName: "",
  name: "",
  destination: "",
  contactName: "",
  phone: "",
  linkUrl: "",
  imageUrl: "",
  notes: "",
};

export function TravelLibraryPanel() {
  const utils = trpc.useUtils();
  const libraryQuery = trpc.travelLibrary.list.useQuery();
  const createMutation = trpc.travelLibrary.create.useMutation({
    onSuccess: async () => {
      await utils.travelLibrary.list.invalidate();
      toast.success("Item salvo na Biblioteca de Viagem.");
    },
  });
  const deleteMutation = trpc.travelLibrary.delete.useMutation({
    onSuccess: async () => {
      await utils.travelLibrary.list.invalidate();
      toast.success("Item removido da Biblioteca de Viagem.");
    },
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TravelLibraryCategory | "all">("all");
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const items = useMemo(() => filterTravelLibraryItems(libraryQuery.data || [], selectedCategory), [libraryQuery.data, selectedCategory]);
  const folders = useMemo(() => getTravelLibraryFolders(items), [items]);

  const save = async () => {
    if (!draft.folderName.trim() || !draft.name.trim()) {
      toast.error("Informe a pasta e o nome para salvar na biblioteca.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...draft,
        destination: draft.destination.trim() || undefined,
        contactName: draft.contactName.trim() || undefined,
        phone: draft.phone.trim() || undefined,
        linkUrl: draft.linkUrl.trim() || undefined,
        imageUrl: draft.imageUrl.trim() || undefined,
        notes: draft.notes.trim() || undefined,
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar este item agora.");
    }
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Excluir “${name}” da Biblioteca de Viagem?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir este item agora.");
    }
  };

  return <section className="rounded-lg border border-[#1a2e4a]/15 bg-blue-50/60 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-[#1a2e4a]" /><div><p className="text-sm font-bold text-[#1a2e4a]">Biblioteca de Viagem</p><p className="text-xs text-slate-500">Guarde hotéis, passeios e contatos de transfer por pasta para reutilizar.</p></div></div>
      <div className="flex items-center gap-1"><Button type="button" variant="outline" size="sm" onClick={() => { setShowForm((current) => !current); setIsOpen(true); }} className="h-10 bg-white px-3 text-xs font-semibold"><Plus className="mr-1 h-4 w-4" />Adicionar</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} className="h-10 min-w-24 px-3 text-xs text-slate-600 hover:bg-white hover:text-[#1a2e4a]"><ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />{isOpen ? "Recolher" : "Abrir"}</Button></div>
    </div>
    {isOpen && <div className="mt-3 space-y-3 border-t border-[#1a2e4a]/10 pt-3">
      {showForm && <div className="rounded-md border border-blue-100 bg-white p-3"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold text-[#1a2e4a]">Novo item reutilizável</p><Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)} className="h-8 px-2 text-xs">Cancelar</Button></div><div className="grid gap-2 sm:grid-cols-2"><div><Label>Tipo</Label><Select value={draft.category} onValueChange={(category: TravelLibraryCategory) => setDraft((current) => ({ ...current, category }))}><SelectTrigger className="mt-1 h-9 bg-slate-50 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hotel">Hotel</SelectItem><SelectItem value="tour">Passeio</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent></Select></div><div><Label>Pasta</Label><Input value={draft.folderName} onChange={(event) => setDraft((current) => ({ ...current, folderName: event.target.value }))} placeholder="Ex.: Hotéis Chile" className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>Nome</Label><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Hotel Plaza Santiago" className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>Destino</Label><Input value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))} placeholder="Ex.: Santiago" className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>Contato / empresa</Label><Input value={draft.contactName} onChange={(event) => setDraft((current) => ({ ...current, contactName: event.target.value }))} placeholder="Ex.: Transfer Andes" className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>Telefone / WhatsApp</Label><Input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Ex.: +55 11 99999-9999" className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>Link</Label><Input value={draft.linkUrl} onChange={(event) => setDraft((current) => ({ ...current, linkUrl: event.target.value }))} placeholder="https://..." className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>Foto / álbum</Label><Input value={draft.imageUrl} onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." className="mt-1 h-9 bg-slate-50 text-xs" /></div><div className="sm:col-span-2"><Label>Notas</Label><Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Informações úteis para futuros orçamentos." className="mt-1 min-h-16 bg-slate-50 text-xs" /></div></div><div className="mt-2 flex justify-end"><Button type="button" size="sm" onClick={() => void save()} disabled={createMutation.isPending} className="h-9 bg-[#1a2e4a] px-3 text-xs font-bold text-white hover:bg-[#233f67]">Salvar na biblioteca</Button></div></div>}
      <div className="flex flex-wrap gap-1.5"><Button type="button" variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory("all")} className="h-8 bg-white px-2 text-xs text-[#1a2e4a]">Todos</Button>{(Object.keys(TRAVEL_LIBRARY_CATEGORY_LABELS) as TravelLibraryCategory[]).map((category) => <Button key={category} type="button" variant={selectedCategory === category ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category)} className="h-8 bg-white px-2 text-xs text-[#1a2e4a]">{TRAVEL_LIBRARY_CATEGORY_LABELS[category]}</Button>)}</div>
      {libraryQuery.isLoading ? <p className="text-xs text-slate-500">Carregando biblioteca...</p> : folders.length ? <div className="space-y-2">{folders.map((folder) => <div key={folder} className="rounded-md border border-blue-100 bg-white p-2.5"><div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#1a2e4a]"><FolderOpen className="h-3.5 w-3.5" />{folder}</div><div className="space-y-1.5">{items.filter((item) => item.folderName === folder).map((item) => { const Icon = CATEGORY_ICONS[item.category]; return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-2 py-1.5"><div className="min-w-0"><div className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-[#1a2e4a]" /><span className="text-xs font-semibold text-[#1a2e4a]">{item.name}</span>{item.destination && <span className="text-[11px] text-slate-500">• {item.destination}</span>}</div>{(item.contactName || item.phone) && <p className="mt-0.5 text-[11px] text-slate-500">{[item.contactName, item.phone].filter(Boolean).join(" • ")}</p>}</div><div className="flex gap-1">{item.linkUrl && <Button type="button" variant="outline" size="sm" asChild className="h-7 bg-white px-2 text-[11px]"><a href={item.linkUrl} target="_blank" rel="noreferrer">Abrir</a></Button>}<Button type="button" variant="ghost" size="sm" onClick={() => void remove(item.id, item.name)} disabled={deleteMutation.isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700" aria-label={`Excluir ${item.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></div></div>; })}</div></div>)}</div> : <p className="rounded-md border border-dashed border-blue-100 bg-white px-3 py-3 text-xs text-slate-500">Ainda não há itens na Biblioteca. Use <strong>Adicionar</strong> para criar pastas como “Passeios Chile”, “Hotéis Maceió” ou “Transfers”.</p>}
    </div>}
  </section>;
}
