import { useMemo, useState } from "react";
import { CalendarDays, FileText, Mail, MessageCircle, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TravelClientsPanelProps = {
  onUseClient: (name: string) => void;
};

const EMPTY_CLIENT = { name: "", whatsapp: "", email: "", document: "", notes: "" };

export function TravelClientsPanel({ onUseClient }: TravelClientsPanelProps) {
  const utils = trpc.useUtils();
  const clientsQuery = trpc.travelClients.list.useQuery();
  const createMutation = trpc.travelClients.create.useMutation({ onSuccess: async () => { await utils.travelClients.list.invalidate(); toast.success("Cliente cadastrado."); } });
  const deleteMutation = trpc.travelClients.delete.useMutation({ onSuccess: async () => { await utils.travelClients.list.invalidate(); toast.success("Cliente removido."); } });
  const [draft, setDraft] = useState(EMPTY_CLIENT);
  const [selectedName, setSelectedName] = useState("");
  const clients = clientsQuery.data || [];
  const selectedClient = useMemo(() => clients.find((client) => client.name === selectedName), [clients, selectedName]);
  const historyQuery = trpc.travelClients.history.useQuery({ clientName: selectedName || "_" }, { enabled: Boolean(selectedName) });
  const historyEntries = useMemo(() => [
    ...(historyQuery.data?.proposals || []).map((proposal) => ({ id: proposal.id, kind: "proposal" as const, label: proposal.proposalTitle || proposal.clientName, updatedAt: proposal.updatedAt })),
    ...(historyQuery.data?.drafts || []).map((draft) => ({ id: draft.id, kind: "draft" as const, label: draft.label, updatedAt: draft.updatedAt })),
  ].sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()), [historyQuery.data]);

  const save = async () => {
    if (!draft.name.trim()) { toast.error("Informe o nome do cliente."); return; }
    try {
      await createMutation.mutateAsync({ name: draft.name.trim(), whatsapp: draft.whatsapp.trim() || undefined, email: draft.email.trim() || undefined, document: draft.document.trim() || undefined, notes: draft.notes.trim() || undefined });
      setSelectedName(draft.name.trim());
      setDraft(EMPTY_CLIENT);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível cadastrar o cliente."); }
  };

  const remove = async () => {
    if (!selectedClient || !window.confirm(`Excluir o cadastro de “${selectedClient.name}”? O histórico de orçamentos não será apagado.`)) return;
    try { await deleteMutation.mutateAsync({ id: selectedClient.id }); setSelectedName(""); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível excluir este cliente."); }
  };

  return <section className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5">
    <div className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><UserRound className="h-5 w-5 text-[#1a2e4a]" /><h2 className="text-base font-bold text-[#1a2e4a]">Cadastro de clientes</h2></div><p className="mt-1 text-xs text-slate-500">Guarde contatos e localize rapidamente o histórico de propostas e orçamentos.</p></div>{selectedClient && <Button type="button" onClick={() => onUseClient(selectedClient.name)} className="h-10 bg-[#1a2e4a] px-3 text-xs font-bold text-white hover:bg-[#233f67]">Usar no orçamento atual</Button>}</div>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-4"><div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3"><h3 className="text-sm font-bold text-[#1a2e4a]">Novo cliente</h3><div className="mt-3 grid gap-2"><div><Label>Nome</Label><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Suelen Vieira" className="mt-1 h-10 bg-white text-sm" /></div><div><Label>WhatsApp</Label><Input value={draft.whatsapp} onChange={(event) => setDraft((current) => ({ ...current, whatsapp: event.target.value }))} placeholder="Ex.: (11) 99999-9999" className="mt-1 h-10 bg-white text-sm" /></div><div><Label>E-mail</Label><Input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="cliente@email.com" className="mt-1 h-10 bg-white text-sm" /></div><div><Label>CPF ou documento</Label><Input value={draft.document} onChange={(event) => setDraft((current) => ({ ...current, document: event.target.value }))} placeholder="Opcional" className="mt-1 h-10 bg-white text-sm" /></div><div><Label>Observações</Label><Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Preferências, aniversários ou informações úteis." className="mt-1 min-h-20 bg-white text-sm" /></div></div><Button type="button" onClick={() => void save()} disabled={createMutation.isPending} className="mt-3 h-10 w-full bg-[#1a2e4a] text-xs font-bold text-white hover:bg-[#233f67]"><Plus className="mr-1.5 h-4 w-4" />Salvar cliente</Button></div><div><h3 className="mb-2 text-sm font-bold text-[#1a2e4a]">Clientes cadastrados</h3>{clientsQuery.isLoading ? <p className="text-xs text-slate-500">Carregando clientes...</p> : clients.length ? <div className="space-y-1.5">{clients.map((client) => <Button key={client.id} type="button" variant="ghost" onClick={() => setSelectedName(client.name)} className={`h-auto w-full justify-start rounded-md border px-3 py-2 text-left ${client.name === selectedName ? "border-blue-200 bg-blue-50 text-[#1a2e4a]" : "border-slate-200 bg-white text-slate-600"}`}><div className="min-w-0"><p className="truncate text-xs font-bold">{client.name}</p><p className="mt-0.5 truncate text-[11px] font-normal text-slate-500">{client.whatsapp || client.email || "Sem contato cadastrado"}</p></div></Button>)}</div> : <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-500">Cadastre seu primeiro cliente para centralizar o histórico.</p>}</div></div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">{selectedClient ? <><div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-3"><div><h3 className="text-base font-bold text-[#1a2e4a]">{selectedClient.name}</h3><div className="mt-1 space-y-0.5 text-xs text-slate-600">{selectedClient.whatsapp && <p className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{selectedClient.whatsapp}</p>}{selectedClient.email && <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedClient.email}</p>}{selectedClient.document && <p>Documento: {selectedClient.document}</p>}</div></div><Button type="button" variant="outline" size="sm" onClick={() => void remove()} disabled={deleteMutation.isPending} className="h-9 border-red-200 bg-white text-xs text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></div>{selectedClient.notes && <p className="mt-3 rounded-md bg-white p-2.5 text-xs leading-relaxed text-slate-600">{selectedClient.notes}</p>}<div className="mt-4"><div className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-[#1a2e4a]" /><h4 className="text-sm font-bold text-[#1a2e4a]">Histórico de orçamentos</h4></div>{historyQuery.isLoading ? <p className="mt-2 text-xs text-slate-500">Carregando histórico...</p> : historyEntries.length ? <div className="mt-2 space-y-2">{historyEntries.map((entry) => <div key={`${entry.kind}-${entry.id}`} className="rounded-md border border-slate-200 bg-white p-2.5"><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-[#1a2e4a]" /><p className="text-xs font-bold text-[#1a2e4a]">{entry.label}</p></div><p className="mt-1 text-[11px] text-slate-500">{entry.kind === "proposal" ? "Proposta de passeios" : "Orçamento salvo"} • {new Date(entry.updatedAt).toLocaleDateString("pt-BR")}</p></div>)}</div> : <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">Ainda não há propostas ou orçamentos salvos para este cliente.</p>}</div></> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><UserRound className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Selecione um cliente</p><p className="mt-1 max-w-xs text-xs text-slate-500">Veja seus dados, histórico e aplique o nome ao orçamento atual.</p></div>}</div>
    </div>
  </section>;
}
