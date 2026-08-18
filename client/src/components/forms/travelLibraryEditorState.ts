import type { TravelLibraryCategory } from "./travelLibraryState";

export type TravelLibraryDraft = {
  category: TravelLibraryCategory;
  folderName: string;
  name: string;
  destination: string;
  country: string;
  city: string;
  contactName: string;
  phone: string;
  responsibleName: string;
  whatsapp: string;
  linkUrl: string;
  imageUrl: string;
  documentUrl: string;
  notes: string;
};

export type TravelLibraryEditorItem = TravelLibraryDraft & { id: string };

export const EMPTY_LIBRARY_DRAFT: TravelLibraryDraft = {
  category: "hotel",
  folderName: "",
  name: "",
  destination: "",
  country: "",
  city: "",
  contactName: "",
  phone: "",
  responsibleName: "",
  whatsapp: "",
  linkUrl: "",
  imageUrl: "",
  documentUrl: "",
  notes: "",
};

/** Converte um item persistido em campos seguros para edição no formulário. */
export function libraryItemToDraft(item: {
  category: TravelLibraryCategory;
  folderName: string;
  name: string;
  destination?: string | null;
  country?: string | null;
  city?: string | null;
  contactName?: string | null;
  phone?: string | null;
  responsibleName?: string | null;
  whatsapp?: string | null;
  linkUrl?: string | null;
  imageUrl?: string | null;
  documentUrl?: string | null;
  notes?: string | null;
}): TravelLibraryDraft {
  return {
    category: item.category,
    folderName: item.folderName || "",
    name: item.name || "",
    destination: item.destination || "",
    country: item.country || "",
    city: item.city || "",
    contactName: item.contactName || "",
    phone: item.phone || "",
    responsibleName: item.responsibleName || "",
    whatsapp: item.whatsapp || "",
    linkUrl: item.linkUrl || "",
    imageUrl: item.imageUrl || "",
    documentUrl: item.documentUrl || "",
    notes: item.notes || "",
  };
}
