import { describe, expect, it } from "vitest";
import { filterSavedTourProposals, filterSavedTourProposalsByStatus } from "./tourProposalListState";

const proposals = [
  { clientName: "Suelen Vieira", proposalTitle: "Santiago", status: "pending" as const },
  { clientName: "Família Anderson", proposalTitle: "Vale Nevado", status: "approved" as const },
];

describe("filterSavedTourProposals", () => {
  it("encontra a proposta pelo nome do cliente, mesmo com diferenças de caixa ou acento", () => {
    expect(filterSavedTourProposals(proposals, "suelen")).toEqual([proposals[0]]);
    expect(filterSavedTourProposals(proposals, "FAMILIA")).toEqual([proposals[1]]);
  });

  it("mantém todas as propostas quando a busca está vazia", () => {
    expect(filterSavedTourProposals(proposals, "   ")).toEqual(proposals);
  });

  it("filtra as propostas pelo status selecionado sem afetar a busca por cliente", () => {
    expect(filterSavedTourProposalsByStatus(proposals, "pending")).toEqual([proposals[0]]);
    expect(filterSavedTourProposalsByStatus(proposals, "approved")).toEqual([proposals[1]]);
    expect(filterSavedTourProposalsByStatus(proposals, "all")).toEqual(proposals);
  });
});
