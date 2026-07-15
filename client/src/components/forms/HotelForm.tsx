import { useState, useRef } from "react";
import { useBudget } from "@/contexts/BudgetContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Star, MapPin, Upload, Loader2, Building2 } from "lucide-react";
import type { Hotel } from "@shared/budgetTypes";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export function HotelForm() {
  const { budget, addHotel, removeHotel } = useBudget();
  const [showForm, setShowForm] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [stars, setStars] = useState(3);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingLabel, setRatingLabel] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [prices, setPrices] = useState<Record<string, { total: number; perPerson: number }>>({});

  const parseHotelMutation = trpc.parseHotelScreenshot.useMutation();

  const resetForm = () => {
    setName("");
    setStars(3);
    setAddress("");
    setDescription("");
    setRating(0);
    setRatingLabel("");
    setAmenities([]);
    setAmenityInput("");
    setPhotoUrl("");
    setPrices({});
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome do hotel é obrigatório");
      return;
    }
    if (!address.trim()) {
      toast.error("Endereço do hotel é obrigatório");
      return;
    }
    if (rating < 0 || rating > 10) {
      toast.error("Nota deve estar entre 0 e 10");
      return;
    }

    const hotel: Hotel = {
      id: nanoid(),
      name,
      stars,
      address,
      description,
      rating,
      ratingLabel,
      amenities,
      photoUrl,
      prices,
    };
    addHotel(hotel);
    toast.success("Hotel adicionado com sucesso!");
    resetForm();
    setShowForm(false);
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput("");
    }
  };

  const handlePriceChange = (tierId: string, field: "total" | "perPerson", value: number) => {
    setPrices({
      ...prices,
      [tierId]: { ...prices[tierId], [field]: value },
    });
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
          const result = await parseHotelMutation.mutateAsync({ imageBase64: base64 });
          if (result) {
            setName(result.name || "");
            setStars(result.stars || 3);
            setAddress(result.address || "");
            setDescription(result.description || "");
            setRating(result.rating || 0);
            setRatingLabel(result.ratingLabel || "");
            setAmenities(result.amenities || []);
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

  return (
    <div className="space-y-3">
      {/* Existing hotels */}
      {budget.hotels.map((hotel, idx) => (
        <div key={hotel.id} className="rounded-lg border border-slate-200 bg-white p-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2e4a] text-white text-xs font-bold">
            {idx + 1}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#1a2e4a]">{hotel.name}</div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {hotel.address}
            </div>
          </div>
          {hotel.rating > 0 && (
            <div className="text-xs bg-[#1a2e4a] text-white px-2 py-1 rounded">
              {hotel.rating.toFixed(1)} / 10
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeHotel(hotel.id)}
            className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

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
              Importar hotel de screenshot
            </>
          )}
        </Button>
        <p className="text-xs text-slate-400 mt-2">
          Envie um print da tela do hotel e a IA preenche automaticamente
        </p>
      </div>

      {/* Manual add button */}
      {!showForm && (
        <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar hotel manualmente
        </Button>
      )}

      {/* Hotel form */}
      {showForm && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1a2e4a]">Novo Hotel</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
          </div>

          <div>
            <Label className="text-xs">Nome do Hotel</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Holiday Inn Santiago"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Estrelas</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStars(s)}
                    className={`p-1 rounded ${s <= stars ? "text-amber-400" : "text-slate-300"}`}
                  >
                    <Star className={`h-5 w-5 ${s <= stars ? "fill-amber-400" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">URL da Foto (opcional)</Label>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Endereço</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Endereço completo"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do hotel"
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nota (0-10)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={rating || ""}
                onChange={(e) => setRating(parseFloat(e.target.value) || 0)}
                placeholder="8.7"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Avaliação</Label>
              <Input
                value={ratingLabel}
                onChange={(e) => setRatingLabel(e.target.value)}
                placeholder="Excelente"
                className="mt-1"
              />
            </div>
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-xs">Comodidades</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAmenity())}
                placeholder="Ex: Wi-Fi, Piscina, Café da manhã"
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleAddAmenity}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {amenities.map((a, i) => (
                  <span key={i} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full flex items-center gap-1">
                    {a}
                    <button
                      onClick={() => setAmenities(amenities.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Prices by fare tier */}
          {budget.fareComparison.tiers.length > 0 && (
            <div className="border-t border-slate-200 pt-3">
              <Label className="text-xs font-bold text-slate-600">Preços por Tarifa</Label>
              <div className="space-y-2 mt-2">
                {budget.fareComparison.tiers.map((tier) => (
                  <div key={tier.id} className="rounded-lg border border-slate-200 bg-white p-2">
                    <div className="text-xs font-bold text-slate-600 mb-2">{tier.name}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-slate-500">Total (R$)</Label>
                        <Input
                          type="number"
                          value={prices[tier.id]?.total || ""}
                          onChange={(e) =>
                            handlePriceChange(tier.id, "total", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-slate-500">Por pessoa (R$)</Label>
                        <Input
                          type="number"
                          value={prices[tier.id]?.perPerson || ""}
                          onChange={(e) =>
                            handlePriceChange(tier.id, "perPerson", parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="h-8 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            <Building2 className="h-4 w-4 mr-2" />
            Salvar Hotel
          </Button>
        </div>
      )}
    </div>
  );
}
