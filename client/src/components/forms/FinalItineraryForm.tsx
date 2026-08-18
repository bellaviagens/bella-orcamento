import { useEffect, useRef, useState } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, CalendarDays, CarFront, Copy, ExternalLink, FileText, GripVertical, Hotel, Link2, Luggage, Mail, MessageCircle, Phone, Plane, Plus, QrCode, Share2, Trash2, Upload, UserRound, Users, X } from "lucide-react";
import { DEFAULT_FINAL_ITINERARY_SHARE_MESSAGE, DEFAULT_FINAL_ITINERARY_WELCOME_MESSAGE } from "@shared/budgetTypes";
import type { FinalItineraryBaggageItem, FinalItineraryEventKind } from "@shared/budgetTypes";
import QRCode from "qrcode";

const EVENT_LABELS: Record<FinalItineraryEventKind, string> = {
  arrival: "Chegada",
  transfer: "Transfer",
  hotel: "Hospedagem",
  flight: "Voo",
  return: "Retorno",
  tour: "Passeio",
  custom: "Informação livre",
};

const EVENT_ORDER: Record<FinalItineraryEventKind, number> = {
  flight: 0,
  arrival: 1,
  transfer: 2,
  hotel: 3,
  tour: 4,
  return: 5,
  custom: 6,
};

const ACCEPTED_ATTACHMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;

