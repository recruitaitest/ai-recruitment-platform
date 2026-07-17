import { create } from "zustand";

import { Candidate } from "@/types/Candidate";

interface SemanticSearchStore {
  selectedCandidate: Candidate | null;
  drawerOpen: boolean;

  setSelectedCandidate: (candidate: Candidate) => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useSemanticSearchStore = create<SemanticSearchStore>((set) => ({
  selectedCandidate: null,
  drawerOpen: false,

  setSelectedCandidate: (candidate) =>
    set({
      selectedCandidate: candidate,
    }),

  setDrawerOpen: (open) =>
    set({
      drawerOpen: open,
    }),
}));
