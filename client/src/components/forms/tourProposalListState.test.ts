import { describe, expect, it } from "vitest";
import { filterSavedTourProposals } from "./tourProposalListState";

const proposals = [
  { clientName: "Suelen Vieira", proposalTitle: "Santiago" },
  { clientName: "Família Anderson", proposalTitle: "Vale Nevado" },
];

describe("filterSavedTourProposals", () => {
  it("encontra a proposta pelo nome do cliente, mesmo com diferenças de caixa ou acento", () => {
    expect(filterSavedTourProposals(proposals, "suelen")).toEqual([proposals[0]]);
    expect(filterSavedTourProposals(proposals, "FAMILIA")).toEqual([proposals[1]]);
  });

  it("mantém todas as propostas quando a busca está vazia", () => {
    expect(filterSavedTourProposals(proposals, "   ")).toEqual(proposals);
  });
});
