export type SavedTourProposalSearchItem = {
  clientName: string;
  proposalTitle: string;
};

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
