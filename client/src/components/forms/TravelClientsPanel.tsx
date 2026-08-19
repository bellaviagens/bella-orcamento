import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, Download, FileText, Mail, MessageCircle, Paperclip, Pencil, Plus, Trash2, Upload, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getClientDocumentAlerts } from "./clientDocumentAlerts";
import { buildPassengerDocumentReminder, buildWhatsAppReminderUrl, getConsolidatedPassengerDocumentReports, getPassengerWhatsapp, groupClientAttachments, parseClientDocumentStorage, serializeClientDocumentStorage, type ClientAttachment, type ClientAttachmentDocumentType, type DocumentApprovalStatus } from "./clientDocumentManagement";

type TravelClientsPanelProps = {
  onUseClient: (name: string) => void;
  tripPeriod?: string;
  tripDestination?: string;
  passengerNames?: string[];
};

type ClientDraft = {
  name: string;
  whatsapp: string;
  email: string;
  document: string;
  passportNumber: string;
  passportExpiresAt: string;
  rgNumber: string;
  rgExpiresAt: string;
  visaNumber: string;
  visaExpiresAt: string;
  notes: string;
};

const EMPTY_CLIENT: ClientDraft = {
  name: "", whatsapp: "", email: "", document: "", passportNumber: "", passportExpiresAt: "", rgNumber: "", rgExpiresAt: "", visaNumber: "", visaExpiresAt: "", notes: "",
};
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

function optional(value: string) {
  return value.trim() || undefined;
}

function toPayload(draft: ClientDraft) {
  return {
    name: draft.name.trim(),
    whatsapp: optional(draft.whatsapp),
    email: optional(draft.email),
    document: optional(draft.document),
    passportNumber: optional(draft.passportNumber),
    passportExpiresAt: optional(draft.passportExpiresAt),
    rgNumber: optional(draft.rgNumber),
    rgExpiresAt: optional(draft.rgExpiresAt),
    visaNumber: optional(draft.visaNumber),
    visaExpiresAt: optional(draft.visaExpiresAt),
    notes: optional(draft.notes),
  };
}

function toDraft(client: Record<string, unknown>): ClientDraft {
  return {
    name: String(client.name || ""), whatsapp: String(client.whatsapp || ""), email: String(client.email || ""), document: String(client.document || ""),
    passportNumber: String(client.passportNumber || ""), passportExpiresAt: String(client.passportExpiresAt || ""),
    rgNumber: String(client.rgNumber || ""), rgExpiresAt: String(client.rgExpiresAt || ""),
    visaNumber: String(client.visaNumber || ""), visaExpiresAt: String(client.visaExpiresAt || ""), notes: String(client.notes || ""),
  };
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function formatDate(value?: string | null) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "Sem validade";
}