function formatFileSize(size: number) {
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function FinalItineraryForm() {
  const {
    budget,
    updateFinalItinerary,
    addFinalItineraryEvent,
    updateFinalItineraryEvent,
    removeFinalItineraryEvent,
    reorderFinalItineraryEvents,
    addFlightToFinalItinerary,
    addHotelToFinalItinerary,
    addTourToFinalItinerary,
  } = useBudget();
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);
  const [uploadingEventId, setUploadingEventId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [coverImageError, setCoverImageError] = useState<string | null>(null);
  const [uploadingEventVisualId, setUploadingEventVisualId] = useState<string | null>(null);
  const [eventVisualError, setEventVisualError] = useState<string | null>(null);
  const [eventVisualErrorId, setEventVisualErrorId] = useState<string | null>(null);
  const [newPassengerName, setNewPassengerName] = useState("");
  const [attachmentPassengerByEvent, setAttachmentPassengerByEvent] = useState<Record<string, string>>({});
  const [newBaggageItemByPassenger, setNewBaggageItemByPassenger] = useState<Record<string, string>>({});
  const [shareUrl, setShareUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareExpiryDate, setShareExpiryDate] = useState("");
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [selectedWelcomeTemplateId, setSelectedWelcomeTemplateId] = useState("");
  const [newWelcomeTemplateName, setNewWelcomeTemplateName] = useState("");
  const attachmentInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const eventVisualInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const coverImageInput = useRef<HTMLInputElement | null>(null);
  const uploadAttachment = trpc.itineraryAttachments.upload.useMutation();
  const createSharedItinerary = trpc.sharedItineraries.create.useMutation();
  const revokeSharedItinerary = trpc.sharedItineraries.revoke.useMutation();
  const finalItinerary = budget.finalItinerary;
  const events = [...finalItinerary.events].sort((first, second) => first.day - second.day);
  const usefulLinks = finalItinerary.usefulLinks || [];
  const welcomeTemplates = finalItinerary.welcomeMessageTemplates || [];
  const shareMessageBody = finalItinerary.shareMessage?.trim() || DEFAULT_FINAL_ITINERARY_SHARE_MESSAGE;
  const shareMessage = shareUrl
    ? `${shareMessageBody}\n\nRoteiro “${finalItinerary.title || "Roteiro final da viagem"}”: ${shareUrl}`
    : "";
  const sharePreviewMessage = `${shareMessageBody}\n\nRoteiro “${finalItinerary.title || "Roteiro final da viagem"}”: ${shareUrl || "[link do roteiro será inserido aqui]"}`;
  const whatsappShareUrl = shareMessage ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}` : "";
  const emailShareUrl = shareMessage
    ? `mailto:?subject=${encodeURIComponent(`Roteiro de viagem — ${finalItinerary.title || "Bella Viagens e Milhas"}`)}&body=${encodeURIComponent(shareMessage)}`
    : "";

  const handleCoverImageSelection = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setCoverImageError("Use uma imagem em JPG, PNG ou WEBP para a capa.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setCoverImageError(`A imagem da capa deve ter no máximo ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
      return;
    }
    setCoverImageError(null);
    setUploadingCoverImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataBase64 = String(reader.result).split(",")[1];
        const uploaded = await uploadAttachment.mutateAsync({
          fileName: file.name,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
          dataBase64,
        });
        updateFinalItinerary({ enabled: true, coverImageUrl: uploaded.url });
      } catch (error) {
        setCoverImageError(error instanceof Error ? error.message : "Não foi possível enviar a imagem da capa.");
      } finally {
        setUploadingCoverImage(false);
        if (coverImageInput.current) coverImageInput.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEventVisualSelection = (eventId: string, file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setEventVisualError("Use JPG, PNG ou WEBP para o ícone ou imagem da atividade.");
      setEventVisualErrorId(eventId);
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setEventVisualError(`O arquivo deve ter no máximo ${formatFileSize(MAX_ATTACHMENT_SIZE)}.`);
      setEventVisualErrorId(eventId);
      return;
    }
    setEventVisualError(null);
    setEventVisualErrorId(null);
    setUploadingEventVisualId(eventId);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataBase64 = String(reader.result).split(",")[1];
        const uploaded = await uploadAttachment.mutateAsync({
          fileName: file.name,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
          dataBase64,
        });
        updateFinalItineraryEvent(eventId, { summaryVisualUrl: uploaded.url });
      } catch (error) {
        setEventVisualError(error instanceof Error ? error.message : "Não foi possível enviar o visual da atividade.");
        setEventVisualErrorId(eventId);
      } finally {
        setUploadingEventVisualId(null);
        const input = eventVisualInputs.current[eventId];
        if (input) input.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const reorder = (targetId: string) => {
    if (!draggedEventId || draggedEventId === targetId) return;
    const sourceIndex = events.findIndex((event) => event.id === draggedEventId);
    const targetIndex = events.findIndex((event) => event.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    if (events[sourceIndex].day !== events[targetIndex].day) return;
    const nextEvents = [...events];
    const [moved] = nextEvents.splice(sourceIndex, 1);
    nextEvents.splice(targetIndex, 0, moved);
    reorderFinalItineraryEvents(nextEvents);
  };

  const canReorderAt = (targetId: string) => {
    const source = events.find((event) => event.id === draggedEventId);
    const target = events.find((event) => event.id === targetId);
    return Boolean(source && target && source.id !== target.id && source.day === target.day);
  };

  const buildGoogleMapsUrl = (address: string) => address.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
    : "";

  const applyWelcomeTemplate = () => {
    const template = welcomeTemplates.find((item) => item.id === selectedWelcomeTemplateId);
    if (!template) return;
    updateFinalItinerary({ introMessage: template.message, enabled: true });
  };

  const saveWelcomeTemplate = () => {
    const name = newWelcomeTemplateName.trim();
    const message = finalItinerary.introMessage.trim();
    if (!name || !message) return;
    const template = { id: crypto.randomUUID(), name, message };
    updateFinalItinerary({ welcomeMessageTemplates: [...welcomeTemplates, template], enabled: true });
    setSelectedWelcomeTemplateId(template.id);
    setNewWelcomeTemplateName("");
  };

  const removeWelcomeTemplate = () => {
    if (!selectedWelcomeTemplateId) return;
    updateFinalItinerary({ welcomeMessageTemplates: welcomeTemplates.filter((item) => item.id !== selectedWelcomeTemplateId), enabled: true });
    setSelectedWelcomeTemplateId("");
  };

  const addPassenger = () => {
    const name = newPassengerName.trim();
    if (!name) return;
    updateFinalItinerary({ enabled: true, passengers: [...(finalItinerary.passengers || []), { id: crypto.randomUUID(), name }] });
    setNewPassengerName("");
  };

  const removePassenger = (passengerId: string) => {
    finalItinerary.events.forEach((event) => {
      if (event.attachments?.some((attachment) => attachment.passengerId === passengerId)) {
        updateFinalItineraryEvent(event.id, { attachments: event.attachments.map((attachment) => attachment.passengerId === passengerId ? { ...attachment, passengerId: undefined } : attachment) });
      }
    });
    updateFinalItinerary({ passengers: (finalItinerary.passengers || []).filter((passenger) => passenger.id !== passengerId) });
  };

  const updatePassengerChecklist = (passengerId: string, updater: (items: FinalItineraryBaggageItem[]) => FinalItineraryBaggageItem[]) => {
    updateFinalItinerary({
      passengers: (finalItinerary.passengers || []).map((passenger) => passenger.id === passengerId
        ? { ...passenger, baggageChecklist: updater(passenger.baggageChecklist || []) }
        : passenger),
      enabled: true,
    });
  };

  const addBaggageItem = (passengerId: string) => {
    const label = (newBaggageItemByPassenger[passengerId] || "").trim();
    if (!label) return;
    updatePassengerChecklist(passengerId, (items) => [...items, { id: crypto.randomUUID(), label, packed: false }]);
    setNewBaggageItemByPassenger((current) => ({ ...current, [passengerId]: "" }));
  };

  const createShareLink = async () => {
    setShareError(null);
    setShareCopied(false);
    try {
      const expiresAt = shareExpiryDate ? new Date(`${shareExpiryDate}T23:59:59.999`).toISOString() : undefined;
      const response = await createSharedItinerary.mutateAsync({ snapshot: JSON.stringify(budget), expiresAt });
      updateFinalItinerary({ shareToken: response.token, shareExpiresAt: response.expiresAt ?? undefined, enabled: true });
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Não foi possível criar o link compartilhável.");
    }
  };

  const revokeShareLink = async () => {
    if (!finalItinerary.shareToken) return;
    setShareError(null);
    try {
      await revokeSharedItinerary.mutateAsync({ token: finalItinerary.shareToken });
      updateFinalItinerary({ shareToken: undefined, shareExpiresAt: undefined, enabled: true });
      setShareUrl("");
      setQrCodeUrl("");
    } catch (error) {
      setShareError(error instanceof Error ? error.message : "Não foi possível revogar o link compartilhável.");
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      setShareError("Não foi possível copiar o link automaticamente. Você pode copiá-lo pelo campo abaixo.");
    }
  };

  useEffect(() => {
    const token = finalItinerary.shareToken;
    if (!token || typeof window === "undefined") {
      setShareUrl("");
      setQrCodeUrl("");
      return;
    }
    const url = `${window.location.origin}/roteiro/${token}`;
    setShareUrl(url);
    void QRCode.toDataURL(url, {
      width: 176,
      margin: 1,
      color: { dark: "#1a2e4a", light: "#ffffff" },
    }).then(setQrCodeUrl).catch(() => setQrCodeUrl(""));
  }, [finalItinerary.shareToken]);

  useEffect(() => {
    setShareExpiryDate(finalItinerary.shareExpiresAt?.slice(0, 10) || "");
  }, [finalItinerary.shareExpiresAt]);

  const handleAttachmentSelection = (eventId: string, file: File | undefined) => {
    if (!file) return;
    setAttachmentError(null);

    if (!ACCEPTED_ATTACHMENT_TYPES.includes(file.type)) {
      setAttachmentError("Selecione um arquivo PDF, JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setAttachmentError("Cada anexo pode ter no máximo 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setAttachmentError("Não foi possível ler o arquivo selecionado.");
    reader.onload = async () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const dataBase64 = result.split(",")[1] || "";
      if (!dataBase64) {
        setAttachmentError("Não foi possível preparar o arquivo para envio.");
        return;
      }

      setUploadingEventId(eventId);
      try {
        const attachment = await uploadAttachment.mutateAsync({
          fileName: file.name,
          contentType: file.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp",
          dataBase64,
        });
        const targetEvent = finalItinerary.events.find((item) => item.id === eventId);
        if (!targetEvent) return;
        const passengerId = attachmentPassengerByEvent[eventId];
        updateFinalItineraryEvent(eventId, { attachments: [...(targetEvent.attachments || []), { ...attachment, passengerId: passengerId || undefined }] });
      } catch (error) {
        setAttachmentError(error instanceof Error ? error.message : "Não foi possível enviar o anexo.");
      } finally {
        setUploadingEventId(null);
        const input = attachmentInputs.current[eventId];
        if (input) input.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
        <strong>Roteiro Final pós-aprovação.</strong> Use esta etapa somente quando os passeios forem aprovados. Ela é independente da proposta e reúne informações práticas para a viagem.
      </div>

      <div className="rounded-lg border border-[#1a2e4a]/15 bg-blue-50/60 p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a2e4a]"><CalendarDays className="h-4 w-4" />Capa e informações essenciais</div>
        <div className="grid gap-3">
          <div><Label htmlFor="final-title">Título</Label><Input id="final-title" value={finalItinerary.title} onChange={(event) => updateFinalItinerary({ title: event.target.value, enabled: true })} className="mt-1 bg-white" /></div>
          <div><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="final-intro">Mensagem de boas-vindas <span className="font-normal text-slate-500">(editável)</span></Label><Button type="button" variant="ghost" size="sm" onClick={() => updateFinalItinerary({ introMessage: DEFAULT_FINAL_ITINERARY_WELCOME_MESSAGE, enabled: true })} className="h-7 px-2 text-[11px] font-semibold text-[#1a2e4a] hover:bg-white">Restaurar mensagem padrão</Button></div><Textarea id="final-intro" value={finalItinerary.introMessage} onChange={(event) => updateFinalItinerary({ introMessage: event.target.value, enabled: true })} placeholder="Ex.: Olá, Suelen! Abaixo está o seu roteiro completo, com horários e contatos importantes." className="mt-1 min-h-20 bg-white" /><div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]"><Select value={selectedWelcomeTemplateId} onValueChange={setSelectedWelcomeTemplateId}><SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="Escolha um modelo salvo" /></SelectTrigger><SelectContent>{welcomeTemplates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="sm" onClick={applyWelcomeTemplate} disabled={!selectedWelcomeTemplateId} className="h-9 bg-white text-xs">Aplicar modelo</Button><Button type="button" variant="ghost" size="sm" onClick={removeWelcomeTemplate} disabled={!selectedWelcomeTemplateId} className="h-9 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div><div className="mt-2 flex gap-2"><Input value={newWelcomeTemplateName} onChange={(event) => setNewWelcomeTemplateName(event.target.value)} placeholder="Nome para salvar este modelo" className="h-9 bg-white text-xs" /><Button type="button" variant="outline" size="sm" onClick={saveWelcomeTemplate} disabled={!newWelcomeTemplateName.trim() || !finalItinerary.introMessage.trim()} className="h-9 shrink-0 bg-white text-xs"><Plus className="mr-1 h-3.5 w-3.5" />Salvar modelo</Button></div><p className="mt-1.5 text-[11px] text-slate-500">Os modelos ficam salvos no rascunho para você alternar rapidamente entre mensagens como Lua de mel e Viagem em família.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="final-cover-mode">Modelo da capa</Label><Select value={finalItinerary.coverMode || "detailed"} onValueChange={(value) => updateFinalItinerary({ enabled: true, coverMode: value as "compact" | "detailed" })}><SelectTrigger id="final-cover-mode" className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="detailed">Detalhada — imagem, resumo diário e informações completas</SelectItem><SelectItem value="compact">Compacta — abertura mais enxuta e objetiva</SelectItem></SelectContent></Select><p className="mt-1 text-[11px] leading-relaxed text-slate-500">A escolha aparece no preview e no PDF do Roteiro Final.</p></div>
            <div><Label htmlFor="final-cover-image-url">Imagem do destino <span className="font-normal text-slate-500">(opcional)</span></Label><Input id="final-cover-image-url" value={finalItinerary.coverImageUrl || ""} onChange={(event) => updateFinalItinerary({ enabled: true, coverImageUrl: event.target.value })} placeholder="Cole a URL ou envie uma imagem" className="mt-1 bg-white" /><div className="mt-2 flex flex-wrap items-center gap-2"><input ref={coverImageInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleCoverImageSelection(event.target.files?.[0])} /><Button type="button" variant="outline" size="sm" onClick={() => coverImageInput.current?.click()} disabled={uploadingCoverImage} className="bg-white text-xs"><Upload className="mr-1.5 h-3.5 w-3.5" />{uploadingCoverImage ? "Enviando imagem..." : "Enviar imagem"}</Button>{finalItinerary.coverImageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => updateFinalItinerary({ coverImageUrl: "" })} className="h-8 text-xs text-slate-500 hover:text-red-600"><X className="mr-1 h-3.5 w-3.5" />Remover</Button>}</div>{coverImageError && <p className="mt-1.5 text-xs font-medium text-red-600">{coverImageError}</p>}{finalItinerary.coverImageUrl && <img src={finalItinerary.coverImageUrl} alt="Prévia da imagem de capa do destino" className="mt-2 h-20 w-full rounded-md border border-blue-100 object-cover" />}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="final-essential-info">Informações essenciais</Label><Textarea id="final-essential-info" value={finalItinerary.essentialInfo || ""} onChange={(event) => updateFinalItinerary({ essentialInfo: event.target.value, enabled: true })} placeholder="Ex.: Levar passaporte, chegar ao aeroporto com 3 horas de antecedência..." className="mt-1 min-h-24 bg-white" /></div>
            <div><Label htmlFor="final-emergency-contacts">Contatos de emergência</Label><Textarea id="final-emergency-contacts" value={finalItinerary.emergencyContacts || ""} onChange={(event) => updateFinalItinerary({ emergencyContacts: event.target.value, enabled: true })} placeholder="Ex.: Agência: +55...&#10;Transfer: +56...&#10;Seguro: +55..." className="mt-1 min-h-24 bg-white" /></div>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-[#1a2e4a]"><Share2 className="h-4 w-4" />Acesso rápido pelo celular</div>
        <p className="text-xs leading-relaxed text-slate-600">Crie um link público com uma cópia deste roteiro. O cliente poderá abrir a versão compartilhada no celular pelo link ou QR Code. Depois de alterar o roteiro, gere um novo link para enviar a versão atualizada.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,220px)_1fr]"><div><Label htmlFor="share-expiry" className="text-[11px]">Expira em <span className="font-normal text-slate-500">(opcional)</span></Label><Input id="share-expiry" type="date" value={shareExpiryDate} onChange={(event) => setShareExpiryDate(event.target.value)} min={new Date().toISOString().slice(0, 10)} className="mt-1 h-9 bg-white text-xs" /></div><p className="self-end pb-1 text-[11px] leading-relaxed text-slate-500">Sem uma data, o acesso permanece ativo até ser revogado. A expiração será aplicada ao próximo link gerado.</p></div>
        <div className="mt-3"><div className="flex flex-wrap items-center justify-between gap-2"><Label htmlFor="share-message" className="text-[11px]">Mensagem que acompanha o link <span className="font-normal text-slate-500">(editável)</span></Label><Button type="button" variant="outline" size="sm" onClick={() => setShowSharePreview((current) => !current)} className="h-7 bg-white px-2 text-[11px]"><FileText className="mr-1 h-3.5 w-3.5" />{showSharePreview ? "Ocultar prévia" : "Pré-visualizar mensagem"}</Button></div><Textarea id="share-message" value={finalItinerary.shareMessage ?? DEFAULT_FINAL_ITINERARY_SHARE_MESSAGE} onChange={(event) => updateFinalItinerary({ shareMessage: event.target.value, enabled: true })} placeholder="Ex.: Olá! Preparamos seu roteiro com todos os horários e contatos." className="mt-1 min-h-18 bg-white text-xs" /><p className="mt-1 text-[11px] text-slate-500">O link do roteiro é incluído automaticamente no final da mensagem de WhatsApp e e-mail.</p>{showSharePreview && <div className="mt-3 grid gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:grid-cols-2"><div><p className="flex items-center gap-1.5 text-[11px] font-bold text-[#1a2e4a]"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" />Como ficará no WhatsApp</p><div className="mt-2 rounded-lg rounded-tl-sm bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700 whitespace-pre-line">{sharePreviewMessage}</div></div><div><p className="flex items-center gap-1.5 text-[11px] font-bold text-[#1a2e4a]"><Mail className="h-3.5 w-3.5 text-[#1a2e4a]" />Como ficará no e-mail</p><div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700"><p className="font-semibold text-[#1a2e4a]">Assunto: Roteiro de viagem — {finalItinerary.title || "Bella Viagens e Milhas"}</p><p className="mt-2 whitespace-pre-line leading-relaxed">{sharePreviewMessage}</p></div></div></div>}</div>
        <div className="mt-3 flex flex-wrap gap-2"><Button type="button" onClick={createShareLink} disabled={createSharedItinerary.isPending} className="bg-[#1a2e4a] text-xs hover:bg-[#264566]"><QrCode className="mr-1.5 h-3.5 w-3.5" />{createSharedItinerary.isPending ? "Criando acesso..." : finalItinerary.shareToken ? "Atualizar link e QR Code" : "Criar link e QR Code"}</Button>{shareUrl && <Button type="button" variant="outline" onClick={copyShareLink} className="bg-white text-xs"><Copy className="mr-1.5 h-3.5 w-3.5" />{shareCopied ? "Link copiado" : "Copiar link"}</Button>}{finalItinerary.shareToken && <Button type="button" variant="outline" onClick={revokeShareLink} disabled={revokeSharedItinerary.isPending} className="border-red-200 bg-white text-xs text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 className="mr-1.5 h-3.5 w-3.5" />{revokeSharedItinerary.isPending ? "Revogando..." : "Revogar acesso"}</Button>}</div>
        {finalItinerary.shareToken && <p className="mt-2 text-[11px] text-slate-500">{finalItinerary.shareExpiresAt ? `Acesso ativo até ${new Date(`${finalItinerary.shareExpiresAt.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")}.` : "Acesso ativo sem data de expiração."}</p>}
        {shareUrl && <div className="mt-3 flex flex-col gap-3 rounded-lg border border-amber-200 bg-white p-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><Label htmlFor="shared-itinerary-url" className="text-[11px]">Link compartilhável</Label><Input id="shared-itinerary-url" value={shareUrl} readOnly onFocus={(event) => event.currentTarget.select()} className="mt-1 h-9 bg-slate-50 text-xs" /><a href={shareUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e4a] hover:text-amber-700"><ExternalLink className="h-3.5 w-3.5" />Abrir versão compartilhada</a><div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" asChild className="bg-[#1a2e4a] text-xs hover:bg-[#264566]"><a href={whatsappShareUrl} target="_blank" rel="noreferrer"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Enviar pelo WhatsApp</a></Button><Button type="button" size="sm" variant="outline" asChild className="bg-white text-xs"><a href={emailShareUrl}><Mail className="mr-1.5 h-3.5 w-3.5" />Enviar por e-mail</a></Button></div><p className="mt-2 text-[11px] text-slate-500">Escolha o passageiro no WhatsApp ou informe os destinatários na mensagem de e-mail.</p></div>{qrCodeUrl && <img src={qrCodeUrl} alt="QR Code do roteiro compartilhável" className="h-28 w-28 self-center rounded-md border border-slate-200 bg-white p-1" />}</div>}
        {shareError && <p className="mt-2 text-xs font-medium text-red-600">{shareError}</p>}
      </section>

      <section className="rounded-lg border border-[#1a2e4a]/15 bg-white p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a2e4a]"><Users className="h-4 w-4" />Passageiros para organização dos documentos</div>
        <div className="flex gap-2"><Input value={newPassengerName} onChange={(event) => setNewPassengerName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPassenger(); } }} placeholder="Nome do passageiro" className="bg-white" /><Button type="button" variant="outline" onClick={addPassenger} className="shrink-0 bg-white text-xs"><Plus className="mr-1 h-3.5 w-3.5" />Adicionar</Button></div>
        {(finalItinerary.passengers || []).length > 0 ? <div className="mt-3 space-y-3">{finalItinerary.passengers?.map((passenger) => <section key={passenger.id} className="rounded-lg border border-blue-100 bg-blue-50/50 p-3"><div className="flex items-center justify-between gap-2"><p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a2e4a]"><UserRound className="h-3.5 w-3.5" />{passenger.name}</p><button type="button" onClick={() => removePassenger(passenger.id)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600" title={`Remover ${passenger.name}`}><X className="h-3.5 w-3.5" />Remover</button></div><div className="mt-3 rounded-md border border-white bg-white p-2.5"><p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#1a2e4a]"><Luggage className="h-3.5 w-3.5" />Checklist de bagagem</p><div className="mt-2 flex gap-2"><Input value={newBaggageItemByPassenger[passenger.id] || ""} onChange={(event) => setNewBaggageItemByPassenger((current) => ({ ...current, [passenger.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addBaggageItem(passenger.id); } }} placeholder="Ex.: Adaptador de tomada" className="h-8 bg-white text-xs" /><Button type="button" variant="outline" size="sm" onClick={() => addBaggageItem(passenger.id)} className="h-8 shrink-0 bg-white text-xs"><Plus className="mr-1 h-3.5 w-3.5" />Item</Button></div>{(passenger.baggageChecklist || []).length > 0 ? <div className="mt-2 space-y-1.5">{passenger.baggageChecklist?.map((item) => <div key={item.id} className="flex items-center gap-2 rounded border border-slate-100 px-2 py-1.5"><input type="checkbox" checked={item.packed} onChange={() => updatePassengerChecklist(passenger.id, (items) => items.map((current) => current.id === item.id ? { ...current, packed: !current.packed } : current))} className="h-3.5 w-3.5 accent-[#1a2e4a]" aria-label={`Marcar ${item.label} como organizado`} /><span className={`min-w-0 flex-1 text-xs ${item.packed ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span><button type="button" onClick={() => updatePassengerChecklist(passenger.id, (items) => items.filter((current) => current.id !== item.id))} className="text-slate-400 hover:text-red-600" title={`Remover ${item.label}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div> : <p className="mt-2 text-xs text-slate-500">Adicione os itens que este passageiro precisa organizar.</p>}</div></section>)}</div> : <p className="mt-2 text-xs text-slate-500">Cadastre os passageiros para vincular cartões, reservas e comprovantes a cada pessoa.</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-3"><h4 className="text-sm font-bold text-[#1a2e4a]">Adicionar informações já cadastradas</h4><p className="mt-1 text-xs text-slate-500">Após abrir o orçamento salvo e selecionar <strong>Roteiro final</strong>, os passeios aprovados podem ser copiados abaixo sem redigitar. Dia, horário, descrição, endereço, foto e alertas são aproveitados; os cadastros originais permanecem intactos.</p></div>
        <div className="space-y-3">
          {budget.flights.length > 0 && <div><p className="mb-1.5 text-xs font-bold text-slate-600">Voos</p><div className="flex flex-wrap gap-2">{budget.flights.map((flight) => <Button key={flight.id} type="button" variant="outline" size="sm" onClick={() => addFlightToFinalItinerary(flight.id)} className="bg-white text-xs"><Plane className="mr-1.5 h-3.5 w-3.5" />{flight.type === "ida" ? "Adicionar voo de ida" : "Adicionar voo de retorno"}</Button>)}</div></div>}
          {budget.hotels.length > 0 && <div><p className="mb-1.5 text-xs font-bold text-slate-600">Hospedagem</p><div className="flex flex-wrap gap-2">{budget.hotels.map((hotel) => <Button key={hotel.id} type="button" variant="outline" size="sm" onClick={() => addHotelToFinalItinerary(hotel.id)} className="max-w-full bg-white text-xs"><Hotel className="mr-1.5 h-3.5 w-3.5" /><span className="truncate">{hotel.name}</span></Button>)}</div></div>}
          {budget.tours.length > 0 && <div><div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-slate-600">Passeios aprovados</p><Button type="button" variant="outline" size="sm" onClick={() => budget.tours.forEach((tour) => addTourToFinalItinerary(tour.id))} className="h-8 bg-white text-xs font-semibold"><Plus className="mr-1 h-3.5 w-3.5" />Adicionar todos os passeios</Button></div><p className="mb-2 text-[11px] leading-relaxed text-slate-500">Use <strong>Adicionar todos os passeios</strong> para aproveitar a proposta inteira, ou selecione somente os passeios aprovados abaixo.</p><div className="flex flex-wrap gap-2">{budget.tours.map((tour) => <Button key={tour.id} type="button" variant="outline" size="sm" onClick={() => addTourToFinalItinerary(tour.id)} className="max-w-full bg-white text-xs"><Building2 className="mr-1.5 h-3.5 w-3.5" /><span className="truncate">{tour.name}</span></Button>)}</div></div>}
        </div>
      </section>

      {events.length > 1 && <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-500"><GripVertical className="mr-1 inline h-3.5 w-3.5 text-[#1a2e4a]" />Arraste as atividades para reorganizá-las <strong className="font-semibold text-[#1a2e4a]">dentro do mesmo dia</strong>. Essa sequência será usada na capa, no roteiro e no PDF.</p>}
      {events.map((event) => (
        <article
          key={event.id}
          onDragOver={(nativeEvent) => { if (!canReorderAt(event.id)) return; nativeEvent.preventDefault(); setDragOverEventId(event.id); }}
          onDragLeave={() => dragOverEventId === event.id && setDragOverEventId(null)}
          onDrop={(nativeEvent) => { if (!canReorderAt(event.id)) return; nativeEvent.preventDefault(); reorder(event.id); setDraggedEventId(null); setDragOverEventId(null); }}
          className={`rounded-lg border p-3 ${dragOverEventId === event.id ? "border-[#1a2e4a] bg-blue-50" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2"><button type="button" draggable onDragStart={(nativeEvent) => { nativeEvent.dataTransfer.effectAllowed = "move"; setDraggedEventId(event.id); }} onDragEnd={() => { setDraggedEventId(null); setDragOverEventId(null); }} className="cursor-grab text-slate-400 hover:text-[#1a2e4a]" title={`Arraste para reordenar dentro do Dia ${event.day}`}><GripVertical className="h-5 w-5" /></button><span className="rounded-full bg-[#1a2e4a] px-2 py-1 text-xs font-bold text-white">Dia {event.day}</span><span className="text-sm font-bold text-[#1a2e4a]">{EVENT_LABELS[event.kind]}</span></div>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeFinalItineraryEvent(event.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700" title="Remover item"><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Tipo</Label><Select value={event.kind} onValueChange={(value) => updateFinalItineraryEvent(event.id, { kind: value as FinalItineraryEventKind })}><SelectTrigger className="mt-1 bg-white"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>Dia</Label><Input type="number" min="1" value={event.day} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { day: Math.max(1, Number(nativeEvent.target.value) || 1) })} className="mt-1 bg-white" /></div><div><Label>Horário</Label><Input value={event.time} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { time: nativeEvent.target.value })} placeholder="Ex.: 09:30" className="mt-1 bg-white" /></div></div>
            <div className="sm:col-span-2"><Label>Título</Label><Input value={event.title} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { title: nativeEvent.target.value })} placeholder="Ex.: Transfer irá buscar você no aeroporto" className="mt-1 bg-white" /></div>
            <div className="sm:col-span-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-3"><input ref={(node) => { eventVisualInputs.current[event.id] = node; }} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(nativeEvent) => handleEventVisualSelection(event.id, nativeEvent.target.files?.[0])} /><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold text-[#1a2e4a]">Ícone ou imagem no resumo da capa <span className="font-normal text-slate-500">(opcional)</span></p><p className="mt-0.5 text-[11px] text-slate-500">Envie JPG, PNG ou WEBP para identificar esta atividade. Sem arquivo, o ícone padrão do tipo continuará sendo usado.</p></div><Button type="button" variant="outline" size="sm" disabled={uploadingEventVisualId === event.id} onClick={() => eventVisualInputs.current[event.id]?.click()} className="bg-white text-xs"><Upload className="mr-1.5 h-3.5 w-3.5" />{uploadingEventVisualId === event.id ? "Enviando..." : "Enviar visual"}</Button></div>{event.summaryVisualUrl && <div className="mt-2 flex items-center gap-2"><img src={event.summaryVisualUrl} alt={`Visual personalizado de ${event.title || EVENT_LABELS[event.kind]}`} className="h-10 w-10 rounded-md border border-amber-200 bg-white object-cover" /><Button type="button" variant="ghost" size="sm" onClick={() => updateFinalItineraryEvent(event.id, { summaryVisualUrl: "" })} className="h-8 text-xs text-slate-500 hover:text-red-600"><X className="mr-1 h-3.5 w-3.5" />Usar ícone padrão</Button></div>}{eventVisualError && eventVisualErrorId === event.id && <p className="mt-2 text-xs font-medium text-red-600">{eventVisualError}</p>}</div>
            {event.kind === "hotel" && <>
              <div className="sm:col-span-2"><Label>Endereço da hospedagem</Label><Input value={event.hotelAddress || ""} onChange={(nativeEvent) => { const hotelAddress = nativeEvent.target.value; updateFinalItineraryEvent(event.id, { hotelAddress, hotelMapUrl: buildGoogleMapsUrl(hotelAddress) }); }} placeholder="Rua, número, bairro, cidade e país" className="mt-1 bg-white" /></div>
              <div><Label>Check-in</Label><Input type="date" value={event.hotelCheckIn || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { hotelCheckIn: nativeEvent.target.value })} className="mt-1 bg-white" /></div>
              <div><Label>Check-out</Label><Input type="date" value={event.hotelCheckOut || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { hotelCheckOut: nativeEvent.target.value })} className="mt-1 bg-white" /></div>
              {event.hotelMapUrl && <div className="sm:col-span-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-[#1a2e4a]"><span className="font-semibold">GPS do hotel pronto: </span><a href={event.hotelMapUrl} target="_blank" rel="noreferrer" className="underline hover:text-amber-700">abrir no Google Maps</a></div>}
            </>}
            {(event.kind === "flight" || event.kind === "return") && <>
              <div><Label>Companhia aérea</Label><Input value={event.flightAirline || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightAirline: nativeEvent.target.value })} placeholder="Ex.: LATAM" className="mt-1 bg-white" /></div>
              <div><Label>Número do voo</Label><Input value={event.flightNumber || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightNumber: nativeEvent.target.value })} placeholder="Ex.: LA 8123" className="mt-1 bg-white" /></div>
              <div><Label>Data do voo</Label><Input type="date" value={event.flightDate || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightDate: nativeEvent.target.value })} className="mt-1 bg-white" /></div>
              <div><Label>Localizador</Label><Input value={event.flightLocator || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightLocator: nativeEvent.target.value })} placeholder="Ex.: ABC123" className="mt-1 bg-white" /></div>
              <div><Label>Aeroporto de partida</Label><Input value={event.flightDepartureAirport || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightDepartureAirport: nativeEvent.target.value })} placeholder="Ex.: GRU" className="mt-1 bg-white" /></div>
              <div><Label>Horário de partida</Label><Input type="time" value={event.flightDepartureTime || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightDepartureTime: nativeEvent.target.value, time: nativeEvent.target.value })} className="mt-1 bg-white" /></div>
              <div><Label>Terminal de partida</Label><Input value={event.flightDepartureTerminal || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightDepartureTerminal: nativeEvent.target.value })} placeholder="Ex.: Terminal 3" className="mt-1 bg-white" /></div>
              <div><Label>Aeroporto de chegada</Label><Input value={event.flightArrivalAirport || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightArrivalAirport: nativeEvent.target.value })} placeholder="Ex.: SCL" className="mt-1 bg-white" /></div>
              <div><Label>Horário de chegada</Label><Input type="time" value={event.flightArrivalTime || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightArrivalTime: nativeEvent.target.value })} className="mt-1 bg-white" /></div>
              <div><Label>Terminal de chegada</Label><Input value={event.flightArrivalTerminal || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { flightArrivalTerminal: nativeEvent.target.value })} placeholder="Ex.: Terminal Internacional" className="mt-1 bg-white" /></div>
            </>}
            {(event.kind === "hotel" || event.kind === "flight" || event.kind === "return") && <div className="sm:col-span-2 rounded-lg border border-dashed border-[#1a2e4a]/30 bg-blue-50/60 p-3">
              <input
                ref={(node) => { attachmentInputs.current[event.id] = node; }}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(nativeEvent) => handleAttachmentSelection(event.id, nativeEvent.target.files?.[0])}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-xs font-bold text-[#1a2e4a]">{event.kind === "hotel" ? "Reserva e comprovantes da hospedagem" : "Cartões de embarque e comprovantes do voo"}</p><p className="mt-0.5 text-[11px] text-slate-500">{event.kind === "hotel" ? "Anexe PDF, JPG, PNG ou WEBP de até 8 MB." : "Escolha o passageiro abaixo e anexe o cartão de embarque em PDF ou imagem."}</p></div>
                <Button type="button" variant="outline" size="sm" disabled={uploadingEventId === event.id} onClick={() => attachmentInputs.current[event.id]?.click()} className="bg-white text-xs"><Upload className="mr-1.5 h-3.5 w-3.5" />{uploadingEventId === event.id ? "Enviando..." : event.kind === "hotel" ? "Anexar arquivo" : "Anexar cartão de embarque"}</Button>
              </div>
              {(finalItinerary.passengers || []).length > 0 && <div className="mt-3 max-w-xs"><Label className="text-[11px]">{event.kind === "hotel" ? "Vincular o próximo anexo a" : "Passageiro do cartão de embarque"}</Label><Select value={attachmentPassengerByEvent[event.id] || "general"} onValueChange={(value) => setAttachmentPassengerByEvent((current) => ({ ...current, [event.id]: value === "general" ? "" : value }))}><SelectTrigger className="mt-1 h-9 bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="general">Documento geral</SelectItem>{finalItinerary.passengers?.map((passenger) => <SelectItem key={passenger.id} value={passenger.id}>{passenger.name}</SelectItem>)}</SelectContent></Select></div>}
              {(event.attachments || []).length > 0 && <div className="mt-3 space-y-2">
                {(event.attachments || []).map((attachment) => { const passengerName = finalItinerary.passengers?.find((passenger) => passenger.id === attachment.passengerId)?.name; return <div key={attachment.id} className="flex min-w-0 items-center gap-2 rounded-md border border-blue-100 bg-white px-2.5 py-2"><FileText className="h-4 w-4 shrink-0 text-[#1a2e4a]" /><a href={attachment.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-[#1a2e4a] hover:text-amber-700 hover:underline">{attachment.name}</a>{passengerName && <span className="hidden shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#1a2e4a] sm:inline">{passengerName}</span>}<span className="shrink-0 text-[10px] text-slate-400">{formatFileSize(attachment.size)}</span><a href={attachment.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#1a2e4a]" title="Abrir anexo"><ExternalLink className="h-3.5 w-3.5" /></a><button type="button" onClick={() => updateFinalItineraryEvent(event.id, { attachments: (event.attachments || []).filter((attachmentItem) => attachmentItem.id !== attachment.id) })} className="text-slate-400 hover:text-red-600" title="Remover anexo"><X className="h-4 w-4" /></button></div>; })}
              </div>}
              {attachmentError && <p className="mt-2 text-xs font-medium text-red-600">{attachmentError}</p>}
            </div>}
            <div className="sm:col-span-2"><Label>Detalhes e observações</Label><Textarea value={event.description} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { description: nativeEvent.target.value })} placeholder="Escreva as orientações, contato, ponto de encontro ou qualquer informação importante." className="mt-1 min-h-20 bg-white" /></div>
            <div><Label>Link útil (WhatsApp, empresa ou cartão de embarque)</Label><Input type="url" value={event.linkUrl} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { linkUrl: nativeEvent.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
            <div><Label>Link do endereço (Google Maps)</Label><Input type="url" value={event.addressUrl || ""} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { addressUrl: nativeEvent.target.value })} placeholder="https://maps.google.com/..." className="mt-1 bg-white" /></div>
            <div><Label>Link da foto</Label><Input type="url" value={event.photoUrl} onChange={(nativeEvent) => updateFinalItineraryEvent(event.id, { photoUrl: nativeEvent.target.value })} placeholder="https://..." className="mt-1 bg-white" /></div>
          </div>
        </article>
      ))}

      {events.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500"><CarFront className="mx-auto mb-2 h-5 w-5 text-slate-400" />Adicione o primeiro compromisso prático ou reutilize os dados que já estão no orçamento.</div>}
      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#1a2e4a]">Dicas e Links Úteis</p><p className="mt-0.5 text-xs text-slate-600">Inclua transfer, aluguel de roupas, Instagram, WhatsApp e demais contatos práticos. Esta seção ficará ao final do roteiro.</p></div><Button type="button" variant="outline" size="sm" onClick={() => updateFinalItinerary({ usefulLinks: [...usefulLinks, { id: crypto.randomUUID(), title: "Nova dica", description: "", url: "" }] })} className="bg-white text-xs font-bold"><Plus className="mr-1.5 h-3.5 w-3.5" />Adicionar dica</Button></div>
        <div className="mt-3 space-y-3">{usefulLinks.map((usefulLink) => <div key={usefulLink.id} className="grid gap-3 rounded-lg border border-amber-100 bg-white p-3 sm:grid-cols-2"><div><Label>Título</Label><Input value={usefulLink.title} onChange={(event) => updateFinalItinerary({ usefulLinks: usefulLinks.map((item) => item.id === usefulLink.id ? { ...item, title: event.target.value } : item) })} placeholder="Ex.: Transfer aeroporto" className="mt-1" /></div><div><Label>Link (WhatsApp, Instagram ou site)</Label><Input type="url" value={usefulLink.url} onChange={(event) => updateFinalItinerary({ usefulLinks: usefulLinks.map((item) => item.id === usefulLink.id ? { ...item, url: event.target.value } : item) })} placeholder="https://..." className="mt-1" /></div><div className="sm:col-span-2"><div className="flex items-center justify-between gap-2"><Label>Descrição ou dica</Label><button type="button" onClick={() => updateFinalItinerary({ usefulLinks: usefulLinks.filter((item) => item.id !== usefulLink.id) })} className="text-xs font-semibold text-red-600 hover:text-red-700">Remover</button></div><Textarea value={usefulLink.description} onChange={(event) => updateFinalItinerary({ usefulLinks: usefulLinks.map((item) => item.id === usefulLink.id ? { ...item, description: event.target.value } : item) })} placeholder="Ex.: solicitar com antecedência pelo WhatsApp." className="mt-1 min-h-16" /></div></div>)}</div>
      </section>
      <Button type="button" variant="outline" onClick={() => addFinalItineraryEvent({ kind: "custom", title: "Novo compromisso" })} className="h-12 w-full text-base font-bold shadow-md"><Plus className="mr-2 h-5 w-5" />Adicionar informação ao roteiro final</Button>
      <p className="flex items-center gap-1.5 text-xs text-slate-500"><Link2 className="h-3.5 w-3.5" />O link pode ser do WhatsApp, empresa, cartão de embarque ou fotos. Ele será clicável no PDF.</p>
    </div>
  );
}
