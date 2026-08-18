import type { FinalItineraryEvent } from "@shared/budgetTypes";

export type FinalItineraryLibraryInput = {
  category: "hotel" | "transfer";
  folderName: string;
  name: string;
  destination: string;
  contactName?: string;
  phone?: string;
  responsibleName?: string;
  linkUrl?: string;
  imageUrl?: string;
  documentUrl?: string;
  notes?: string;
};

/** Prepara o fornecedor para a Biblioteca sem perder os dados lidos do voucher. */
export function finalItineraryEventToLibraryInput(event: FinalItineraryEvent, currentDestination: string): FinalItineraryLibraryInput | null {
  if (event.kind !== "hotel" && event.kind !== "transfer") return null;
  const category = event.kind === "hotel" ? "hotel" : "transfer";
  const firstImageAttachment = (event.attachments || []).find((attachment) => attachment.contentType.startsWith("image/"));
  const firstDocumentAttachment = (event.attachments || []).find((attachment) => attachment.contentType === "application/pdf");
  const notes = [
    event.description,
    event.kind === "hotel" && event.hotelAddress && `Endereço: ${event.hotelAddress}`,
    event.kind === "hotel" && event.hotelCheckIn && `Check-in: ${event.hotelCheckIn}`,
    event.kind === "hotel" && event.hotelCheckOut && `Check-out: ${event.hotelCheckOut}`,
    event.kind === "hotel" && event.hotelLocator && `Localizador: ${event.hotelLocator}`,
    event.kind === "hotel" && event.hotelGuestName && `Hóspede principal: ${event.hotelGuestName}`,
  ].filter(Boolean).join("\n");

  return {
    category,
    folderName: category === "hotel" ? "Hotéis" : "Transfers",
    name: event.title.trim() || (category === "hotel" ? "Hospedagem" : "Transfer"),
    destination: currentDestination.trim() || "Sem destino definido",
    contactName: category === "transfer" ? event.title.trim() || undefined : undefined,
    phone: category === "hotel" ? event.hotelPhone?.trim() || undefined : undefined,
    responsibleName: category === "transfer" ? event.title.trim() || undefined : undefined,
    linkUrl: category === "hotel" ? event.hotelMapUrl?.trim() || event.linkUrl.trim() || undefined : event.linkUrl.trim() || undefined,
    imageUrl: event.photoUrl.trim() || firstImageAttachment?.url,
    documentUrl: firstDocumentAttachment?.url,
    notes: notes || undefined,
  };
}
