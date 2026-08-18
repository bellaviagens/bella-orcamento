import { useEffect, useMemo } from "react";
import { useRoute } from "wouter";
import { AlertCircle, ExternalLink, Heart, Loader2, MapPin, Tag, UtensilsCrossed } from "lucide-react";
import { trpc } from "@/lib/trpc";

type SharedFavorite = {
  id: string;
  name: string;
  location: string;
  address: string;
  description: string;
  rating?: number;
  mapsUrl: string;
  website?: string;
  photoUrl?: string;
  tags?: string[];
};

type SharedFavoriteSnapshot = { favorites: SharedFavorite[] };

export default function SharedFavorites() {
  const [, params] = useRoute("/favoritos/:token");
  const token = params?.token || "";
  const { data, isLoading, error } = trpc.sharedFavoriteLists.get.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const snapshot = useMemo(() => {
    if (!data?.snapshot) return null;
    try {
      const parsed = JSON.parse(data.snapshot) as SharedFavoriteSnapshot;
      return Array.isArray(parsed.favorites) ? parsed : null;
    } catch {
      return null;
    }
  }, [data?.snapshot]);

  useEffect(() => {
    if (snapshot) document.title = "Restaurantes favoritos | Bella Viagens";
  }, [snapshot]);

  if (isLoading) return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="rounded-xl bg-white px-5 py-4 text-sm font-semibold text-[#1a2e4a] shadow"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Abrindo a lista de restaurantes...</div></main>;
  if (error || !snapshot) return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><div className="max-w-md rounded-2xl bg-white p-7 text-center shadow-xl"><AlertCircle className="mx-auto h-9 w-9 text-amber-500" /><h1 className="mt-3 text-xl font-bold text-[#1a2e4a]">Lista indisponível</h1><p className="mt-2 text-sm leading-relaxed text-slate-600">{error?.message || "Este link não foi encontrado ou pode estar incompleto. Peça uma nova lista à sua consultora."}</p></div></main>;

  return <main className="min-h-screen bg-slate-100 px-4 py-7 sm:px-6"><div className="mx-auto max-w-3xl"><header className="rounded-2xl bg-[#1a2e4a] px-5 py-6 text-white shadow-lg"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-200"><Heart className="h-4 w-4" />Bella Viagens e Milhas</div><h1 className="mt-2 text-2xl font-bold">Restaurantes favoritos</h1><p className="mt-1 text-sm text-blue-100">Uma seleção especial para inspirar sua experiência gastronômica.</p></header><section className="mt-4 grid gap-3">{snapshot.favorites.map((favorite) => <article key={favorite.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid sm:grid-cols-[156px_minmax(0,1fr)]">{favorite.photoUrl ? <img src={favorite.photoUrl} alt={`Foto de ${favorite.name}`} className="h-40 w-full object-cover sm:h-full" /> : <div className="flex h-28 items-center justify-center bg-amber-50 text-amber-600 sm:h-full"><UtensilsCrossed className="h-7 w-7" /></div>}<div className="p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-base font-bold text-[#1a2e4a]">{favorite.name}</h2>{favorite.rating ? <p className="mt-0.5 text-xs font-semibold text-amber-700">Avaliação disponível: {favorite.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}/5</p> : null}</div>{favorite.tags?.length ? <div className="flex flex-wrap justify-end gap-1">{favorite.tags.map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#1a2e4a]"><Tag className="h-2.5 w-2.5" />{tag}</span>)}</div> : null}</div><p className="mt-2 text-sm leading-relaxed text-slate-600">{favorite.description || favorite.address}</p><p className="mt-2 flex items-start gap-1 text-xs text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />{favorite.address || favorite.location}</p><div className="mt-3 flex flex-wrap gap-2"><a href={favorite.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1a2e4a] hover:bg-slate-50"><MapPin className="h-3.5 w-3.5" />Ver endereço</a>{favorite.website ? <a href={favorite.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1a2e4a] hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" />Site / fotos</a> : null}</div></div></article>)}</section></div></main>;
}
