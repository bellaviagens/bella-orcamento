import { getItineraryDayActivities, useBudget } from "@/contexts/BudgetContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, ChevronDown, ChevronUp, Copy, FilePlus2, FolderOpen, FolderPlus, GripVertical, Heart, Link2, Loader2, Plus, Save, Search, Share2, Tag, Trash2, UtensilsCrossed, X } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { createEmptyGastronomySearchDraft, createProposalTourFromActivity, favoriteRestaurantToGastronomyOption, filterRestaurantFavorites, sortRestaurantFavorites, type FavoriteRestaurantSort } from "./itineraryFormState";
import { TravelLibraryPanel } from "./TravelLibraryPanel";
import { travelLibraryLocationFromDestination } from "./travelLibraryLocation";
import { filterSavedTourProposals } from "./tourProposalListState";

export function ItineraryForm() {
  const { budget, addGastronomyToDay, addGastronomyToUsefulTips, addItineraryDay, addItineraryActivity, addTour, importItineraryFromQuotation, moveItineraryActivity, removeGastronomyOption, removeItineraryActivity, reorderItineraryActivities, replaceBudget, resetTourProposal, saveGastronomyOption, updateItineraryActivity, updateTour, updateTourProposal, updateItineraryDay, removeItineraryDay, reorderItineraryDays } = useBudget();
  const itinerary = budget.itinerary;
  const defaultTravelerCount = Math.max(1, Number.parseInt(budget.tripInfo.passengers, 10) || 1);
  const [quotationUrl, setQuotationUrl] = useState("");
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<string | null>(null);
  const knownDayIdsRef = useRef<Set<string>>(new Set(itinerary.map((day) => day.id)));
  const [collapsedDayIds, setCollapsedDayIds] = useState<Set<string>>(
    () => new Set(itinerary.map((day) => day.id)),
  );
  const [collapsedActivityIds, setCollapsedActivityIds] = useState<Set<string>>(() => new Set());
  const importQuotationMutation = trpc.importQuotationUrl.useMutation();
  const utils = trpc.useUtils();
  const saveProposalMutation = trpc.tourProposals.save.useMutation();
  const duplicateProposalMutation = trpc.tourProposals.duplicate.useMutation();
  const updateProposalStatusMutation = trpc.tourProposals.updateStatus.useMutation();
  const deleteProposalMutation = trpc.tourProposals.delete.useMutation();
  const saveToLibraryMutation = trpc.travelLibrary.create.useMutation();
  const [savedProposalSearch, setSavedProposalSearch] = useState("");
  const savedProposalsQuery = trpc.tourProposals.list.useQuery();
  const filteredSavedProposals = useMemo(
    () => filterSavedTourProposals(savedProposalsQuery.data || [], savedProposalSearch),
    [savedProposalSearch, savedProposalsQuery.data],
  );
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [showSavedProposals, setShowSavedProposals] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<{ id: string; clientName: string } | null>(null);
  const [gastronomyName, setGastronomyName] = useState("");
  const [gastronomyLocation, setGastronomyLocation] = useState("");
  const [gastronomyTargetDays, setGastronomyTargetDays] = useState<Record<string, string>>({});
  const gastronomySearchInput = useMemo(
    () => ({ name: gastronomyName.trim() || "—", location: gastronomyLocation.trim() || "—" }),
    [gastronomyLocation, gastronomyName],
  );
  const gastronomySearchQuery = trpc.gastronomy.search.useQuery(gastronomySearchInput, { enabled: false, retry: false });
  const favoriteRestaurantsQuery = trpc.favoriteRestaurants.list.useQuery();
  const saveFavoriteRestaurantMutation = trpc.favoriteRestaurants.save.useMutation();
  const deleteFavoriteRestaurantMutation = trpc.favoriteRestaurants.delete.useMutation();
  const updateFavoriteTagsMutation = trpc.favoriteRestaurants.updateTags.useMutation();
  const updateFavoriteDetailsMutation = trpc.favoriteRestaurants.updateDetails.useMutation();
  const shareFavoriteRestaurantsMutation = trpc.favoriteRestaurants.share.useMutation();
  const [favoriteSearch, setFavoriteSearch] = useState("");
  const [favoriteTagFilter, setFavoriteTagFilter] = useState("all");
  const [favoriteCollectionFilter, setFavoriteCollectionFilter] = useState("all");
  const [favoriteSort, setFavoriteSort] = useState<FavoriteRestaurantSort>("recent");
  const [favoriteTagDrafts, setFavoriteTagDrafts] = useState<Record<string, string>>({});
  const [favoriteCollectionDrafts, setFavoriteCollectionDrafts] = useState<Record<string, string>>({});
  const [favoritePriceRangeDrafts, setFavoritePriceRangeDrafts] = useState<Record<string, string>>({});
  const [favoritePersonalNoteDrafts, setFavoritePersonalNoteDrafts] = useState<Record<string, string>>({});
  const [sharedFavoritesUrl, setSharedFavoritesUrl] = useState("");
  const [gastronomySectionCollapsed, setGastronomySectionCollapsed] = useState(false);
  const [gastronomyOptionsCollapsed, setGastronomyOptionsCollapsed] = useState(false);
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

  const handleSaveFavoriteRestaurant = async (restaurant: { id: string; name: string; location: string; address: string; description: string; rating?: number; mapsUrl: string; website?: string; photoUrl?: string }) => {
    try {
      await saveFavoriteRestaurantMutation.mutateAsync({
        placeId: restaurant.id,
        name: restaurant.name,
        location: restaurant.location,
        address: restaurant.address,
        description: restaurant.description,
        rating: restaurant.rating,
        mapsUrl: restaurant.mapsUrl,
        website: restaurant.website,
        photoUrl: restaurant.photoUrl,
      });
      const destination = budget.tripInfo.destination.trim() || restaurant.location.trim();
      const location = travelLibraryLocationFromDestination(destination);
      await saveToLibraryMutation.mutateAsync({
        category: "restaurant",
        folderName: destination || "Restaurantes favoritos",
        destination: destination || undefined,
        country: location.country || undefined,
        city: location.city || undefined,
        name: restaurant.name,
        linkUrl: restaurant.website || restaurant.mapsUrl || undefined,
        imageUrl: restaurant.photoUrl || undefined,
        notes: [restaurant.address, restaurant.description, restaurant.rating ? `Avaliação: ${restaurant.rating}` : ""].filter(Boolean).join("\n"),
      });
      await utils.favoriteRestaurants.list.invalidate();
      await utils.travelLibrary.list.invalidate();
      toast.success(`${restaurant.name} foi salvo nos favoritos e na Biblioteca de Viagem.`);
    } catch (error) {
      console.error("Save favorite restaurant error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar este restaurante nos favoritos e na Biblioteca.");
    }
  };

  const handleUseFavoriteRestaurant = (favorite: NonNullable<typeof favoriteRestaurantsQuery.data>[number]) => {
    saveGastronomyOption(favoriteRestaurantToGastronomyOption(favorite));
    toast.success(`${favorite.name} foi adicionado às opções gastronômicas desta proposta.`);
  };

  const handleDeleteFavoriteRestaurant = async (id: string) => {
    try {
      await deleteFavoriteRestaurantMutation.mutateAsync({ id });
      await utils.favoriteRestaurants.list.invalidate();
      toast.success("Restaurante removido dos favoritos.");
    } catch (error) {
      console.error("Delete favorite restaurant error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível remover este favorito.");
    }
  };

  const favoriteRestaurants = favoriteRestaurantsQuery.data || [];
  const favoriteTags = useMemo(
    () => Array.from(new Set(favoriteRestaurants.flatMap((favorite) => favorite.tags || []))).sort((first, second) => first.localeCompare(second, "pt-BR")),
    [favoriteRestaurants],
  );
  const favoriteCollections = useMemo(
    () => Array.from(new Set(favoriteRestaurants.map((favorite) => favorite.collectionName?.trim()).filter((collection): collection is string => Boolean(collection)))).sort((first, second) => first.localeCompare(second, "pt-BR")),
    [favoriteRestaurants],
  );
  const filteredFavoriteRestaurants = useMemo(() => {
    return sortRestaurantFavorites(
      filterRestaurantFavorites(favoriteRestaurants, favoriteSearch, favoriteTagFilter, favoriteCollectionFilter),
      favoriteSort,
    );
  }, [favoriteRestaurants, favoriteSearch, favoriteTagFilter, favoriteCollectionFilter, favoriteSort]);

  const handleUpdateFavoriteTags = async (favorite: NonNullable<typeof favoriteRestaurantsQuery.data>[number], tags: string[]) => {
    try {
      await updateFavoriteTagsMutation.mutateAsync({ id: favorite.id, tags });
      await utils.favoriteRestaurants.list.invalidate();
    } catch (error) {
      console.error("Update favorite tags error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar as categorias do favorito.");
    }
  };

  const handleAddFavoriteTag = async (favorite: NonNullable<typeof favoriteRestaurantsQuery.data>[number]) => {
    const draft = favoriteTagDrafts[favorite.id]?.trim();
    if (!draft) return;
    const tags = favorite.tags || [];
    if (tags.some((tag) => tag.localeCompare(draft, "pt-BR", { sensitivity: "accent" }) === 0)) {
      toast.message("Esta categoria já está cadastrada para o restaurante.");
      return;
    }
    await handleUpdateFavoriteTags(favorite, [...tags, draft]);
    setFavoriteTagDrafts((current) => ({ ...current, [favorite.id]: "" }));
  };

  const handleUpdateFavoriteDetails = async (
    favorite: NonNullable<typeof favoriteRestaurantsQuery.data>[number],
    details: { collectionName: string; priceRange: string; personalNote: string },
  ) => {
    try {
      await updateFavoriteDetailsMutation.mutateAsync({
        id: favorite.id,
        collectionName: details.collectionName.trim() || undefined,
        priceRange: details.priceRange ? details.priceRange as "economica" | "moderada" | "alta" | "premium" : undefined,
        personalNote: details.personalNote.trim() || undefined,
      });
      await utils.favoriteRestaurants.list.invalidate();
      toast.success("Detalhes do favorito atualizados.");
    } catch (error) {
      console.error("Update favorite restaurant details error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar os detalhes do favorito.");
    }
  };

  const createFavoriteShareLink = async () => {
    if (filteredFavoriteRestaurants.length === 0) {
      toast.message("Não há restaurantes favoritos visíveis para compartilhar.");
      return null;
    }
    try {
      const shared = await shareFavoriteRestaurantsMutation.mutateAsync({ favoriteIds: filteredFavoriteRestaurants.map((favorite) => favorite.id) });
      const link = `${window.location.origin}/favoritos/${shared.token}`;
      setSharedFavoritesUrl(link);
      return link;
    } catch (error) {
      console.error("Share favorite restaurants error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o link da lista agora.");
      return null;
    }
  };

  const handleCopyFavoriteShareLink = async () => {
    const link = sharedFavoritesUrl || await createFavoriteShareLink();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link da lista de favoritos copiado.");
    } catch {
      toast.message("Link criado. Copie o endereço exibido abaixo.");
    }
  };

  const handleWhatsAppFavoriteShare = async () => {
    const link = sharedFavoritesUrl || await createFavoriteShareLink();
    if (!link) return;
    const message = `Confira esta lista de restaurantes favoritos da Bella Viagens e Milhas: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
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

  const handleLoadProposal = (id: string) => {
    setSelectedProposalId(id);
    setShowSavedProposals(false);
  };

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

  const handleDeleteProposal = async () => {
    if (!proposalToDelete) return;
    try {
      await deleteProposalMutation.mutateAsync({ id: proposalToDelete.id });
      await utils.tourProposals.list.invalidate();
      toast.success(`Proposta de ${proposalToDelete.clientName} excluída.`);
      setProposalToDelete(null);
    } catch (error) {
      console.error("Delete tour proposal error:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir a proposta.");
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

  const toggleActivityCollapsed = (activityId: string) => {
    setCollapsedActivityIds((current) => {
      const next = new Set(current);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const handleNewProposal = () => {
    resetTourProposal();
    setCollapsedDayIds(new Set());
    setCollapsedActivityIds(new Set());
    knownDayIdsRef.current = new Set();
    setQuotationUrl("");
    setSavedProposalSearch("");
    setShowSavedProposals(false);
    const emptyGastronomySearch = createEmptyGastronomySearchDraft();
    setGastronomyName(emptyGastronomySearch.name);
    setGastronomyLocation(emptyGastronomySearch.location);
    setGastronomyTargetDays(emptyGastronomySearch.targetDays);
    toast.success("Nova proposta iniciada. O Roteiro Final e as propostas salvas foram preservados.");
  };

  const createTourForActivity = (dayId: string, activity: { id: string; title: string; description: string; linkUrl: string; photoUrl: string }) => {
    const tourId = nanoid();
    const tour = createProposalTourFromActivity(activity, tourId, defaultTravelerCount);
    addTour(tour);
    updateItineraryActivity(dayId, activity.id, { tourId });
  };

  const saveCurrentToursToLibrary = async () => {
    if (!budget.tours.length) {
      toast.message("Cadastre ao menos um passeio completo para salvá-lo na Biblioteca.");
      return;
    }
    const destination = budget.tripInfo.destination.trim();
    try {
      await Promise.all(budget.tours.map((tour) => saveToLibraryMutation.mutateAsync({
        category: "tour",
        folderName: destination || "Passeios gerais",
        destination: destination || undefined,
        name: tour.name || "Passeio sem nome",
        contactName: tour.location || undefined,
        linkUrl: /^https?:\/\//i.test(tour.pageUrl || "") ? tour.pageUrl : undefined,
        imageUrl: /^https?:\/\//i.test(tour.photosUrl || "") ? tour.photosUrl : undefined,
        notes: [tour.description, tour.duration ? `Duração: ${tour.duration}` : ""].filter(Boolean).join("\n"),
      })));
      toast.success(`${budget.tours.length} passeio${budget.tours.length === 1 ? "" : "s"} salvo${budget.tours.length === 1 ? "" : "s"} na Biblioteca de Viagem.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar os passeios na Biblioteca.");
    }
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void saveCurrentToursToLibrary()} disabled={saveToLibraryMutation.isPending || budget.tours.length === 0} className="h-9 shrink-0 bg-white text-xs font-bold"><FolderPlus className="mr-1.5 h-4 w-4" />Salvar passeios na Biblioteca</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="h-9 shrink-0 bg-white text-xs font-bold"><FilePlus2 className="mr-1.5 h-4 w-4" />Nova proposta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-amber-200 bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#1a2e4a]">Iniciar uma nova proposta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os passeios, dias, dados do cliente, opções gastronômicas e resultados de busca desta proposta serão limpos. O Roteiro Final, as propostas salvas e seus restaurantes favoritos permanecerão preservados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleNewProposal} className="bg-[#1a2e4a] text-white hover:bg-[#12243d]">Limpar e iniciar nova proposta</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label htmlFor="proposal-client">Cliente</Label><Input id="proposal-client" value={budget.tourProposal.clientName || ""} onChange={(event) => updateTourProposal({ clientName: event.target.value })} placeholder="Ex.: Suelen Vieira" className="mt-1 bg-white" /></div>
          <div><Label htmlFor="proposal-title">Título da proposta</Label><Input id="proposal-title" value={budget.tourProposal.title} onChange={(event) => updateTourProposal({ title: event.target.value })} placeholder="Ex.: Passeios em Santiago" className="mt-1 bg-white" /></div>
          <div className="sm:col-span-2"><Label htmlFor="proposal-intro">Mensagem inicial</Label><Textarea id="proposal-intro" value={budget.tourProposal.introMessage} onChange={(event) => updateTourProposal({ introMessage: event.target.value })} placeholder="Olá! Preparamos estas opções de passeios para a sua viagem..." className="mt-1 min-h-16 bg-white" /></div>
	          <div><Label htmlFor="proposal-installments">Parcelamento</Label><Select value={String(budget.tourProposal.installments || 1)} onValueChange={(value) => updateTourProposal({ installments: Number(value) })}><SelectTrigger id="proposal-installments" className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">À vista</SelectItem><SelectItem value="2">2x</SelectItem><SelectItem value="3">3x</SelectItem><SelectItem value="4">4x</SelectItem><SelectItem value="5">5x</SelectItem><SelectItem value="6">6x</SelectItem><SelectItem value="8">8x</SelectItem><SelectItem value="10">10x</SelectItem><SelectItem value="12">12x</SelectItem></SelectContent></Select></div>
          <div><Label htmlFor="proposal-payment-method">Forma de pagamento</Label><Select value={budget.tourProposal.paymentMethod || "none"} onValueChange={(value) => updateTourProposal({ paymentMethod: value === "none" ? undefined : value as "card" | "cash" | "pix" | "other" })}><SelectTrigger id="proposal-payment-method" className="mt-1 bg-white"><SelectValue placeholder="Selecionar forma" /></SelectTrigger><SelectContent><SelectItem value="none">Selecionar forma</SelectItem><SelectItem value="card">Cartão</SelectItem><SelectItem value="cash">Dinheiro</SelectItem><SelectItem value="pix">PIX</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent></Select></div>
          <div><Label htmlFor="proposal-entry">Possui entrada?</Label><Select value={budget.tourProposal.hasEntry ? "yes" : "no"} onValueChange={(value) => updateTourProposal({ hasEntry: value === "yes", entryAmount: value === "yes" ? budget.tourProposal.entryAmount || 0 : 0 })}><SelectTrigger id="proposal-entry" className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no">Não</SelectItem><SelectItem value="yes">Sim</SelectItem></SelectContent></Select></div>
          {budget.tourProposal.hasEntry && <div><Label htmlFor="proposal-entry-amount">Valor da entrada</Label><Input id="proposal-entry-amount" type="number" min="0" step="0.01" value={budget.tourProposal.entryAmount || ""} onChange={(event) => updateTourProposal({ entryAmount: Math.max(0, Number(event.target.value) || 0) })} placeholder="R$ 0,00" className="mt-1 bg-white" /></div>}
          {budget.tourProposal.paymentMethod === "other" && <div className="sm:col-span-2"><Label htmlFor="proposal-payment-other">Identificação da forma de pagamento</Label><Input id="proposal-payment-other" value={budget.tourProposal.paymentMethodOtherLabel || ""} onChange={(event) => updateTourProposal({ paymentMethodOtherLabel: event.target.value })} placeholder="Ex.: Direto com agência" className="mt-1 bg-white" /></div>}
          <div className="sm:col-span-2"><Label htmlFor="proposal-payment">Detalhes da condição de pagamento</Label><Textarea id="proposal-payment" value={budget.tourProposal.paymentDetails} onChange={(event) => updateTourProposal({ paymentDetails: event.target.value })} placeholder="Ex.: Taxa inclusa, vencimento ou condições combinadas" className="mt-1 min-h-16 bg-white" /></div>
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
            <div className="text-right">
              <Button type="button" onClick={handleSaveProposal} disabled={saveProposalMutation.isPending} className="h-10 font-bold"><Save className="mr-2 h-4 w-4" />{saveProposalMutation.isPending ? "Salvando..." : "Salvar proposta de passeios"}</Button>
              <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-500">Salva somente os passeios para aprovação. Para guardar também voos e hotéis, use “Orçamento completo”.</p>
            </div>
            <Select onValueChange={handleLoadProposal} disabled={savedProposalsQuery.isLoading || selectedProposalQuery.isFetching}>
              <SelectTrigger className="h-10 flex-1"><FolderOpen className="mr-2 h-4 w-4" /><SelectValue placeholder={savedProposalsQuery.isLoading ? "Carregando propostas..." : "Abrir proposta já salva"} /></SelectTrigger>
              <SelectContent>{filteredSavedProposals.map((saved) => <SelectItem key={saved.id} value={saved.id}>{saved.clientName} — {saved.proposalTitle}</SelectItem>)}</SelectContent>
            </Select>
            </div>
            {!showSavedProposals && <div className="mt-2 flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => setShowSavedProposals(true)} className="h-9 bg-white text-xs font-semibold"><FolderOpen className="mr-1.5 h-3.5 w-3.5" />Ver propostas e clientes salvos</Button></div>}
            {showSavedProposals && <><div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={savedProposalSearch} onChange={(event) => setSavedProposalSearch(event.target.value)} placeholder="Buscar proposta pelo nome do cliente" className="h-9 bg-slate-50 pl-8 text-sm" />
            </div>
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
              {filteredSavedProposals.map((saved) => (
                <div key={saved.id} className="flex flex-col gap-2 rounded-md border border-slate-100 px-2.5 py-2 sm:flex-row sm:items-center">
                  <button type="button" onClick={() => handleLoadProposal(saved.id)} className="min-w-0 flex-1 text-left" title="Abrir proposta"><span className="block truncate text-xs font-bold text-[#1a2e4a]">{saved.clientName}</span><span className="block truncate text-[11px] text-slate-500">{saved.proposalTitle}</span></button>
                  <div className="flex items-center gap-1.5"><Select value={saved.status} onValueChange={(status: "pending" | "sent" | "approved") => handleProposalStatus(saved.id, status)} disabled={updateProposalStatusMutation.isPending}><SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="sent">Enviada</SelectItem><SelectItem value="approved">Aprovada</SelectItem></SelectContent></Select><Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleDuplicateProposal(saved.id)} disabled={duplicateProposalMutation.isPending} title="Duplicar proposta"><Copy className="mr-1 h-3.5 w-3.5" />Duplicar</Button><Button type="button" variant="outline" size="sm" className="h-8 border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => setProposalToDelete({ id: saved.id, clientName: saved.clientName })} disabled={deleteProposalMutation.isPending} title="Excluir proposta"><Trash2 className="h-3.5 w-3.5" /></Button></div>
                </div>
              ))}
              {!savedProposalsQuery.isLoading && filteredSavedProposals.length === 0 && <p className="px-1 py-2 text-xs text-slate-500">Nenhuma proposta encontrada para este cliente.</p>}
            </div></>}
          </div>
          <AlertDialog open={Boolean(proposalToDelete)} onOpenChange={(open) => { if (!open) setProposalToDelete(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir proposta de passeios?</AlertDialogTitle><AlertDialogDescription>{proposalToDelete ? `A proposta de ${proposalToDelete.clientName} será removida permanentemente. Essa ação não altera o orçamento que está aberto agora.` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void handleDeleteProposal()} className="bg-red-600 hover:bg-red-700">Excluir proposta</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
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
        <div className="mb-2 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#1a2e4a]"><UtensilsCrossed className="h-4 w-4 shrink-0" /> <span>Opções gastronômicas</span></div><Button type="button" variant="ghost" size="sm" onClick={() => setGastronomySectionCollapsed((current) => !current)} aria-expanded={!gastronomySectionCollapsed} className="h-10 min-w-24 shrink-0 px-3 text-xs text-slate-600 hover:bg-white hover:text-[#1a2e4a]"><ChevronDown className={`mr-1.5 h-4 w-4 transition-transform ${gastronomySectionCollapsed ? "" : "rotate-180"}`} />{gastronomySectionCollapsed ? "Abrir" : "Recolher"}</Button></div>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">Informe o nome e a região do restaurante. A busca retorna dados de localização para você validar antes de usar no roteiro.</p>
        {!gastronomySectionCollapsed && <>
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
            <div className="flex shrink-0 flex-wrap gap-1.5"><Button type="button" variant="outline" size="sm" onClick={() => handleSaveFavoriteRestaurant(result)} disabled={saveFavoriteRestaurantMutation.isPending} className="bg-white text-xs font-bold"><Heart className="mr-1 h-3.5 w-3.5" />Favorito</Button><Button type="button" variant="outline" size="sm" onClick={() => saveSearchedGastronomy(result)} className="bg-white text-xs font-bold">Validar e salvar</Button></div>
          </div>)}
        </div> : null}

        <div className="mt-3 border-t border-amber-200 pt-3">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-[#1a2e4a]"><Heart className="h-3.5 w-3.5" /> Restaurantes favoritos</div>{favoriteRestaurants.length ? <div className="flex flex-wrap gap-1.5"><Button type="button" variant="outline" size="sm" onClick={handleCopyFavoriteShareLink} disabled={shareFavoriteRestaurantsMutation.isPending} className="h-8 bg-white px-2 text-xs font-semibold"><Copy className="mr-1 h-3.5 w-3.5" />Copiar link</Button><Button type="button" variant="outline" size="sm" onClick={handleWhatsAppFavoriteShare} disabled={shareFavoriteRestaurantsMutation.isPending} className="h-8 bg-white px-2 text-xs font-semibold"><Share2 className="mr-1 h-3.5 w-3.5" />WhatsApp</Button></div> : null}</div>
          {favoriteRestaurants.length ? <><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_175px_170px]"><Input value={favoriteSearch} onChange={(event) => setFavoriteSearch(event.target.value)} placeholder="Pesquisar por nome, local ou categoria" className="h-9 bg-white text-xs" /><Select value={favoriteTagFilter} onValueChange={setFavoriteTagFilter}><SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="Todas as categorias" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{favoriteTags.map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}</SelectContent></Select><Select value={favoriteCollectionFilter} onValueChange={setFavoriteCollectionFilter}><SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="Todas as coleções" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as coleções</SelectItem>{favoriteCollections.map((collection) => <SelectItem key={collection} value={collection}>{collection}</SelectItem>)}</SelectContent></Select><Select value={favoriteSort} onValueChange={(value) => setFavoriteSort(value as FavoriteRestaurantSort)}><SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="Ordenar favoritos" /></SelectTrigger><SelectContent><SelectItem value="recent">Mais recentes</SelectItem><SelectItem value="rating_desc">Melhor avaliação</SelectItem><SelectItem value="price_asc">Menor faixa de preço</SelectItem><SelectItem value="price_desc">Maior faixa de preço</SelectItem></SelectContent></Select></div>{sharedFavoritesUrl ? <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-1.5 text-[11px] text-[#1a2e4a]"><Link2 className="h-3.5 w-3.5 shrink-0" /><a href={sharedFavoritesUrl} target="_blank" rel="noreferrer" className="truncate font-semibold underline">{sharedFavoritesUrl}</a></div> : null}</> : null}
          {favoriteRestaurantsQuery.isLoading ? <p className="mt-2 text-xs text-slate-500">Carregando favoritos...</p> : favoriteRestaurants.length ? <div className="mt-2 space-y-2">{filteredFavoriteRestaurants.length ? filteredFavoriteRestaurants.map((favorite) => {
            const collectionName = favoriteCollectionDrafts[favorite.id] ?? favorite.collectionName ?? "";
            const priceRange = favoritePriceRangeDrafts[favorite.id] ?? favorite.priceRange ?? "";
            const personalNote = favoritePersonalNoteDrafts[favorite.id] ?? favorite.personalNote ?? "";
            const saveDetails = () => void handleUpdateFavoriteDetails(favorite, { collectionName, priceRange, personalNote });
            return <div key={favorite.id} className="flex flex-col gap-2 rounded-md border border-amber-100 bg-white p-2 sm:flex-row sm:items-start sm:justify-between">
              {favorite.photoUrl && <img src={favorite.photoUrl} alt={`Foto de ${favorite.name}`} className="h-16 w-full rounded-md border border-slate-100 object-cover sm:w-20" />}
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#1a2e4a]">{favorite.name}</p><p className="truncate text-[11px] text-slate-500">{favorite.address || favorite.location}</p><div className="mt-1 flex flex-wrap items-center gap-1">{(favorite.tags || []).map((tag) => <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1a2e4a]"><Tag className="h-2.5 w-2.5" />{tag}<button type="button" onClick={() => handleUpdateFavoriteTags(favorite, (favorite.tags || []).filter((current) => current !== tag))} className="ml-0.5 rounded-full hover:bg-blue-100" aria-label={`Remover categoria ${tag}`}><X className="h-2.5 w-2.5" /></button></span>)}<div className="flex items-center"><Input value={favoriteTagDrafts[favorite.id] || ""} onChange={(event) => setFavoriteTagDrafts((current) => ({ ...current, [favorite.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleAddFavoriteTag(favorite); } }} placeholder="Ex.: jantar" className="h-6 w-24 rounded-r-none bg-slate-50 px-1.5 text-[10px]" /><Button type="button" variant="outline" size="sm" onClick={() => void handleAddFavoriteTag(favorite)} className="h-6 rounded-l-none bg-white px-1 text-[10px]" aria-label={`Adicionar categoria para ${favorite.name}`}><Plus className="h-3 w-3" /></Button></div></div><div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_155px]"><Input value={collectionName} onChange={(event) => setFavoriteCollectionDrafts((current) => ({ ...current, [favorite.id]: event.target.value }))} onBlur={saveDetails} placeholder="Coleção: Santiago 2027" className="h-8 bg-slate-50 text-[11px]" /><Select value={priceRange || "none"} onValueChange={(value) => { setFavoritePriceRangeDrafts((current) => ({ ...current, [favorite.id]: value === "none" ? "" : value })); void handleUpdateFavoriteDetails(favorite, { collectionName, priceRange: value === "none" ? "" : value, personalNote }); }}><SelectTrigger className="h-8 bg-slate-50 text-[11px]"><SelectValue placeholder="Faixa de preço" /></SelectTrigger><SelectContent><SelectItem value="none">Faixa de preço</SelectItem><SelectItem value="economica">Econômica</SelectItem><SelectItem value="moderada">Moderada</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent></Select></div><Textarea value={personalNote} onChange={(event) => setFavoritePersonalNoteDrafts((current) => ({ ...current, [favorite.id]: event.target.value }))} onBlur={saveDetails} placeholder="Notas pessoais: reserva, prato recomendado, horário..." className="mt-1.5 min-h-14 bg-slate-50 text-[11px]" /></div>
              <div className="flex flex-wrap gap-1"><Button type="button" variant="outline" size="sm" onClick={() => handleUseFavoriteRestaurant(favorite)} className="h-8 bg-white px-2 text-xs font-semibold">Usar no roteiro</Button><Button type="button" variant="outline" size="sm" onClick={() => handleDeleteFavoriteRestaurant(favorite.id)} disabled={deleteFavoriteRestaurantMutation.isPending} className="h-8 border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700"><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div>
            </div>;
          }) : <p className="py-2 text-xs text-slate-500">Nenhum favorito corresponde à pesquisa ou ao filtro selecionado.</p>}</div> : <p className="text-xs text-slate-500">Salve um resultado de busca como favorito para reutilizá-lo em outras propostas.</p>}
        </div>

        {(budget.gastronomyOptions || []).length ? <div className="mt-3 border-t border-amber-200 pt-3">
          <p className="mb-2 text-xs font-semibold text-[#1a2e4a]">Opções validadas</p>
          <div className="space-y-2">{(budget.gastronomyOptions || []).map((option) => <div key={option.id} className="rounded-md border border-amber-100 bg-white p-2.5">
            {option.photoUrl && <img src={option.photoUrl} alt={`Foto de ${option.name}`} className="mb-2 h-24 w-full rounded-md border border-slate-100 object-cover sm:hidden" />}
            <div className="min-w-0"><p className="text-sm font-bold text-[#1a2e4a]">{option.name}</p><p className="text-xs text-slate-600">{option.description || option.address}</p></div>
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2"><Button type="button" variant="outline" size="sm" asChild className="h-8 bg-white px-2 text-xs"><a href={option.mapsUrl} target="_blank" rel="noreferrer">Ver endereço</a></Button>{option.website && <Button type="button" variant="outline" size="sm" asChild className="h-8 bg-white px-2 text-xs"><a href={option.website} target="_blank" rel="noreferrer">Site / fotos</a></Button>}<Button type="button" variant="outline" size="sm" onClick={() => void handleSaveFavoriteRestaurant(option)} disabled={saveFavoriteRestaurantMutation.isPending || saveToLibraryMutation.isPending} className="h-8 bg-white px-2 text-xs font-semibold text-[#1a2e4a]"><Heart className="mr-1 h-3.5 w-3.5" />Favoritar + Biblioteca</Button><Button type="button" variant="outline" size="sm" className="h-8 border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => removeGastronomyOption(option.id)} title={`Excluir ${option.name}`} aria-label={`Excluir restaurante ${option.name}`}><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><Select value={gastronomyTargetDays[option.id] || "none"} onValueChange={(dayId) => setGastronomyTargetDays((current) => ({ ...current, [option.id]: dayId }))}><SelectTrigger className="h-8 bg-slate-50 text-xs"><SelectValue placeholder="Escolher dia para incluir" /></SelectTrigger><SelectContent><SelectItem value="none">Escolher dia para incluir</SelectItem>{itinerary.map((day) => <SelectItem key={day.id} value={day.id}>Dia {day.day} — {day.title || "Dia livre"}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" disabled={!gastronomyTargetDays[option.id] || gastronomyTargetDays[option.id] === "none"} onClick={() => { addGastronomyToDay(gastronomyTargetDays[option.id], option.id); toast.success(`${option.name} foi incluído na agenda do dia.`); }} className="h-8 bg-white text-xs font-semibold">Incluir no dia</Button><Button type="button" variant="outline" size="sm" onClick={() => { addGastronomyToUsefulTips(option.id); toast.success(`${option.name} foi incluído nas Dicas e Links Úteis.`); }} className="h-8 bg-white text-xs font-semibold">Enviar para dicas</Button></div>
          </div>)}</div>
        </div> : null}
        </>}
      </div>

      <TravelLibraryPanel />

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
          {isCollapsed && tour && <div className="mb-3 flex max-w-xs items-end gap-2"><div className="flex-1"><Label className="text-xs">{valueLabel} (R$)</Label><Input type="number" min="0" step="0.01" inputMode="decimal" value={quickValue || ""} onChange={(event) => updateTour(tour.id, { ...tour, [tour.pricingMode === "perPerson" ? "pricePerPerson" : "totalPrice"]: Math.max(0, Number(event.target.value) || 0) })} placeholder="Informe o valor" className="mt-1 h-9 bg-white text-sm font-semibold" /></div>{tour.pricingMode === "perPerson" && <span className="pb-2 text-xs text-slate-500">por adulto</span>}</div>}
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
                  const tourTotal = selectedTour?.pricingMode === "perPerson"
                    ? (Number(selectedTour.pricePerPerson) || 0) * Math.max(1, Number(selectedTour.travelerCount) || defaultTravelerCount) + (Number(selectedTour.childPrice) || 0) * Math.max(0, Number(selectedTour.childCount) || 0)
                    : Number(selectedTour?.totalPrice) || 0;
                  const isActivityCollapsed = collapsedActivityIds.has(activity.id);
                  return <div key={activity.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-center gap-2"><span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1a2e4a] px-1 text-[11px] font-bold text-white">{activityIndex + 1}</span><p className="text-xs font-bold uppercase tracking-wide text-[#1a2e4a]">Ordem do compromisso</p></div><div className="flex flex-wrap items-center gap-1"><Select disabled={itinerary.length < 2} onValueChange={(targetDayId) => { const targetDay = itinerary.find((currentDay) => currentDay.id === targetDayId); moveItineraryActivity(day.id, activity.id, targetDayId); toast.success(`${activity.title || "Compromisso"} movido para Dia ${targetDay?.day || ""}.`); }}><SelectTrigger className="h-7 w-44 bg-white text-xs font-semibold"><SelectValue placeholder="Mover para outro dia" /></SelectTrigger><SelectContent>{itinerary.filter((currentDay) => currentDay.id !== day.id).map((currentDay) => <SelectItem key={currentDay.id} value={currentDay.id}>Dia {currentDay.day} — {currentDay.title || "Dia livre"}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" className="h-7 bg-white px-2 text-xs font-semibold" disabled={activityIndex === 0} onClick={() => { const next = [...activities]; [next[activityIndex - 1], next[activityIndex]] = [next[activityIndex], next[activityIndex - 1]]; reorderItineraryActivities(day.id, next); }} title="Mover este compromisso uma posição acima">Subir</Button><Button type="button" variant="outline" size="sm" className="h-7 bg-white px-2 text-xs font-semibold" disabled={activityIndex === activities.length - 1} onClick={() => { const next = [...activities]; [next[activityIndex], next[activityIndex + 1]] = [next[activityIndex + 1], next[activityIndex]]; reorderItineraryActivities(day.id, next); }} title="Mover este compromisso uma posição abaixo">Descer</Button><Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => removeItineraryActivity(day.id, activity.id)} title="Remover compromisso"><Trash2 className="h-3.5 w-3.5" /></Button></div></div>
                    <div className="mb-2 flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={() => toggleActivityCollapsed(activity.id)} className="h-7 px-2 text-xs font-semibold text-[#1a2e4a] hover:bg-white" title={isActivityCollapsed ? "Abrir compromisso" : "Recolher compromisso"}>{isActivityCollapsed ? <><ChevronDown className="mr-1 h-3.5 w-3.5" />Abrir compromisso</> : <><ChevronUp className="mr-1 h-3.5 w-3.5" />Recolher compromisso</>}</Button></div>
                    {isActivityCollapsed ? <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><span className="font-semibold text-[#1a2e4a]">{activity.kind === "tour" ? "Passeio" : activity.kind === "flight" ? "Voo" : activity.kind === "meal" ? "Refeição" : "Compromisso"}:</span> {activity.title || "Sem título"}{activity.time ? ` • ${activity.time}` : ""}</p> : <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><Label>Tipo</Label><Select value={activity.kind} onValueChange={(kind: "tour" | "flight" | "meal" | "custom") => { updateItineraryActivity(day.id, activity.id, { kind }); if (kind === "tour" && !activity.tourId) createTourForActivity(day.id, activity); }}><SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flight">Voo / chegada</SelectItem><SelectItem value="tour">Passeio</SelectItem><SelectItem value="meal">Jantar / refeição</SelectItem><SelectItem value="custom">Outro compromisso</SelectItem></SelectContent></Select></div>
                      <div><Label>Horário</Label><Input type="time" value={activity.time} onChange={(event) => updateItineraryActivity(day.id, activity.id, { time: event.target.value })} className="mt-1 bg-white" /></div>
                      {activity.kind === "flight" && <div className="sm:col-span-2"><Label>Vincular voo cadastrado</Label><Select value={activity.flightId || "none"} onValueChange={(flightId) => { const nextFlight = flightId === "none" ? undefined : budget.flights.find((currentFlight) => currentFlight.id === flightId); const segment = nextFlight?.segments[0]; updateItineraryActivity(day.id, activity.id, { flightId: nextFlight?.id, title: nextFlight ? (nextFlight.type === "ida" ? "Voo de ida" : "Voo de retorno") : activity.title, time: segment?.departureTime || activity.time, description: nextFlight ? [segment?.airline, segment?.flightNumber, segment?.departureCity || segment?.departureAirport, segment?.arrivalCity || segment?.arrivalAirport].filter(Boolean).join(" • ") : activity.description }); }}><SelectTrigger className="mt-1 bg-white"><SelectValue placeholder="Escolher voo" /></SelectTrigger><SelectContent><SelectItem value="none">Preencher manualmente</SelectItem>{budget.flights.map((currentFlight) => <SelectItem key={currentFlight.id} value={currentFlight.id}>{currentFlight.type === "ida" ? "Voo de ida" : "Voo de retorno"}{currentFlight.segments[0]?.airline ? ` — ${currentFlight.segments[0].airline}` : ""}</SelectItem>)}</SelectContent></Select></div>}
                      {activity.kind === "tour" && !selectedTour && <div className="sm:col-span-2 rounded-md border border-dashed border-slate-300 bg-white p-3"><p className="text-xs text-slate-600">Adicione os dados completos deste passeio neste mesmo dia.</p><Button type="button" variant="outline" size="sm" onClick={() => createTourForActivity(day.id, activity)} className="mt-2 h-8 bg-white text-xs font-bold"><Plus className="mr-1 h-3.5 w-3.5" />Adicionar detalhes do passeio</Button></div>}
                      {activity.kind === "tour" && selectedTour && <div className="sm:col-span-2 rounded-md border border-blue-100 bg-blue-50/60 p-3"><div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-bold text-[#1a2e4a]">Detalhes completos do passeio</p><p className="mt-0.5 text-xs text-slate-500">Descrição, links, endereço, ingresso, valores e informações adicionais ficam reunidos aqui.</p></div>{tourTotal > 0 && <span className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-[#1a2e4a] shadow-sm">Total: {tourTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>}</div><div className="grid gap-3 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Nome do passeio</Label><Input value={selectedTour.name} onChange={(event) => { updateTour(selectedTour.id, { ...selectedTour, name: event.target.value }); updateItineraryActivity(day.id, activity.id, { title: event.target.value }); }} placeholder="Ex.: Vinícola e degustação" className="mt-1 bg-white" /></div><div><Label>Local</Label><Input value={selectedTour.location || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, location: event.target.value })} placeholder="Ex.: Vale do Casablanca" className="mt-1 bg-white" /></div><div><Label>Duração</Label><Input value={selectedTour.duration || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, duration: event.target.value })} placeholder="Ex.: 5 horas" className="mt-1 bg-white" /></div><div><Label>Forma de cobrança</Label><Select value={selectedTour.pricingMode || "total"} onValueChange={(pricingMode: "perPerson" | "total") => updateTour(selectedTour.id, { ...selectedTour, pricingMode })}><SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="perPerson">Preço individual</SelectItem><SelectItem value="total">Valor total do passeio</SelectItem></SelectContent></Select></div>{selectedTour.pricingMode === "perPerson" ? <><div><Label>Valor adulto (R$)</Label><Input type="number" min="0" step="0.01" value={selectedTour.pricePerPerson || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, pricePerPerson: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 bg-white" /></div><div><Label>Quantidade de adultos</Label><Input type="number" min="1" value={selectedTour.travelerCount || defaultTravelerCount} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, travelerCount: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 bg-white" /></div><div><Label>Valor criança (R$)</Label><Input type="number" min="0" step="0.01" value={selectedTour.childPrice || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, childPrice: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 bg-white" /></div><div><Label>Quantidade de crianças</Label><Input type="number" min="0" value={selectedTour.childCount || 0} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, childCount: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 bg-white" /></div></> : <div><Label>Valor total (R$)</Label><Input type="number" min="0" step="0.01" value={selectedTour.totalPrice || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, totalPrice: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 bg-white" /></div>}<div><Label>Link do site / página</Label><Input type="url" value={selectedTour.pageUrl || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, pageUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div><div><Label>Link do endereço</Label><Input type="url" value={activity.addressUrl || ""} onChange={(event) => updateItineraryActivity(day.id, activity.id, { addressUrl: event.target.value })} placeholder="https://maps..." className="mt-1 bg-white" /></div><div><Label>Link da foto ou álbum</Label><Input type="url" value={selectedTour.photosUrl || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, photosUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div><div><Label>Link para compra de ingresso</Label><Input type="url" value={activity.ticketUrl || ""} onChange={(event) => updateItineraryActivity(day.id, activity.id, { ticketUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div><div className="sm:col-span-2"><Label>Descrição completa</Label><Textarea value={selectedTour.description || ""} onChange={(event) => { updateTour(selectedTour.id, { ...selectedTour, description: event.target.value }); updateItineraryActivity(day.id, activity.id, { description: event.target.value }); }} placeholder="DESCRIÇÃO&#10;Apresentação do passeio.&#10;&#10;ROTEIRO&#10;- Primeiro ponto&#10;- Segundo ponto&#10;&#10;INCLUSO&#10;- Guia e transporte" className="mt-1 min-h-28 bg-white" /></div><div className="sm:col-span-2"><Label>Informações adicionais</Label><Textarea value={selectedTour.notes || ""} onChange={(event) => updateTour(selectedTour.id, { ...selectedTour, notes: event.target.value })} placeholder="Ex.: levar documento, saída do hotel às 8h ou condições do fornecedor" className="mt-1 min-h-20 bg-white" /></div><div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3"><Label className="text-amber-900">Alerta importante</Label><Textarea value={activity.importantNotes || ""} onChange={(event) => updateItineraryActivity(day.id, activity.id, { importantNotes: event.target.value })} placeholder="Ex.: comprar ingresso com antecedência, levar documento ou chegar 15 minutos antes." className="mt-1 min-h-16 border-amber-200 bg-white" /><p className="mt-1.5 text-[11px] text-amber-800">Essa mensagem aparecerá destacada em amarelo na proposta e no PDF.</p></div></div></div>}
                      {activity.kind !== "tour" && <><div className="sm:col-span-2"><Label>Título</Label><Input value={activity.title} onChange={(event) => updateItineraryActivity(day.id, activity.id, { title: event.target.value })} placeholder="Ex.: Chegada no hotel, passeio ou jantar" className="mt-1 bg-white" /></div><div className="sm:col-span-2"><Label>Detalhes</Label><Textarea value={activity.description} onChange={(event) => updateItineraryActivity(day.id, activity.id, { description: event.target.value })} placeholder="Horário, ponto de encontro, transfer ou demais orientações" className="mt-1 min-h-16 bg-white" /></div><div><Label>Link útil</Label><Input type="url" value={activity.linkUrl} onChange={(event) => updateItineraryActivity(day.id, activity.id, { linkUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div><div><Label>Link de foto</Label><Input type="url" value={activity.photoUrl} onChange={(event) => updateItineraryActivity(day.id, activity.id, { photoUrl: event.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div><div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-3"><Label className="text-amber-900">Observação importante</Label><Textarea value={activity.importantNotes || ""} onChange={(event) => updateItineraryActivity(day.id, activity.id, { importantNotes: event.target.value })} placeholder="Ex.: orientação ou cuidado importante para este compromisso" className="mt-1 min-h-16 border-amber-200 bg-white" /></div></>}
                    </div>
                    {(selectedTour || selectedFlight) && <p className="mt-2 text-[11px] text-slate-500">Dados vinculados ao {selectedTour ? "passeio" : "voo"} cadastrado. Você pode complementar os detalhes acima.</p>}</>}
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
