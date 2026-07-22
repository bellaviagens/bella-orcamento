import { useState, useRef } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Plane, Upload, Loader2, ChevronDown, ChevronRight, Edit2 } from "lucide-react";
import type { Flight, FlightSegment } from "@shared/budgetTypes";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export function FlightForm() {
  const { budget, addFlight, removeFlight, updateFlight } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [expandedFlights, setExpandedFlights] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [flightType, setFlightType] = useState<"ida" | "volta">("ida");
  const [isDirect, setIsDirect] = useState(true);
  const [totalDuration, setTotalDuration] = useState("");
  const [operatingAirline, setOperatingAirline] = useState("");
  const [segments, setSegments] = useState<FlightSegment[]>([
    {
      airline: "",
      flightNumber: "",
      departureAirport: "",
      departureCity: "",
      departureTime: "",
      arrivalAirport: "",
      arrivalCity: "",
      arrivalTime: "",
      date: "",
      duration: "",
    },
  ]);

  const parseFlightMutation = trpc.parseFlightScreenshot.useMutation();

  const resetForm = () => {
    setFlightType("ida");
    setIsDirect(true);
    setTotalDuration("");
    setOperatingAirline("");
    setSegments([
      {
        airline: "",
        flightNumber: "",
        departureAirport: "",
        departureCity: "",
        departureTime: "",
        arrivalAirport: "",
        arrivalCity: "",
        arrivalTime: "",
        date: "",
        duration: "",
      },
    ]);
    setEditingId(null);
  };

  const handleEdit = (flight: Flight) => {
    setEditingId(flight.id);
    setFlightType(flight.type);
    setIsDirect(flight.isDirect);
    setTotalDuration(flight.totalDuration);
    setOperatingAirline(flight.operatingAirline);
    setSegments(flight.segments);
    setShowForm(true);
  };

  const handleAddSegment = () => {
    setSegments([
      ...segments,
      {
        airline: "",
        flightNumber: "",
        departureAirport: "",
        departureCity: "",
        departureTime: "",
        arrivalAirport: "",
        arrivalCity: "",
        arrivalTime: "",
        date: "",
        duration: "",
      },
    ]);
    setIsDirect(false);
  };

  const handleRemoveSegment = (index: number) => {
    if (segments.length > 1) {
      setSegments(segments.filter((_, i) => i !== index));
      if (segments.length - 1 === 1) setIsDirect(true);
    }
  };

  const handleSegmentChange = (index: number, field: keyof FlightSegment, value: string) => {
    setSegments(segments.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSave = () => {
    // Validate required fields
    const missingFields: string[] = [];
    if (!totalDuration) missingFields.push("Duração total");
    if (!operatingAirline) missingFields.push("Operadora");
    segments.forEach((seg, i) => {
      if (!seg.airline) missingFields.push(`Trecho ${i + 1}: Cia. Aérea`);
      if (!seg.departureAirport) missingFields.push(`Trecho ${i + 1}: Origem`);
      if (!seg.arrivalAirport) missingFields.push(`Trecho ${i + 1}: Destino`);
      if (!seg.departureTime) missingFields.push(`Trecho ${i + 1}: Saída`);
      if (!seg.arrivalTime) missingFields.push(`Trecho ${i + 1}: Chegada`);
    });

    if (missingFields.length > 0) {
      toast.error("Campos obrigatórios faltando", {
        description: missingFields.join(", "),
      });
      return;
    }

    const flight: Flight = {
      id: editingId || nanoid(),
      type: flightType,
      isDirect,
      totalDuration,
      operatingAirline,
      segments,
    };

    if (editingId) {
      updateFlight(editingId, flight);
      toast.success("Voo atualizado com sucesso!");
    } else {
      addFlight(flight);
      toast.success("Voo adicionado com sucesso!");
    }
    resetForm();
    setShowForm(false);
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const result = await parseFlightMutation.mutateAsync({ imageBase64: base64 });
          if (result) {
            setFlightType(result.type || "ida");
            setIsDirect(result.isDirect ?? true);
            setTotalDuration(result.totalDuration || "");
            setOperatingAirline(result.operatingAirline || "");
            if (result.segments && result.segments.length > 0) {
              setSegments(result.segments);
            }
            setShowForm(true);
          }
        } catch (err) {
          console.error("Parse error:", err);
          toast.error("Não foi possível analisar o screenshot. Tente novamente ou preencha manualmente.");
        }
        setParsing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setParsing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedFlights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Existing flights */}
      <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
      {budget.flights.map((flight) => {
        const expanded = expandedFlights.has(flight.id);
        const firstSeg = flight.segments[0];
        const lastSeg = flight.segments[flight.segments.length - 1];
        return (
          <div key={flight.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 p-3">
              <button onClick={() => toggleExpand(flight.id)} className="p-1 hover:bg-slate-100 rounded">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-white">
                <Plane className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-[#1a2e4a] uppercase">{flight.type}: </span>
                <span className="text-sm text-slate-700">
                  {firstSeg?.departureCity} → {lastSeg?.arrivalCity}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  {flight.isDirect ? "Direto" : `${flight.segments.length - 1} escala(s)`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(flight)}
                className="text-blue-500 hover:text-blue-700 h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFlight(flight.id)}
                className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {expanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
                {flight.segments.map((seg, i) => (
                  <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded p-2">
                    <div className="font-semibold text-[#1a2e4a]">
                      Trecho {i + 1}: {seg.airline} {seg.flightNumber}
                    </div>
                    <div>
                      {seg.departureCity} ({seg.departureAirport}) {seg.departureTime} →{" "}
                      {seg.arrivalCity} ({seg.arrivalAirport}) {seg.arrivalTime}
                    </div>
                    <div className="text-slate-400">Duração: {seg.duration} • Data: {seg.date}</div>
                  </div>
                ))}
                <div className="text-xs text-slate-500">
                  Duração total: {flight.totalDuration} • Operado por {flight.operatingAirline}
                </div>
              </div>
            )}
          </div>
        );
      })}
      </div>

      {/* Screenshot upload */}
      <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          className="w-full"
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Analisando screenshot...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Importar voo de screenshot
            </>
          )}
        </Button>
        <p className="text-xs text-slate-400 mt-2">
          Envie um print da tela do voo e a IA preenche automaticamente
        </p>
      </div>

      {/* Manual add button */}
      {!showForm && (
        <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar voo manualmente
        </Button>
      )}

      {/* Flight form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1a2e4a]">{editingId ? "Editar Voo" : "Novo Voo"}</h4>
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={flightType} onValueChange={(v) => setFlightType(v as "ida" | "volta")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ida">Ida</SelectItem>
                  <SelectItem value="volta">Volta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Duração Total</Label>
              <Input
                value={totalDuration}
                onChange={(e) => setTotalDuration(e.target.value)}
                placeholder="Ex: 4h 30min"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Operadora</Label>
              <Input
                value={operatingAirline}
                onChange={(e) => setOperatingAirline(e.target.value)}
                placeholder="Ex: LATAM"
                className="mt-1"
              />
            </div>
          </div>

          {/* Segments */}
          {segments.map((seg, idx) => (
            <div key={idx} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  {segments.length > 1 ? `Trecho ${idx + 1}` : "Voo"}
                </span>
                {segments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSegment(idx)}
                    className="text-red-500 h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Cia. Aérea</Label>
                  <Input
                    value={seg.airline}
                    onChange={(e) => handleSegmentChange(idx, "airline", e.target.value)}
                    placeholder="LATAM"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Nº Voo</Label>
                  <Input
                    value={seg.flightNumber}
                    onChange={(e) => handleSegmentChange(idx, "flightNumber", e.target.value)}
                    placeholder="LA800"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Origem (IATA)</Label>
                  <Input
                    value={seg.departureAirport}
                    onChange={(e) => handleSegmentChange(idx, "departureAirport", e.target.value)}
                    placeholder="GRU"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Cidade Origem</Label>
                  <Input
                    value={seg.departureCity}
                    onChange={(e) => handleSegmentChange(idx, "departureCity", e.target.value)}
                    placeholder="São Paulo"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Destino (IATA)</Label>
                  <Input
                    value={seg.arrivalAirport}
                    onChange={(e) => handleSegmentChange(idx, "arrivalAirport", e.target.value)}
                    placeholder="SCL"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Cidade Destino</Label>
                  <Input
                    value={seg.arrivalCity}
                    onChange={(e) => handleSegmentChange(idx, "arrivalCity", e.target.value)}
                    placeholder="Santiago"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px] text-slate-500">Saída</Label>
                  <Input
                    value={seg.departureTime}
                    onChange={(e) => handleSegmentChange(idx, "departureTime", e.target.value)}
                    placeholder="08:30"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Chegada</Label>
                  <Input
                    value={seg.arrivalTime}
                    onChange={(e) => handleSegmentChange(idx, "arrivalTime", e.target.value)}
                    placeholder="13:45"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Data</Label>
                  <Input
                    value={seg.date}
                    onChange={(e) => handleSegmentChange(idx, "date", e.target.value)}
                    placeholder="15/01/2026"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500">Duração</Label>
                  <Input
                    value={seg.duration}
                    onChange={(e) => handleSegmentChange(idx, "duration", e.target.value)}
                    placeholder="4h 30min"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAddSegment}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar trecho (escala)
            </Button>
            <Button onClick={handleSave} className="ml-auto" size="sm">
              Salvar Voo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
