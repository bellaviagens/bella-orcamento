import { Building2, BusFront, ChevronDown, FileText, FolderOpen, Heart, Hotel, ImagePlus, Pencil, Plus, RotateCcw, Search, SendHorizontal, Trash2, Utensils } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useBudget } from "@/contexts/BudgetContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { filterFavoriteTravelLibraryItems, filterTravelLibraryItems, getTravelLibraryDestinationGroups, getTravelLibraryFolders, sortTravelLibraryItems, TRAVEL_LIBRARY_CATEGORY_LABELS, type HotelLibrarySort, type TravelLibraryCategory } from "./travelLibraryState";
import { EMPTY_LIBRARY_DRAFT, libraryItemToDraft, type TravelLibraryDraft } from "./travelLibraryEditorState";
import { travelLibraryLocationFromDestination } from "./travelLibraryLocation";
import { mergeHotelVoucherLibraryDraft } from "./hotelVoucherLibraryDraft";
import { mergeTravelServiceDocumentDraft } from "./travelServiceDocumentDraft";

const CATEGORY_ICONS: Record<TravelLibraryCategory, typeof Hotel> = { hotel: Hotel, tour: Building2, restaurant: Utensils, transfer: BusFront };
const SUPPORTED_LIBRARY_FILES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

function asOptional(value: string) {
  return value.trim() || undefined;
}