export function TravelClientsPanel({ onUseClient, tripPeriod, tripDestination, passengerNames = [] }: TravelClientsPanelProps) {
  const utils = trpc.useUtils();
  const clientsQuery = trpc.travelClients.list.useQuery();
  const createMutation = trpc.travelClients.create.useMutation();
  const updateMutation = trpc.travelClients.update.useMutation();
  const deleteMutation = trpc.travelClients.delete.useMutation();
  const importMutation = trpc.travelClients.import.useMutation();
  const uploadMutation = trpc.itineraryAttachments.upload.useMutation();
  const [draft, setDraft] = useState<ClientDraft>(EMPTY_CLIENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [attachmentPassengerName, setAttachmentPassengerName] = useState("");
  const [attachmentDocumentType, setAttachmentDocumentType] = useState<ClientAttachmentDocumentType>("other");
  const [attachmentExpiresAt, setAttachmentExpiresAt] = useState("");
  const [attachmentApprovalStatus, setAttachmentApprovalStatus] = useState<DocumentApprovalStatus>("pending");
  const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null);
  const [editingAttachmentExpiresAt, setEditingAttachmentExpiresAt] = useState("");
  const [editingAttachmentApprovalStatus, setEditingAttachmentApprovalStatus] = useState<DocumentApprovalStatus>("pending");
  const [passengerWhatsappDrafts, setPassengerWhatsappDrafts] = useState<Record<string, string>>({});
  const importInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const clients = clientsQuery.data || [];
  const selectedClient = useMemo(() => clients.find((client) => client.name === selectedName), [clients, selectedName]);
  const historyQuery = trpc.travelClients.history.useQuery({ clientName: selectedName || "_" }, { enabled: Boolean(selectedName) });
  const historyEntries = useMemo(() => [
    ...(historyQuery.data?.proposals || []).map((proposal) => ({ id: proposal.id, kind: "proposal" as const, label: proposal.proposalTitle || proposal.clientName, updatedAt: proposal.updatedAt })),
    ...(historyQuery.data?.drafts || []).map((savedDraft) => ({ id: savedDraft.id, kind: "draft" as const, label: savedDraft.label, updatedAt: savedDraft.updatedAt })),
  ].sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()), [historyQuery.data]);
  const selectedDraft = useMemo(() => selectedClient ? toDraft(selectedClient as unknown as Record<string, unknown>) : EMPTY_CLIENT, [selectedClient]);
  const documentStorage = useMemo(() => parseClientDocumentStorage(selectedClient?.documentsJson), [selectedClient?.documentsJson]);
  const attachments = documentStorage.attachments;
  const passengerWhatsapps = documentStorage.passengerWhatsapps;
  const groupedAttachments = useMemo(() => groupClientAttachments(attachments, selectedClient?.name), [attachments, selectedClient?.name]);
  const alerts = useMemo(() => getClientDocumentAlerts(selectedClient || {}, tripPeriod), [selectedClient, tripPeriod]);
  const passengerOptions = useMemo(() => Array.from(new Set([
    selectedClient?.name,
    ...passengerNames.map((passenger) => passenger.trim()),
  ].filter((passenger): passenger is string => Boolean(passenger?.trim())))), [passengerNames, selectedClient?.name]);
  const passengerReports = useMemo(() => getConsolidatedPassengerDocumentReports({
    destination: tripDestination,
    passengerNames: passengerOptions,
    primaryPassengerName: selectedClient?.name,
    clientDocuments: selectedClient,
    attachments,
  }), [attachments, passengerOptions, selectedClient, tripDestination]);

  const refreshClients = async () => {
    await utils.travelClients.list.invalidate();
  };

  const save = async () => {
    if (!draft.name.trim()) {
      toast.error("Informe o nome do cliente.");
      return;
    }
    try {
      const payload = toPayload(draft);
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast.success("Cadastro de cliente atualizado.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Cliente cadastrado.");
      }
      await refreshClients();
      setSelectedName(draft.name.trim());
      setDraft(EMPTY_CLIENT);
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o cliente.");
    }
  };

  const startEditing = () => {
    if (!selectedClient) return;
    setDraft(selectedDraft);
    setEditingId(selectedClient.id);
  };

  const remove = async () => {
    if (!selectedClient || !window.confirm(`Excluir o cadastro de “${selectedClient.name}”? O histórico de orçamentos não será apagado.`)) return;
    try {
      await deleteMutation.mutateAsync({ id: selectedClient.id });
      await refreshClients();
      setSelectedName("");
      toast.success("Cliente removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir este cliente.");
    }
  };

  const updateAttachments = async (nextAttachments: ClientAttachment[], nextPassengerWhatsapps = passengerWhatsapps) => {
    if (!selectedClient) return;
    try {
      await updateMutation.mutateAsync({
        id: selectedClient.id,
        ...toPayload(selectedDraft),
        documentsJson: serializeClientDocumentStorage({ attachments: nextAttachments, passengerWhatsapps: nextPassengerWhatsapps }),
      });
      await refreshClients();
      toast.success("Documentos do cliente atualizados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar os documentos.");
    }
  };

  const startAttachmentEditing = (attachment: ClientAttachment) => {
    setEditingAttachmentId(attachment.id);
    setEditingAttachmentExpiresAt(attachment.expiresAt || "");
    setEditingAttachmentApprovalStatus(attachment.approvalStatus || "pending");
  };

  const saveAttachmentMetadata = async (attachment: ClientAttachment) => {
    const requiresApproval = attachment.documentType === "visa" || attachment.documentType === "eta";
    await updateAttachments(attachments.map((item) => item.id === attachment.id ? {
      ...item,
      expiresAt: editingAttachmentExpiresAt || undefined,
      approvalStatus: requiresApproval ? editingAttachmentApprovalStatus : undefined,
    } : item));
    setEditingAttachmentId(null);
  };

  const savePassengerWhatsapp = async (passengerName: string, value: string) => {
    const nextPassengerWhatsapps = { ...passengerWhatsapps };
    if (value.trim()) nextPassengerWhatsapps[passengerName] = value.trim();
    else delete nextPassengerWhatsapps[passengerName];
    await updateAttachments(attachments, nextPassengerWhatsapps);
    setPassengerWhatsappDrafts((current) => {
      const next = { ...current };
      delete next[passengerName];
      return next;
    });
  };

  const openWhatsappReminder = (report: (typeof passengerReports)[number], whatsapp: string) => {
    if (!whatsapp.trim()) {
      toast.error(`Informe o WhatsApp de ${report.passengerName} para enviar o lembrete.`);
      return;
    }
    const message = buildPassengerDocumentReminder({
      passengerName: report.passengerName,
      destination: tripDestination,
      items: report.items,
    });
    window.open(buildWhatsAppReminderUrl(whatsapp, message), "_blank", "noopener,noreferrer");
  };

  const uploadAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedClient) return;
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
      toast.error("Envie um PDF, JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("O anexo deve ter no máximo 8 MB.");
      return;
    }
    try {
      const dataBase64 = await readAsDataUrl(file);
      const uploaded = await uploadMutation.mutateAsync({ fileName: file.name, contentType: file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number], dataBase64 });
      const passengerName = attachmentPassengerName.trim() || selectedClient.name;
      const needsApproval = attachmentDocumentType === "visa" || attachmentDocumentType === "eta";
      await updateAttachments([...attachments, {
        ...uploaded,
        passengerName,
        documentType: attachmentDocumentType === "other" ? undefined : attachmentDocumentType,
        expiresAt: attachmentExpiresAt || undefined,
        approvalStatus: needsApproval ? attachmentApprovalStatus : undefined,
      }]);
      setAttachmentPassengerName("");
      setAttachmentDocumentType("other");
      setAttachmentExpiresAt("");
      setAttachmentApprovalStatus("pending");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível anexar o documento.");
    }
  };

  const exportClients = () => {
    const exportable = clients.map((client) => ({
      name: client.name,
      whatsapp: client.whatsapp || undefined,
      email: client.email || undefined,
      document: client.document || undefined,
      passportNumber: client.passportNumber || undefined,
      passportExpiresAt: client.passportExpiresAt || undefined,
      rgNumber: client.rgNumber || undefined,
      rgExpiresAt: client.rgExpiresAt || undefined,
      visaNumber: client.visaNumber || undefined,
      visaExpiresAt: client.visaExpiresAt || undefined,
      notes: client.notes || undefined,
    }));
    const blob = new Blob([JSON.stringify({ clients: exportable }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clientes-bella-viagens.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importClients = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : parsed?.clients;
      if (!Array.isArray(items)) throw new Error("Use um arquivo JSON exportado pela área de clientes.");
      await importMutation.mutateAsync({ clients: items });
      await refreshClients();
      toast.success(`${items.length} cliente(s) importado(s).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar os clientes.");
    }
  };

  return <section className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-[#1a2e4a]" /><h2 className="text-base font-bold text-[#1a2e4a]">Cadastro de clientes</h2></div>
        <p className="mt-1 text-xs text-slate-500">Centralize contatos, documentos de viagem, anexos e histórico de propostas.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={exportClients} disabled={!clients.length} className="h-9 bg-white text-xs"><Download className="mr-1.5 h-3.5 w-3.5" />Exportar clientes</Button>
        <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending} className="h-9 bg-white text-xs"><Upload className="mr-1.5 h-3.5 w-3.5" />Importar JSON</Button>
        <input ref={importInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importClients(event)} />
        {selectedClient && <Button type="button" onClick={() => onUseClient(selectedClient.name)} className="h-9 bg-[#1a2e4a] px-3 text-xs font-bold text-white hover:bg-[#233f67]">Usar no orçamento atual</Button>}
      </div>
    </div>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1a2e4a]">{editingId ? "Editar cliente" : "Novo cliente"}</h3>
            {editingId && <Button type="button" variant="ghost" onClick={() => { setDraft(EMPTY_CLIENT); setEditingId(null); }} className="h-8 px-2 text-xs text-slate-600"><X className="mr-1 h-3.5 w-3.5" />Cancelar</Button>}
          </div>
          <div className="mt-3 grid gap-2">
            <div><Label>Nome</Label><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Suelen Vieira" className="mt-1 h-10 bg-white text-sm" /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div><Label>WhatsApp</Label><Input value={draft.whatsapp} onChange={(event) => setDraft((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="(11) 99999-9999" className="mt-1 h-10 bg-white text-sm" /></div>
              <div><Label>E-mail</Label><Input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="cliente@email.com" className="mt-1 h-10 bg-white text-sm" /></div>
            </div>
            <div><Label>CPF ou documento</Label><Input value={draft.document} onChange={(event) => setDraft((current) => ({ ...current, document: event.target.value }))} placeholder="Opcional" className="mt-1 h-10 bg-white text-sm" /></div>
            <div className="rounded-md border border-slate-200 bg-white p-2.5">
              <p className="text-xs font-bold text-[#1a2e4a]">Documentos de viagem</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div><Label className="text-[11px]">Passaporte</Label><Input value={draft.passportNumber} onChange={(event) => setDraft((current) => ({ ...current, passportNumber: event.target.value }))} placeholder="Número" className="mt-1 h-9 text-xs" /></div>
                <div><Label className="text-[11px]">Validade do passaporte</Label><Input type="date" value={draft.passportExpiresAt} onChange={(event) => setDraft((current) => ({ ...current, passportExpiresAt: event.target.value }))} className="mt-1 h-9 text-xs" /></div>
                <div><Label className="text-[11px]">RG</Label><Input value={draft.rgNumber} onChange={(event) => setDraft((current) => ({ ...current, rgNumber: event.target.value }))} placeholder="Número" className="mt-1 h-9 text-xs" /></div>
                <div><Label className="text-[11px]">Validade do RG</Label><Input type="date" value={draft.rgExpiresAt} onChange={(event) => setDraft((current) => ({ ...current, rgExpiresAt: event.target.value }))} className="mt-1 h-9 text-xs" /></div>
                <div><Label className="text-[11px]">Visto</Label><Input value={draft.visaNumber} onChange={(event) => setDraft((current) => ({ ...current, visaNumber: event.target.value }))} placeholder="Número" className="mt-1 h-9 text-xs" /></div>
                <div><Label className="text-[11px]">Validade do visto</Label><Input type="date" value={draft.visaExpiresAt} onChange={(event) => setDraft((current) => ({ ...current, visaExpiresAt: event.target.value }))} className="mt-1 h-9 text-xs" /></div>
              </div>
            </div>
            <div><Label>Observações</Label><Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Preferências, aniversários ou informações úteis." className="mt-1 min-h-20 bg-white text-sm" /></div>
          </div>
          <Button type="button" onClick={() => void save()} disabled={createMutation.isPending || updateMutation.isPending} className="mt-3 h-10 w-full bg-[#1a2e4a] text-xs font-bold text-white hover:bg-[#233f67]"><Plus className="mr-1.5 h-4 w-4" />{editingId ? "Salvar alterações" : "Salvar cliente"}</Button>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#1a2e4a]">Clientes cadastrados</h3>
          {clientsQuery.isLoading ? <p className="text-xs text-slate-500">Carregando clientes...</p> : clients.length ? <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {clients.map((client) => <Button key={client.id} type="button" variant="ghost" onClick={() => setSelectedName(client.name)} className={`h-auto w-full justify-start rounded-md border px-3 py-2 text-left ${client.name === selectedName ? "border-blue-200 bg-blue-50 text-[#1a2e4a]" : "border-slate-200 bg-white text-slate-600"}`}>
              <div className="min-w-0"><p className="truncate text-xs font-bold">{client.name}</p><p className="mt-0.5 truncate text-[11px] font-normal text-slate-500">{client.whatsapp || client.email || "Sem contato cadastrado"}</p></div>
            </Button>)}
          </div> : <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-500">Cadastre seu primeiro cliente para centralizar o histórico.</p>}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        {selectedClient ? <>
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-[#1a2e4a]">{selectedClient.name}</h3>
              <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                {selectedClient.whatsapp && <p className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{selectedClient.whatsapp}</p>}
                {selectedClient.email && <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedClient.email}</p>}
                {selectedClient.document && <p>Documento: {selectedClient.document}</p>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={startEditing} className="h-9 bg-white text-xs"><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void remove()} disabled={deleteMutation.isPending} className="h-9 border-red-200 bg-white text-xs text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button>
            </div>
          </div>
          {selectedClient.notes && <p className="mt-3 rounded-md bg-white p-2.5 text-xs leading-relaxed text-slate-600">{selectedClient.notes}</p>}

          <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#1a2e4a]">Documentos e validade</h4>
              <div className="flex items-center gap-2">
                <div className="min-w-40">
                  <Label htmlFor="attachment-passenger" className="sr-only">Vincular anexo a passageiro</Label>
                  <Input id="attachment-passenger" list="client-passengers" value={attachmentPassengerName} onChange={(event) => setAttachmentPassengerName(event.target.value)} placeholder={`Vincular a: ${selectedClient.name}`} className="h-8 bg-white text-xs" />
                  <datalist id="client-passengers">{passengerOptions.map((passenger) => <option key={passenger} value={passenger} />)}</datalist>
                </div>
                <select aria-label="Tipo do documento anexado" value={attachmentDocumentType} onChange={(event) => setAttachmentDocumentType(event.target.value as ClientAttachmentDocumentType)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
                  <option value="other">Tipo: outro documento</option>
                  <option value="passport">Passaporte</option>
                  <option value="rg">RG</option>
                  <option value="visa">Visto</option>
                  <option value="eta">Autorização eletrônica</option>
                </select>
                {(attachmentDocumentType === "visa" || attachmentDocumentType === "eta") && <>
                  <Input aria-label="Validade do visto ou autorização" type="date" value={attachmentExpiresAt} onChange={(event) => setAttachmentExpiresAt(event.target.value)} className="h-8 w-36 bg-white text-xs" />
                  <select aria-label="Status de aprovação" value={attachmentApprovalStatus} onChange={(event) => setAttachmentApprovalStatus(event.target.value as DocumentApprovalStatus)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700">
                    <option value="pending">Aguardando aprovação</option>
                    <option value="approved">Aprovado</option>
                    <option value="denied">Não aprovado</option>
                    <option value="not-required">Não aplicável</option>
                  </select>
                </>}
                <Button type="button" variant="outline" onClick={() => attachmentInputRef.current?.click()} disabled={uploadMutation.isPending || updateMutation.isPending} className="h-8 bg-white px-2 text-xs"><Paperclip className="mr-1 h-3.5 w-3.5" />Anexar documento</Button>
                <input ref={attachmentInputRef} type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => void uploadAttachment(event)} />
              </div>
            </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded border border-slate-100 p-2 text-xs"><p className="font-bold text-[#1a2e4a]">Passaporte</p><p className="mt-1 text-slate-600">{selectedClient.passportNumber || "Não informado"}</p><p className="text-slate-500">Validade: {formatDate(selectedClient.passportExpiresAt)}</p></div>
              <div className="rounded border border-slate-100 p-2 text-xs"><p className="font-bold text-[#1a2e4a]">RG</p><p className="mt-1 text-slate-600">{selectedClient.rgNumber || "Não informado"}</p><p className="text-slate-500">Validade: {formatDate(selectedClient.rgExpiresAt)}</p></div>
              <div className="rounded border border-slate-100 p-2 text-xs"><p className="font-bold text-[#1a2e4a]">Visto</p><p className="mt-1 text-slate-600">{selectedClient.visaNumber || "Não informado"}</p><p className="text-slate-500">Validade: {formatDate(selectedClient.visaExpiresAt)}</p></div>
            </div>

              <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/60 p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h5 className="text-xs font-bold text-[#1a2e4a]">Checklists individuais de documentação</h5><span className="text-[11px] text-slate-500">{tripDestination || "Informe o destino no orçamento"}</span></div>
              <p className="mt-1 text-[11px] text-slate-500">As regras são uma triagem operacional. Antes da emissão, confirme requisitos e elegibilidade na fonte oficial do país de destino.</p>
              <div className="mt-2 space-y-2">
                {passengerReports.map(({ passengerName, items }) => <div key={passengerName} className="rounded border border-blue-100 bg-white p-2">
                  <p className="mb-1.5 text-xs font-bold text-[#1a2e4a]">{passengerName}{passengerName === selectedClient.name ? " — passageiro principal" : " — acompanhante"}</p>
                  <div className="grid gap-1.5">{items.map((item) => <div key={item.id} className={`flex items-start gap-2 rounded border px-2 py-1.5 text-xs ${item.status === "ready" ? "border-blue-100 bg-slate-50" : item.status === "missing" || item.status === "denied" || item.status === "expired" ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                    {item.status === "ready" ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1a2e4a]" /> : item.status === "missing" ? <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <div><p className="font-semibold">{item.label}{item.status === "ready" ? " — regular" : item.status === "missing" ? " — pendente" : " — requer atenção"}</p><p className="text-[11px] opacity-80">{item.message}</p></div>
                  </div>)}</div>
                </div>)}
              </div>
            </div>

            <div className="mt-3 rounded-md border border-slate-200 bg-white p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h5 className="text-xs font-bold text-[#1a2e4a]">Relatório consolidado da viagem</h5><span className="text-[11px] text-slate-500">Pendências por passageiro</span></div>
              <div className="mt-2 space-y-2">
                {passengerReports.map((report) => <div key={`report-${report.passengerName}`} className={`rounded border p-2 ${report.pendingCount > 0 || report.attentionCount > 0 ? "border-amber-200 bg-amber-50/60" : "border-blue-100 bg-blue-50/50"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-[#1a2e4a]">{report.passengerName}</p><span className="text-[11px] font-semibold text-slate-600">{report.pendingCount ? `${report.pendingCount} pendência(s)` : "Sem pendências"}{report.attentionCount ? ` • ${report.attentionCount} alerta(s) de validade` : ""}</span></div>
                  {(report.pendingCount > 0 || report.attentionCount > 0) && <ul className="mt-1.5 space-y-1 text-[11px] text-slate-700">{report.items.filter((item) => item.status !== "ready").map((item) => <li key={`report-item-${item.id}`} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-700" /><span><strong>{item.label}:</strong> {item.message}</span></li>)}</ul>}
                </div>)}
              </div>
            </div>

            {alerts.length > 0 && <div className="mt-3 space-y-2">{alerts.map((alert) => <div key={`${alert.document}-${alert.expiresAt}`} className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><p>{alert.message}</p></div>)}</div>}

            {passengerReports.some((report) => report.pendingCount > 0 || report.attentionCount > 0) && <div className="mt-3 rounded-md border border-green-200 bg-green-50/60 p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><h5 className="text-xs font-bold text-[#1a2e4a]">Lembretes de pendências</h5><p className="mt-0.5 text-[11px] text-slate-600">O botão abre o WhatsApp com uma mensagem preparada para a pendência de cada passageiro.</p></div><MessageCircle className="h-4 w-4 text-green-700" /></div>
              <div className="mt-2 space-y-2">{passengerReports.filter((report) => report.pendingCount > 0 || report.attentionCount > 0).map((report) => {
                const storedWhatsapp = getPassengerWhatsapp(passengerWhatsapps, report.passengerName, report.passengerName === selectedClient.name ? selectedClient.whatsapp : "");
                const reminderWhatsapp = passengerWhatsappDrafts[report.passengerName] ?? storedWhatsapp;
                return <div key={`whatsapp-${report.passengerName}`} className="flex flex-wrap items-end gap-2 rounded border border-green-100 bg-white p-2">
                  <div className="min-w-48 flex-1"><Label className="text-[10px]">WhatsApp de {report.passengerName}</Label><Input value={reminderWhatsapp} onChange={(event) => setPassengerWhatsappDrafts((current) => ({ ...current, [report.passengerName]: event.target.value }))} placeholder="(11) 99999-9999" className="mt-1 h-8 bg-white text-xs" /></div>
                  <Button type="button" variant="outline" onClick={() => void savePassengerWhatsapp(report.passengerName, reminderWhatsapp)} disabled={updateMutation.isPending} className="h-8 bg-white px-2 text-[11px]"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Salvar contato</Button>
                  <Button type="button" variant="outline" onClick={() => openWhatsappReminder(report, reminderWhatsapp)} disabled={!reminderWhatsapp.trim()} className="h-8 border-green-200 bg-white px-2 text-[11px] text-green-800 hover:bg-green-100"><MessageCircle className="mr-1 h-3.5 w-3.5" />Lembrar {report.passengerName}</Button>
                </div>;
              })}</div>
              <p className="mt-2 text-[11px] text-slate-600">Para acompanhantes, informe e salve o WhatsApp próprio antes de enviar. O número do passageiro principal permanece disponível como contato principal.</p>
            </div>}

            <div className="mt-3 space-y-2">
              {groupedAttachments.length ? groupedAttachments.map((group) => <div key={group.passengerName} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <p className="mb-1.5 text-xs font-bold text-[#1a2e4a]">{group.passengerName}</p>
                <div className="space-y-1.5">{group.attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2 py-1.5"><div className="min-w-0"><a href={attachment.url} target="_blank" rel="noreferrer" className="block truncate text-xs font-medium text-[#1a2e4a] underline">{attachment.name}</a>{(attachment.documentType === "visa" || attachment.documentType === "eta") && <p className="mt-0.5 text-[10px] text-slate-500">{attachment.documentType === "eta" ? "Autorização eletrônica" : "Visto"} • {attachment.approvalStatus === "approved" ? "Aprovado" : attachment.approvalStatus === "denied" ? "Não aprovado" : attachment.approvalStatus === "not-required" ? "Não aplicável" : "Aguardando aprovação"}{attachment.expiresAt ? ` • validade ${formatDate(attachment.expiresAt)}` : ""}</p>}</div><Button type="button" variant="ghost" onClick={() => void updateAttachments(attachments.filter((item) => item.id !== attachment.id))} className="h-7 px-1.5 text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`Excluir ${attachment.name}`}><Trash2 className="h-3.5 w-3.5" /></Button></div>)}</div>
              </div>) : <p className="rounded border border-dashed border-slate-200 p-2 text-xs text-slate-500">Anexe passaporte, RG, visto ou outros comprovantes em PDF ou imagem de até 8 MB.</p>}
            </div>

            {attachments.length > 0 && <div className="mt-3 rounded-md border border-slate-200 bg-white p-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h5 className="text-xs font-bold text-[#1a2e4a]">Editar dados dos anexos</h5><span className="text-[11px] text-slate-500">Atualize validade e aprovação sem enviar o arquivo novamente</span></div>
              <div className="mt-2 space-y-2">{attachments.map((attachment) => {
                const requiresApproval = attachment.documentType === "visa" || attachment.documentType === "eta";
                const isEditingAttachment = editingAttachmentId === attachment.id;
                const statusLabel = attachment.approvalStatus === "approved" ? "Aprovado" : attachment.approvalStatus === "denied" ? "Não aprovado" : attachment.approvalStatus === "not-required" ? "Não aplicável" : "Aguardando aprovação";
                return <div key={`metadata-${attachment.id}`} className="rounded border border-slate-200 bg-slate-50 p-2"><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#1a2e4a]">{attachment.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{attachment.expiresAt ? `Validade: ${formatDate(attachment.expiresAt)}` : "Validade não informada"}{requiresApproval ? ` • ${statusLabel}` : ""}</p></div><Button type="button" variant="outline" onClick={() => startAttachmentEditing(attachment)} className="h-7 bg-white px-2 text-[11px]"><Pencil className="mr-1 h-3 w-3" />Editar</Button></div>{isEditingAttachment && <div className="mt-2 flex flex-wrap items-end gap-2 rounded border border-blue-100 bg-blue-50/60 p-2"><div><Label className="text-[10px]">Validade</Label><Input type="date" value={editingAttachmentExpiresAt} onChange={(event) => setEditingAttachmentExpiresAt(event.target.value)} className="mt-1 h-8 w-36 bg-white text-xs" /></div>{requiresApproval && <div><Label className="text-[10px]">Status de aprovação</Label><select value={editingAttachmentApprovalStatus} onChange={(event) => setEditingAttachmentApprovalStatus(event.target.value as DocumentApprovalStatus)} className="mt-1 h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"><option value="pending">Aguardando aprovação</option><option value="approved">Aprovado</option><option value="denied">Não aprovado</option><option value="not-required">Não aplicável</option></select></div>}<Button type="button" onClick={() => void saveAttachmentMetadata(attachment)} disabled={updateMutation.isPending} className="h-8 bg-[#1a2e4a] px-2 text-xs text-white hover:bg-[#233f67]"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Salvar</Button><Button type="button" variant="outline" onClick={() => setEditingAttachmentId(null)} className="h-8 bg-white px-2 text-xs">Cancelar</Button></div>}</div>;
              })}</div>
            </div>}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-[#1a2e4a]" /><h4 className="text-sm font-bold text-[#1a2e4a]">Histórico de orçamentos</h4></div>
            {historyQuery.isLoading ? <p className="mt-2 text-xs text-slate-500">Carregando histórico...</p> : historyEntries.length ? <div className="mt-2 space-y-2">{historyEntries.map((entry) => <div key={`${entry.kind}-${entry.id}`} className="rounded-md border border-slate-200 bg-white p-2.5"><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-[#1a2e4a]" /><p className="text-xs font-bold text-[#1a2e4a]">{entry.label}</p></div><p className="mt-1 text-[11px] text-slate-500">{entry.kind === "proposal" ? "Proposta de passeios" : "Orçamento salvo"} • {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}</p></div>)}</div> : <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">Ainda não há propostas ou orçamentos salvos para este cliente.</p>}
          </div>
        </> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><UserRound className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Selecione um cliente</p><p className="mt-1 max-w-xs text-xs text-slate-500">Veja documentos, alertas, anexos e histórico do cliente.</p></div>}
      </div>
    </div>
  </section>;
}
