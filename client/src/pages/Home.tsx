import { useState } from "react";
import { BudgetProvider, useBudget } from "@/contexts/BudgetContext";
import { TripInfoForm } from "@/components/forms/TripInfoForm";
import { FlightForm } from "@/components/forms/FlightForm";
import { HotelForm } from "@/components/forms/HotelForm";
import { TourForm } from "@/components/forms/TourForm";
import { ItineraryForm } from "@/components/forms/ItineraryForm";
import { FareForm } from "@/components/forms/FareForm";
import { BaggageForm } from "@/components/forms/BaggageForm";
import { InstallmentsForm } from "@/components/forms/InstallmentsForm";
import { PdfPreview } from "@/components/pdf/PdfPreview";
import { ItineraryPreview } from "@/components/itinerary/ItineraryPreview";
import { usePdfGenerator } from "@/hooks/usePdfGenerator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plane, Building2, Settings, FileText, Download, Eye, EyeOff, CalendarDays } from "lucide-react";
import { toast } from "sonner";

function BuilderContent() {
  const { budget } = useBudget();
  const { generatePdf } = usePdfGenerator();
  const [showPreview, setShowPreview] = useState(true);
  const [includeAirfare, setIncludeAirfare] = useState(true);
  const [includeHotel, setIncludeHotel] = useState(true);
  const [activeTab, setActiveTab] = useState("trip");
  const showingItinerary = activeTab === "itinerary";

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-airfare"
                checked={includeAirfare}
                onCheckedChange={(checked) => setIncludeAirfare(checked as boolean)}
              />
              <Label htmlFor="include-airfare" className="text-xs text-white cursor-pointer">
                Incluir Aéreo
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-hotel"
                checked={includeHotel}
                onCheckedChange={(checked) => setIncludeHotel(checked as boolean)}
              />
              <Label htmlFor="include-hotel" className="text-xs text-white cursor-pointer">
                Incluir Hotel
              </Label>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                toast.loading("Gerando PDF...", { id: "pdf-gen" });
                try {
                  await generatePdf();
                  toast.success("PDF gerado! Verifique a pasta Downloads do seu computador.", { id: "pdf-gen" });
                } catch (err) {
                  console.error("PDF error:", err);
                  toast.error("Erro ao gerar PDF. Tente novamente.", { id: "pdf-gen" });
                }
              }}
              className="bg-amber-400 text-[#1a2e4a] hover:bg-amber-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Forms */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} flex flex-col overflow-hidden border-r border-slate-200`}>
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="mb-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  <TabsList className="flex h-auto min-w-max w-full flex-nowrap gap-1.5 rounded-lg bg-slate-200 p-1.5">
                  <TabsTrigger value="trip" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <FileText className="h-4 w-4 mr-1.5" />
                    Viagem
                  </TabsTrigger>
                  <TabsTrigger value="flights" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Plane className="h-4 w-4 mr-1.5" />
                    Voos
                  </TabsTrigger>
                  <TabsTrigger value="fares" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Tarifas
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Building2 className="h-4 w-4 mr-1.5" />
                    Hotéis
                  </TabsTrigger>
                  <TabsTrigger value="baggage" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Bagagens
                  </TabsTrigger>
                  <TabsTrigger value="installments" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Parcelamento
                  </TabsTrigger>
                  <TabsTrigger value="itinerary" className="min-h-10 shrink-0 whitespace-nowrap rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-[#1a2e4a] data-[state=active]:shadow-sm">
                    <CalendarDays className="h-4 w-4 mr-1.5" />
                    Roteiro
                  </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="trip" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Informações da Viagem
                    </h3>
                    <TripInfoForm />
                  </div>
                </TabsContent>

                <TabsContent value="flights" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Voos
                    </h3>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <FlightForm />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="hotels" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Hotéis
                    </h3>
                    <HotelForm />
                  </div>
                </TabsContent>

                <TabsContent value="itinerary" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="mb-1 text-sm font-bold text-[#1a2e4a]" style={{ fontFamily: "Poppins, sans-serif" }}>Proposta de passeios</h3>
                    <p className="mb-4 text-xs text-slate-500">Cadastre e organize somente os passeios para enviar uma proposta de aprovação. O roteiro final com voos, hotel e transfers será acrescentado nesta mesma aba depois.</p>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] space-y-6 overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <section aria-labelledby="proposta-abertura">
                        <div className="mb-3 border-b border-slate-200 pb-3">
                          <h4 id="proposta-abertura" className="text-sm font-bold text-[#1a2e4a]">Abertura da proposta</h4>
                          <p className="mt-1 text-xs text-slate-500">Comece pela mensagem para a cliente, pela forma de pagamento e pela importação dos passeios.</p>
                        </div>
                        <ItineraryForm />
                      </section>
                      <section aria-labelledby="roteiro-passeios" className="border-t border-slate-200 pt-6">
                        <div className="mb-3">
                          <h4 id="roteiro-passeios" className="text-sm font-bold text-[#1a2e4a]">Passeios da proposta</h4>
                          <p className="mt-1 text-xs text-slate-500">Inclua somente os passeios que deseja apresentar para aprovação.</p>
                        </div>
                        <TourForm />
                      </section>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fares" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Tarifas
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Adicione quantas tarifas quiser com nomes customizáveis. Você pode destacar uma para que apaça em destaque no orçamento.
                    </p>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <FareForm />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="baggage" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Bagagens
                    </h3>
                    <BaggageForm />
                  </div>
                </TabsContent>

                <TabsContent value="installments" className="mt-0">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold text-[#1a2e4a] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Parcelamento
                    </h3>
                    <div className="h-[calc(100dvh-16rem)] min-h-[32rem] overflow-y-auto overscroll-contain pr-3 [scrollbar-gutter:stable]">
                      <InstallmentsForm />
                    </div>
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
                {showingItinerary ? "Visualização da proposta de passeios" : "Preview do PDF"}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {showingItinerary ? `${budget.itinerary.length} dia(s) • ${budget.tours.length} passeio(s)` : `${budget.flights.length} voo(s) • ${budget.hotels.length} hotel(is) • ${budget.fareComparison.tiers.length} tarifa(s)`}
                </span>
                {showingItinerary && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      toast.loading("Gerando PDF da proposta de passeios...", { id: "itinerary-pdf-gen" });
                      try {
                        await generatePdf("proposta-passeios-bella-viagens.pdf", "itinerary-document");
                        toast.success("PDF da proposta de passeios gerado! Verifique a pasta Downloads do seu computador.", { id: "itinerary-pdf-gen" });
                      } catch (err) {
                        console.error("Itinerary PDF error:", err);
                        toast.error("Erro ao gerar o PDF do roteiro. Tente novamente.", { id: "itinerary-pdf-gen" });
                      }
                    }}
                    className="h-8 bg-[#1a2e4a] px-3 text-xs text-white hover:bg-[#243d61]"
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Gerar PDF da Proposta
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 flex justify-center">
                <div className="shadow-2xl w-full max-w-2xl">
                  {showingItinerary ? <ItineraryPreview data={budget} /> : <PdfPreview data={budget} includeAirfare={includeAirfare} includeHotel={includeHotel} />}
                </div>
              </div>
            </div>
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
