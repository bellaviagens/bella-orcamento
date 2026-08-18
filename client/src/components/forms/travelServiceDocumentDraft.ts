import type { TravelLibraryCategory } from "./travelLibraryState";
import type { TravelLibraryDraft } from "./travelLibraryEditorState";
import { EMPTY_LIBRARY_DRAFT } from "./travelLibraryEditorState";
import type { TravelLibraryLocation } from "./travelLibraryLocation";

export type TravelServiceDocumentData = {
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  phone: string;
  website: string;
  priceNote: string;
  contactName: string;
  responsibleName: string;
  whatsapp: string;
};

type ImportableTravelServiceCategory = Extract<TravelLibraryCategory, "tour" | "transfer">;

function serviceFolder(category: ImportableTravelServiceCategory, city: string) {
  const label = category === "tour" ? "Passeios" : "Transfers";
  return city ? `${label} ${city}` : label;
}

function serviceNotes(document: TravelServiceDocumentData) {
  return [
    document.description.trim(),
    document.address.trim() && `Endereço: ${document.address.trim()}`,
    document.priceNote.trim() && `Valor: ${document.priceNote.trim()}`,
  ].filter(Boolean).join("\n");
}

/** Converte um PDF ou print de passeio/transfer em campos revisáveis da Biblioteca. */
export function travelServiceDocumentDraft(category: ImportableTravelServiceCategory, document: TravelServiceDocumentData, location: TravelLibraryLocation, documentUrl: string, imageUrl = ""): TravelLibraryDraft {
  return {
    ...EMPTY_LIBRARY_DRAFT,
    ...location,
    category,
    folderName: serviceFolder(category, location.city),
    name: document.name.trim(),
    neighborhood: document.neighborhood.trim(),
    contactName: document.contactName.trim(),
    phone: document.phone.trim(),
    responsibleName: document.responsibleName.trim(),
    whatsapp: document.whatsapp.trim(),
    linkUrl: document.website.trim(),
    imageUrl,
    documentUrl,
    notes: serviceNotes(document),
  };
}

/** Mescla a leitura documental sem substituir qualquer informação digitada no cadastro. */
export function mergeTravelServiceDocumentDraft(current: TravelLibraryDraft, category: ImportableTravelServiceCategory, document: TravelServiceDocumentData, location: TravelLibraryLocation, documentUrl: string, imageUrl = ""): TravelLibraryDraft {
  const extracted = travelServiceDocumentDraft(category, document, location, documentUrl, imageUrl);
  return {
    ...extracted,
    category,
    destination: current.destination.trim() || extracted.destination,
    country: current.country.trim() || extracted.country,
    city: current.city.trim() || extracted.city,
    neighborhood: current.neighborhood.trim() || extracted.neighborhood,
    folderName: current.folderName.trim() || extracted.folderName,
    name: current.name.trim() || extracted.name,
    contactName: current.contactName.trim() || extracted.contactName,
    phone: current.phone.trim() || extracted.phone,
    responsibleName: current.responsibleName.trim() || extracted.responsibleName,
    whatsapp: current.whatsapp.trim() || extracted.whatsapp,
    linkUrl: current.linkUrl.trim() || extracted.linkUrl,
    imageUrl: current.imageUrl.trim() || extracted.imageUrl,
    notes: current.notes.trim() || extracted.notes,
    documentUrl,
  };
}
