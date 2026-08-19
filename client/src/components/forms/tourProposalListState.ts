export type SavedTourProposalSearchItem = {
  clientName: string;
  proposalTitle: string;
  status?: "pending" | "sent" | "approved";
};

export type SavedTourProposalStatusFilter = "all" | "pending" | "sent" | "approved";

function normalizedSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function filterSavedTourProposals<T extends SavedTourProposalSearchItem>(proposals: T[], search: string) {
  const query = normalizedSearchText(search);
  if (!query) return proposals;

  return proposals.filter((proposal) => normalizedSearchText(proposal.clientName).includes(query));
}

export function filterSavedTourProposalsByStatus<T extends SavedTourProposalSearchItem>(
  proposals: T[],
  status: SavedTourProposalStatusFilter,
) {
  if (status === "all") return proposals;
  return proposals.filter((proposal) => proposal.status === status);
}
