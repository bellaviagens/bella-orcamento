import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { summarizeClientDocumentAlerts } from "./clientDocumentManagement";

type HomeClientDocumentAlertsProps = {
  tripPeriod?: string;
  onOpenClients: () => void;
};

function expiryLabel(daysUntilExpiry: number) {
  if (daysUntilExpiry < 0) return `Vencido há ${Math.abs(daysUntilExpiry)} dia(s)`;
  if (daysUntilExpiry === 0) return "Vence hoje";
  return `Vence em ${daysUntilExpiry} dia(s)`;
}

export function HomeClientDocumentAlerts({ tripPeriod, onOpenClients }: HomeClientDocumentAlertsProps) {
  const clientsQuery = trpc.travelClients.list.useQuery();
  const [dismissed, setDismissed] = useState(false);
  const alerts = useMemo(
    () => summarizeClientDocumentAlerts(clientsQuery.data || [], tripPeriod),
    [clientsQuery.data, tripPeriod],
  );

  if (dismissed || !alerts.length) return null;

  return <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3" aria-label="Alertas de documentos">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <div>
          <h2 className="text-sm font-bold text-[#1a2e4a]">Alertas de documentos</h2>
          <p className="mt-0.5 text-xs text-slate-600">Revise os documentos com validade próxima ou incompatível com o período da viagem.</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-500 hover:text-[#1a2e4a]" onClick={() => setDismissed(true)} aria-label="Fechar alertas de documentos"><X className="h-4 w-4" /></Button>
    </div>
    <div className="mt-3 space-y-1.5">
      {alerts.slice(0, 4).map(({ clientName, alert, daysUntilExpiry }) => <div key={`${clientName}-${alert.document}-${alert.expiresAt}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-white px-2.5 py-2 text-xs">
        <p className="text-slate-700"><strong className="text-[#1a2e4a]">{clientName}</strong> · {alert.document}</p>
        <span className="font-semibold text-amber-800">{expiryLabel(daysUntilExpiry)}</span>
      </div>)}
    </div>
    <div className="mt-3 flex justify-end">
      <Button type="button" variant="outline" size="sm" className="h-8 bg-white text-xs text-[#1a2e4a]" onClick={onOpenClients}>Ver clientes</Button>
    </div>
  </section>;
}