export function TravelLibraryPanel({ initiallyOpen = false, restaurantEditId, onRestaurantEditOpened }: { initiallyOpen?: boolean; restaurantEditId?: string | null; onRestaurantEditOpened?: () => void }) {
  const utils = trpc.useUtils();
  const { budget, addHotel, addTour, addFinalItineraryEvent, saveGastronomyOption } = useBudget();
  const libraryQuery = trpc.travelLibrary.list.useQuery();
  const favoriteRestaurantsQuery = trpc.favoriteRestaurants.list.useQuery();
  const createMutation = trpc.travelLibrary.create.useMutation({ onSuccess: async () => { await utils.travelLibrary.list.invalidate(); toast.success("Item salvo na Biblioteca de Viagem."); } });
  const updateMutation = trpc.travelLibrary.update.useMutation({ onSuccess: async () => { await utils.travelLibrary.list.invalidate(); toast.success("Item da Biblioteca atualizado."); } });
  const deleteMutation = trpc.travelLibrary.delete.useMutation({ onSuccess: async () => { await utils.travelLibrary.list.invalidate(); toast.success("Item removido da Biblioteca de Viagem."); } });
  const favoriteMutation = trpc.travelLibrary.setFavorite.useMutation();
  const uploadMutation = trpc.itineraryAttachments.upload.useMutation();
  const parseHotelVoucher = trpc.parseHotelVoucher.useMutation();
  const parseTravelServiceDocument = trpc.parseTravelServiceDocument.useMutation();
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<"library" | "favorites">("library");
  const [selectedCategory, setSelectedCategory] = useState<TravelLibraryCategory | "all">("all");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [hotelSort, setHotelSort] = useState<HotelLibrarySort>("default");
  const [draft, setDraft] = useState<TravelLibraryDraft>(EMPTY_LIBRARY_DRAFT);
  const panelRef = useRef<HTMLElement>(null);
  const allItems = libraryQuery.data || [];
  const items = useMemo(() => sortTravelLibraryItems(filterTravelLibraryItems(allItems, { category: selectedCategory, country: selectedCountry, city: selectedCity, neighborhood: selectedNeighborhood, searchQuery: hotelSearchQuery }), hotelSort), [allItems, selectedCategory, selectedCountry, selectedCity, selectedNeighborhood, hotelSearchQuery, hotelSort]);
  const countries = useMemo(() => Array.from(new Set(allItems.map((item) => item.country?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "pt-BR")), [allItems]);
  const cities = useMemo(() => Array.from(new Set(allItems.filter((item) => !selectedCountry || item.country?.trim() === selectedCountry).map((item) => item.city?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "pt-BR")), [allItems, selectedCountry]);
  const neighborhoods = useMemo(() => Array.from(new Set(allItems.filter((item) => (!selectedCountry || item.country?.trim() === selectedCountry) && (!selectedCity || item.city?.trim() === selectedCity)).map((item) => item.neighborhood?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, "pt-BR")), [allItems, selectedCountry, selectedCity]);
  const destinationGroups = useMemo(() => getTravelLibraryDestinationGroups(items), [items]);
  const favoriteLibraryItems = useMemo(() => filterFavoriteTravelLibraryItems(allItems), [allItems]);
  const favoriteRestaurants = favoriteRestaurantsQuery.data || [];
  const hasSearchableCategory = selectedCategory === "hotel" || selectedCategory === "tour" || selectedCategory === "transfer";
  const searchPlaceholder = selectedCategory === "hotel"
    ? "Buscar hotel por nome, endereço ou bairro"
    : selectedCategory === "tour"
      ? "Buscar passeio por nome, destino ou observações"
      : "Buscar transfer por empresa, responsável ou observações";

  const closeEditor = () => { setDraft(EMPTY_LIBRARY_DRAFT); setEditingId(null); setShowForm(false); };
  const clearAllFilters = () => { setSelectedSource("library"); setSelectedCategory("all"); setSelectedCountry(""); setSelectedCity(""); setSelectedNeighborhood(""); setHotelSearchQuery(""); setHotelSort("default"); };
  const openNewItem = () => {
    const location = travelLibraryLocationFromDestination(budget.tripInfo.destination);
    setDraft({ ...EMPTY_LIBRARY_DRAFT, ...location });
    setEditingId(null);
    setShowForm(true);
    setIsOpen(true);
  };
  const openExistingItem = (item: typeof allItems[number]) => { setDraft(libraryItemToDraft(item)); setEditingId(item.id); setShowForm(true); setIsOpen(true); };

  useEffect(() => {
    if (!restaurantEditId) return;
    const restaurant = allItems.find((item) => item.id === restaurantEditId && item.category === "restaurant");
    if (!restaurant) return;
    openExistingItem(restaurant);
    setSelectedSource("library");
    onRestaurantEditOpened?.();
    window.requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [restaurantEditId, allItems, onRestaurantEditOpened]);

  const save = async () => {
    if (!draft.destination.trim() || !draft.folderName.trim() || !draft.name.trim()) { toast.error("Informe destino, subgrupo e nome para salvar na biblioteca."); return; }
    const input = {
      ...draft,
      country: asOptional(draft.country), city: asOptional(draft.city), neighborhood: asOptional(draft.neighborhood), contactName: asOptional(draft.contactName), phone: asOptional(draft.phone),
      responsibleName: asOptional(draft.responsibleName), whatsapp: asOptional(draft.whatsapp), linkUrl: asOptional(draft.linkUrl), imageUrl: asOptional(draft.imageUrl), documentUrl: asOptional(draft.documentUrl), notes: asOptional(draft.notes),
    };
    try {
      if (editingId) await updateMutation.mutateAsync({ ...input, id: editingId });
      else await createMutation.mutateAsync(input);
      closeEditor();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar este item agora."); }
  };

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>, target: "imageUrl" | "documentUrl") => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!SUPPORTED_LIBRARY_FILES.includes(file.type as typeof SUPPORTED_LIBRARY_FILES[number])) { toast.error("Use PDF, JPG, PNG ou WEBP."); return; }
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const uploaded = await uploadMutation.mutateAsync({ fileName: file.name, contentType: file.type as typeof SUPPORTED_LIBRARY_FILES[number], dataBase64 });
      setDraft((current) => ({ ...current, [target]: uploaded.url }));
      toast.success(target === "imageUrl" ? "Foto anexada ao fornecedor." : "Documento anexado ao fornecedor.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível anexar o arquivo."); }
  };

  const importHotelVoucher = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!SUPPORTED_LIBRARY_FILES.includes(file.type as typeof SUPPORTED_LIBRARY_FILES[number])) { toast.error("Use PDF, JPG, PNG ou WEBP para ler o hotel."); return; }
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const uploaded = await uploadMutation.mutateAsync({ fileName: file.name, contentType: file.type as typeof SUPPORTED_LIBRARY_FILES[number], dataBase64 });
      const parsed = await parseHotelVoucher.mutateAsync({ documentBase64: dataBase64 });
      const location = travelLibraryLocationFromDestination(draft.destination || budget.tripInfo.destination);
      const importedImageUrl = file.type.startsWith("image/") ? uploaded.url : "";
      setDraft((current) => mergeHotelVoucherLibraryDraft(current, parsed, location, uploaded.url, importedImageUrl));
      toast.success("Dados do hotel preenchidos pelo documento. Confira e complete o cadastro antes de salvar.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "O documento foi anexado, mas não foi possível ler os dados automaticamente."); }
  };

  const importTravelServiceDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const serviceCategory = draft.category;
    if (!file || (serviceCategory !== "tour" && serviceCategory !== "transfer")) return;
    if (!SUPPORTED_LIBRARY_FILES.includes(file.type as typeof SUPPORTED_LIBRARY_FILES[number])) { toast.error("Use PDF, JPG, PNG ou WEBP para ler o documento."); return; }
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const uploaded = await uploadMutation.mutateAsync({ fileName: file.name, contentType: file.type as typeof SUPPORTED_LIBRARY_FILES[number], dataBase64 });
      const parsed = await parseTravelServiceDocument.mutateAsync({ documentBase64: dataBase64, category: serviceCategory });
      const location = travelLibraryLocationFromDestination(draft.destination || budget.tripInfo.destination);
      const importedImageUrl = file.type.startsWith("image/") ? uploaded.url : "";
      setDraft((current) => mergeTravelServiceDocumentDraft(current, serviceCategory, parsed, location, uploaded.url, importedImageUrl));
      toast.success(`Dados do ${serviceCategory === "tour" ? "passeio" : "transfer"} preenchidos pelo documento. Confira e complete antes de salvar.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "O documento foi anexado, mas não foi possível ler os dados automaticamente."); }
  };

  const importIntoBudget = (item: typeof allItems[number]) => {
    if (item.category === "hotel") {
      const hotelLocation = [item.neighborhood, item.city, item.country].filter(Boolean).join(", ");
      addHotel({ id: crypto.randomUUID(), name: item.name, stars: 0, address: hotelLocation, description: item.notes || "", rating: 0, ratingLabel: "", amenities: [], photoUrl: item.imageUrl || "", hotelUrl: item.linkUrl || "", totalPrice: 0, prices: {} });
      toast.success(`Hotel importado para a aba Hotéis${hotelLocation ? `: ${hotelLocation}` : ""}. Informe os valores quando desejar.`);
      return;
    }
    if (item.category === "tour") {
      addTour({ id: crypto.randomUUID(), name: item.name, location: [item.neighborhood, item.city, item.country].filter(Boolean).join(", ") || item.destination || "", duration: "", description: item.notes || "", totalPrice: 0, pageUrl: item.linkUrl || "", photosUrl: item.imageUrl || "" });
      toast.success("Passeio importado para a Proposta de Passeios. Informe os valores quando desejar.");
      return;
    }
    if (item.category === "restaurant") {
      const location = [item.neighborhood, item.city, item.country].filter(Boolean).join(", ") || item.destination || "";
      saveGastronomyOption({ id: `library-${item.id}`, name: item.name, location, address: "", description: item.notes || "", mapsUrl: item.linkUrl || "https://www.google.com/maps", website: item.linkUrl || undefined, photoUrl: item.imageUrl || undefined });
      toast.success("Restaurante importado como opção gastronômica.");
      return;
    }
    addFinalItineraryEvent({ kind: "transfer", title: item.name, description: [item.notes, item.responsibleName && `Responsável: ${item.responsibleName}`, item.whatsapp && `WhatsApp: ${item.whatsapp || item.phone}`].filter(Boolean).join("\n"), linkUrl: item.linkUrl || "", photoUrl: item.imageUrl || "" });
    toast.success("Transfer importado para o Roteiro Final.");
  };

  const remove = async (id: string, name: string) => { if (!window.confirm(`Excluir “${name}” da Biblioteca de Viagem?`)) return; try { await deleteMutation.mutateAsync({ id }); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível excluir este item agora."); } };
  const toggleFavorite = async (item: typeof allItems[number]) => {
    try {
      await favoriteMutation.mutateAsync({ id: item.id, isFavorite: !item.isFavorite });
      await utils.travelLibrary.list.invalidate();
      toast.success(item.isFavorite ? `${item.name} foi removido dos favoritos.` : `${item.name} foi adicionado aos favoritos.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar os favoritos agora.");
    }
  };
  const savePending = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending || parseHotelVoucher.isPending || parseTravelServiceDocument.isPending;

  return <section ref={panelRef} className="rounded-lg border border-[#1a2e4a]/15 bg-blue-50/60 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-[#1a2e4a]" /><div><p className="text-sm font-bold text-[#1a2e4a]">Biblioteca de Viagem</p><p className="text-xs text-slate-500">Organize fornecedores por destino e reutilize-os no orçamento atual.</p></div></div>
      <div className="flex items-center gap-1"><Button type="button" variant="outline" size="sm" onClick={openNewItem} className="h-10 bg-white px-3 text-xs font-semibold"><Plus className="mr-1 h-4 w-4" />Adicionar</Button><Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} className="h-10 min-w-24 px-3 text-xs text-slate-600 hover:bg-white hover:text-[#1a2e4a]"><ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />{isOpen ? "Recolher" : "Abrir"}</Button></div>
    </div>
    {isOpen && <div className="mt-3 space-y-3 border-t border-[#1a2e4a]/10 pt-3">
      {showForm && <div className="max-h-[min(68vh,660px)] overflow-y-auto overscroll-contain rounded-md border border-blue-100 bg-white p-3 pr-2">
        <div className="mb-2 flex items-center justify-between"><div><p className="text-xs font-bold text-[#1a2e4a]">{editingId ? "Editar item reutilizável" : "Novo item reutilizável"}</p>{editingId && <p className="mt-0.5 text-[11px] text-slate-500">Atualize os dados do fornecedor, foto ou voucher sem criar outro cadastro.</p>}</div><Button type="button" variant="ghost" size="sm" onClick={closeEditor} className="h-8 px-2 text-xs">Cancelar</Button></div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><Label>Tipo de serviço</Label><Select value={draft.category} onValueChange={(category: TravelLibraryCategory) => setDraft((current) => ({ ...current, category }))}><SelectTrigger className="mt-1 h-9 bg-slate-50 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hotel">Hotel</SelectItem><SelectItem value="tour">Passeio</SelectItem><SelectItem value="restaurant">Restaurante</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent></Select></div>
          <div><Label>Destino</Label><Input value={draft.destination} onChange={(event) => setDraft((current) => ({ ...current, destination: event.target.value }))} placeholder="Ex.: Santiago" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>País</Label><Input value={draft.country} onChange={(event) => setDraft((current) => ({ ...current, country: event.target.value }))} placeholder="Ex.: Chile" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Cidade</Label><Input value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} placeholder="Ex.: Santiago" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Bairro</Label><Input value={draft.neighborhood} onChange={(event) => setDraft((current) => ({ ...current, neighborhood: event.target.value }))} placeholder="Ex.: Las Condes" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Subgrupo</Label><Input value={draft.folderName} onChange={(event) => setDraft((current) => ({ ...current, folderName: event.target.value }))} placeholder="Ex.: Hotéis centro" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Nome</Label><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Hotel Plaza Santiago" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Contato / empresa</Label><Input value={draft.contactName} onChange={(event) => setDraft((current) => ({ ...current, contactName: event.target.value }))} placeholder="Ex.: Transfer Andes" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Telefone</Label><Input value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Ex.: +56 9 9999-9999" className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          {draft.category === "transfer" && <><div><Label>Nome do responsável</Label><Input value={draft.responsibleName} onChange={(event) => setDraft((current) => ({ ...current, responsibleName: event.target.value }))} placeholder="Ex.: Carlos Silva" className="mt-1 h-9 bg-slate-50 text-xs" /></div><div><Label>WhatsApp do responsável</Label><Input value={draft.whatsapp} onChange={(event) => setDraft((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="Ex.: +56 9 9999-9999" className="mt-1 h-9 bg-slate-50 text-xs" /></div></>}
          <div><Label>Link</Label><Input value={draft.linkUrl} onChange={(event) => setDraft((current) => ({ ...current, linkUrl: event.target.value }))} placeholder="https://..." className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div><Label>Foto / álbum (link)</Label><Input value={draft.imageUrl} onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." className="mt-1 h-9 bg-slate-50 text-xs" /></div>
          <div className="rounded border border-dashed border-blue-100 bg-blue-50/40 p-2"><Label className="text-xs">Anexar foto</Label><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadFile(event, "imageUrl")} disabled={uploadMutation.isPending} className="mt-1 h-8 bg-white text-[11px]" />{draft.imageUrl && <p className="mt-1 text-[10px] text-emerald-700">Foto pronta para salvar.</p>}</div>
          <div className="rounded border border-dashed border-blue-100 bg-blue-50/40 p-2"><Label className="text-xs">Anexar documento / voucher</Label><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void uploadFile(event, "documentUrl")} disabled={uploadMutation.isPending} className="mt-1 h-8 bg-white text-[11px]" />{draft.documentUrl && <p className="mt-1 text-[10px] text-emerald-700">Documento pronto para salvar.</p>}</div>
          {draft.category === "hotel" && <div className="sm:col-span-2 rounded border border-dashed border-amber-200 bg-amber-50/70 p-2"><Label className="text-xs text-[#1a2e4a]">Cadastrar hotel por PDF ou print</Label><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void importHotelVoucher(event)} disabled={uploadMutation.isPending || parseHotelVoucher.isPending} className="mt-1 h-8 bg-white text-[11px]" /><p className="mt-1 text-[10px] text-slate-600">O sistema preenche os dados visíveis no documento. Revise antes de salvar.</p></div>}
          {(draft.category === "tour" || draft.category === "transfer") && <div className="sm:col-span-2 rounded border border-dashed border-amber-200 bg-amber-50/70 p-2"><Label className="text-xs text-[#1a2e4a]">Cadastrar {draft.category === "tour" ? "passeio" : "transfer"} por PDF ou print</Label><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void importTravelServiceDocument(event)} disabled={uploadMutation.isPending || parseTravelServiceDocument.isPending} className="mt-1 h-8 bg-white text-[11px]" /><p className="mt-1 text-[10px] text-slate-600">O sistema preenche somente dados visíveis no documento. Revise antes de salvar.</p></div>}
          <div className="sm:col-span-2"><Label>Notas</Label><Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Informações úteis para futuros orçamentos." className="mt-1 min-h-16 bg-slate-50 text-xs" /></div>
        </div>
        <div className="mt-2 flex justify-end"><Button type="button" size="sm" onClick={() => void save()} disabled={savePending} className="h-9 bg-[#1a2e4a] px-3 text-xs font-bold text-white hover:bg-[#233f67]">{editingId ? "Atualizar na biblioteca" : "Salvar na biblioteca"}</Button></div>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-1.5"><span className="mr-1 text-xs font-semibold text-[#1a2e4a]">Exibir:</span><Button type="button" variant={selectedSource === "library" ? "default" : "outline"} size="sm" onClick={() => setSelectedSource("library")} className={selectedSource === "library" ? "h-8 bg-[#1a2e4a] px-2 text-xs text-white hover:bg-[#233f67]" : "h-8 bg-white px-2 text-xs text-[#1a2e4a]"}>Itens salvos</Button><Button type="button" variant={selectedSource === "favorites" ? "default" : "outline"} size="sm" onClick={() => setSelectedSource("favorites")} className={selectedSource === "favorites" ? "h-8 bg-[#1a2e4a] px-2 text-xs text-white hover:bg-[#233f67]" : "h-8 bg-white px-2 text-xs text-[#1a2e4a]"}><Heart className="mr-1 h-3.5 w-3.5" />Favoritos</Button></div>{selectedSource === "library" && <Button type="button" variant="outline" size="sm" onClick={clearAllFilters} className="h-8 bg-white px-2 text-xs text-slate-600"><RotateCcw className="mr-1 h-3.5 w-3.5" />Limpar filtros</Button>}</div>
      {selectedSource === "library" ? <><div className="space-y-1.5"><div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_150px_150px_150px]"><div className="flex flex-wrap gap-1.5"><Button type="button" variant={selectedCategory === "all" ? "default" : "outline"} size="sm" onClick={() => { setSelectedCategory("all"); setSelectedNeighborhood(""); setHotelSearchQuery(""); setHotelSort("default"); }} className={selectedCategory === "all" ? "h-8 bg-[#1a2e4a] px-2 text-xs text-white hover:bg-[#233f67]" : "h-8 bg-white px-2 text-xs text-[#1a2e4a]"}>Todos</Button>{(Object.keys(TRAVEL_LIBRARY_CATEGORY_LABELS) as TravelLibraryCategory[]).map((category) => <Button key={category} type="button" variant={selectedCategory === category ? "default" : "outline"} size="sm" onClick={() => { setSelectedCategory(category); setSelectedNeighborhood(""); setHotelSearchQuery(""); if (category !== "hotel") setHotelSort("default"); }} className={selectedCategory === category ? "h-8 bg-[#1a2e4a] px-2 text-xs text-white hover:bg-[#233f67]" : "h-8 bg-white px-2 text-xs text-[#1a2e4a]"}>{TRAVEL_LIBRARY_CATEGORY_LABELS[category]}</Button>)}</div><Select value={selectedCountry || "all"} onValueChange={(value) => { setSelectedCountry(value === "all" ? "" : value); setSelectedCity(""); setSelectedNeighborhood(""); }}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue placeholder="Todos os países" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os países</SelectItem>{countries.map((country) => <SelectItem key={country} value={country}>{country}</SelectItem>)}</SelectContent></Select><Select value={selectedCity || "all"} onValueChange={(value) => { setSelectedCity(value === "all" ? "" : value); setSelectedNeighborhood(""); }}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue placeholder="Todas as cidades" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as cidades</SelectItem>{cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select><Select value={selectedNeighborhood || "all"} onValueChange={(value) => setSelectedNeighborhood(value === "all" ? "" : value)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue placeholder="Todos os bairros" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os bairros</SelectItem>{neighborhoods.map((neighborhood) => <SelectItem key={neighborhood} value={neighborhood}>{neighborhood}</SelectItem>)}</SelectContent></Select></div>{hasSearchableCategory && <div className={selectedCategory === "hotel" ? "grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_190px]" : "grid gap-1.5"}><div className="relative"><Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><Input value={hotelSearchQuery} onChange={(event) => setHotelSearchQuery(event.target.value)} placeholder={searchPlaceholder} className="h-8 bg-white pl-7 text-xs" /></div>{selectedCategory === "hotel" && <Select value={hotelSort} onValueChange={(value: HotelLibrarySort) => setHotelSort(value)}><SelectTrigger className="h-8 bg-white text-xs"><SelectValue placeholder="Ordenar hotéis" /></SelectTrigger><SelectContent><SelectItem value="default">Ordem padrão</SelectItem><SelectItem value="neighborhood">Ordenar por bairro</SelectItem></SelectContent></Select>}</div>}</div>
      {libraryQuery.isLoading ? <p className="text-xs text-slate-500">Carregando biblioteca...</p> : destinationGroups.length ? <div className="space-y-3">{destinationGroups.map(({ destination, items: destinationItems }) => { const folders = getTravelLibraryFolders(destinationItems); return <div key={destination} className="rounded-md border border-blue-100 bg-white p-2.5"><div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#1a2e4a]"><FolderOpen className="h-3.5 w-3.5" />{destination}</div><div className="space-y-2">{folders.map((folder) => <div key={folder} className="rounded border border-slate-100 bg-slate-50 p-2"><p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{folder}</p><div className="space-y-1.5">{destinationItems.filter((item) => item.folderName === folder).map((item) => { const Icon = CATEGORY_ICONS[item.category]; const contact = item.category === "transfer" ? [item.responsibleName || item.contactName, item.whatsapp || item.phone].filter(Boolean).join(" • ") : [item.contactName, item.phone].filter(Boolean).join(" • "); const itemLocation = [item.neighborhood, item.city, item.country].filter(Boolean).join(", "); return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 bg-white px-2 py-1.5"><div className="flex min-w-0 items-center gap-2">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-9 w-9 rounded object-cover" /> : <Icon className="h-3.5 w-3.5 shrink-0 text-[#1a2e4a]" />}<div className="min-w-0"><div className="flex items-center gap-1.5"><span className="text-xs font-semibold text-[#1a2e4a]">{item.name}</span><span className="text-[10px] text-slate-400">{TRAVEL_LIBRARY_CATEGORY_LABELS[item.category]}</span></div>{itemLocation && <p className="mt-0.5 text-[10px] text-slate-400">{itemLocation}</p>}{contact && <p className="mt-0.5 text-[11px] text-slate-500">{contact}</p>}</div></div><div className="flex flex-wrap justify-end gap-1"><Button type="button" variant="outline" size="sm" onClick={() => openExistingItem(item)} className="h-7 bg-white px-2 text-[11px]"><Pencil className="mr-1 h-3 w-3" />Editar</Button><Button type="button" variant="outline" size="sm" onClick={() => importIntoBudget(item)} className="h-7 bg-white px-2 text-[11px]"><SendHorizontal className="mr-1 h-3 w-3" />Importar</Button>{item.linkUrl && <Button type="button" variant="outline" size="sm" asChild className="h-7 bg-white px-2 text-[11px]"><a href={item.linkUrl} target="_blank" rel="noreferrer">Abrir</a></Button>}{item.documentUrl && <Button type="button" variant="outline" size="sm" asChild className="h-7 w-7 bg-white p-0" aria-label={`Abrir documento de ${item.name}`}><a href={item.documentUrl} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5" /></a></Button>}<Button type="button" variant="outline" size="sm" onClick={() => void toggleFavorite(item)} disabled={favoriteMutation.isPending} className={item.isFavorite ? "h-7 border-amber-300 bg-amber-50 px-2 text-[11px] text-[#1a2e4a]" : "h-7 bg-white px-2 text-[11px]"} aria-label={item.isFavorite ? `Remover ${item.name} dos favoritos` : `Favoritar ${item.name}`}><Heart className={`mr-1 h-3 w-3 ${item.isFavorite ? "fill-current" : ""}`} />{item.isFavorite ? "Favorito" : "Favoritar"}</Button><Button type="button" variant="ghost" size="sm" onClick={() => void remove(item.id, item.name)} disabled={deleteMutation.isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-700" aria-label={`Excluir ${item.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></div></div>; })}</div></div>)}</div></div>; })}</div> : <p className="rounded-md border border-dashed border-blue-100 bg-white px-3 py-3 text-xs text-slate-500">Nenhum item corresponde aos filtros atuais. Crie destinos, subgrupos e fornecedores para reutilizá-los em novos orçamentos.</p>}</> : <>{favoriteLibraryItems.length ? <div className="space-y-2 rounded-md border border-blue-100 bg-white p-2.5"><p className="text-xs font-bold text-[#1a2e4a]">Itens favoritos da Biblioteca</p>{favoriteLibraryItems.map((item) => { const Icon = CATEGORY_ICONS[item.category]; const itemLocation = [item.neighborhood, item.city, item.country].filter(Boolean).join(", "); return <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-2 py-1.5"><div className="flex min-w-0 items-center gap-2">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-9 w-9 rounded object-cover" /> : <Icon className="h-3.5 w-3.5 shrink-0 text-[#1a2e4a]" />}<div className="min-w-0"><div className="flex items-center gap-1.5"><span className="text-xs font-semibold text-[#1a2e4a]">{item.name}</span><span className="text-[10px] text-slate-400">{TRAVEL_LIBRARY_CATEGORY_LABELS[item.category]}</span></div>{itemLocation && <p className="mt-0.5 text-[11px] text-slate-500">{itemLocation}</p>}</div></div><div className="flex flex-wrap gap-1"><Button type="button" variant="outline" size="sm" onClick={() => openExistingItem(item)} className="h-7 bg-white px-2 text-[11px]"><Pencil className="mr-1 h-3 w-3" />Editar</Button><Button type="button" variant="outline" size="sm" onClick={() => importIntoBudget(item)} className="h-7 bg-white px-2 text-[11px]"><SendHorizontal className="mr-1 h-3 w-3" />Importar</Button>{item.linkUrl && <Button type="button" variant="outline" size="sm" asChild className="h-7 bg-white px-2 text-[11px]"><a href={item.linkUrl} target="_blank" rel="noreferrer">Abrir</a></Button>}<Button type="button" variant="outline" size="sm" onClick={() => void toggleFavorite(item)} disabled={favoriteMutation.isPending} className="h-7 border-amber-300 bg-amber-50 px-2 text-[11px] text-[#1a2e4a]"><Heart className="mr-1 h-3 w-3 fill-current" />Favorito</Button></div></div>; })}</div> : null}{favoriteRestaurantsQuery.isLoading ? <p className="text-xs text-slate-500">Carregando favoritos...</p> : favoriteRestaurants.length ? <div className="space-y-2 rounded-md border border-blue-100 bg-white p-2.5"><p className="text-xs font-bold text-[#1a2e4a]">Restaurantes favoritos</p>{favoriteRestaurants.map((favorite) => <div key={favorite.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-100 bg-slate-50 px-2 py-1.5"><div className="flex min-w-0 items-center gap-2">{favorite.photoUrl ? <img src={favorite.photoUrl} alt="" className="h-9 w-9 rounded object-cover" /> : <Heart className="h-3.5 w-3.5 shrink-0 text-[#1a2e4a]" />}<div className="min-w-0"><div className="flex items-center gap-1.5"><span className="text-xs font-semibold text-[#1a2e4a]">{favorite.name}</span><span className="text-[10px] text-slate-400">Favorito</span></div><p className="mt-0.5 text-[11px] text-slate-500">{favorite.address || favorite.location}</p></div></div><div className="flex flex-wrap gap-1">{favorite.mapsUrl && <Button type="button" variant="outline" size="sm" asChild className="h-7 bg-white px-2 text-[11px]"><a href={favorite.mapsUrl} target="_blank" rel="noreferrer">Ver endereço</a></Button>}{favorite.website && <Button type="button" variant="outline" size="sm" asChild className="h-7 bg-white px-2 text-[11px]"><a href={favorite.website} target="_blank" rel="noreferrer">Site / fotos</a></Button>}</div></div>)}</div> : !favoriteLibraryItems.length ? <p className="rounded-md border border-dashed border-blue-100 bg-white px-3 py-3 text-xs text-slate-500">Nenhum item foi marcado como favorito.</p> : null}</>}</div>
    }
  </section>;
}
