import { useState } from "react";
import { BudgetProvider, useBudget } from "@/contexts/BudgetContext";
import { TripInfoForm } from "@/components/forms/TripInfoForm";
import { FlightForm } from "@/components/forms/FlightForm";
import { HotelForm } from "@/components/forms/HotelForm";
import { FareForm } from "@/components/forms/FareForm";
import { BaggageForm } from "@/components/forms/BaggageForm";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plane, Building2, Settings, FileText, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function BuilderContent() {
  const { budget } = useBudget();
  const { generatePdf } = usePdfGenerator();
  const [showPreview, setShowPreview] = useState(true);

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
            onClick={() => setShowPreview(!showPreview)}
            className="text-white hover:bg-white/10"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Ocultar Preview" : "Mostrar Preview"}
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              toast.loading("Gerando PDF...", { id: "pdf-gen" });
              try {
                await generatePdf();
                toast.success("PDF gerado! Verifique a pasta Downloads do seu computador.", { id: "pdf-gen" });
              } catch {
                toast.error("Erro ao gerar PDF. Tente novamente.", { id: "pdf-gen" });
              }
            }}
            className="bg-amber-400 text-[#1a2e4a] hover:bg-amber-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Forms */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} flex flex-col overflow-hidden border-r border-slate-200`}>
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs defaultValue="trip" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-4">
                  <TabsTrigger value="trip" className="text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Viagem
                  </TabsTrigger>
                  <TabsTrigger value="flights" className="text-xs">
                    <Plane className="h-3.5 w-3.5 mr-1" />
                    Voos
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="text-xs">
                    <Building2 className="h-3.5 w-3.5 mr-1" />
                    Hotéis
                  </TabsTrigger>
                  <TabsTrigger value="fares" className="text-xs">
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Tarifas
                  </TabsTrigger>
                  <TabsTrigger value="baggage" className="text-xs">
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Bagagens
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="trip" className="mt-0 max-h-96 overflow-y-auto">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Informações da Viagem
                    </h3>
                    <TripInfoForm />
                  </div>
                </TabsContent>

                <TabsContent value="flights" className="mt-0 max-h-96 overflow-y-auto">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Voos
                    </h3>
                    <FlightForm />
                  </div>
                </TabsContent>

                <TabsContent value="hotels" className="mt-0 max-h-96 overflow-y-auto">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Hotéis
                    </h3>
                    <HotelForm />
                  </div>
                </TabsContent>

                <TabsContent value="fares" className="mt-0 max-h-96 overflow-y-auto">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Tarifas
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Adicione quantas tarifas quiser com nomes customizáveis. Você pode destacar uma para que apaça em destaque no orçamento.
                    </p>
                    <FareForm />
                  </div>
                </TabsContent>

                <TabsContent value="baggage" className="mt-0 max-h-96 overflow-y-auto">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Bagagens
                    </h3>
                    <BaggageForm />
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
                Preview do PDF
              </span>
              <span className="text-xs text-slate-400">
                {budget.flights.length} voo(s) • {budget.hotels.length} hotel(is) • {budget.fareComparison.tiers.length} tarifa(s)
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-6 flex justify-center">
                <div className="shadow-2xl" style={{ minHeight: "100%" }}>
                  <PdfPreview data={budget} />
                </div>
              </div>
            </ScrollArea>
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
