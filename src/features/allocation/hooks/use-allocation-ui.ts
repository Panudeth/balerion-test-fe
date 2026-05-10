import { create } from "zustand"
import type { OrderType } from "../types"

type TypeFilter = OrderType | "ALL"

interface AllocationUIStore {
  search: string
  typeFilter: TypeFilter
  setSearch(v: string): void
  setTypeFilter(v: TypeFilter): void
}

export const useAllocationUI = create<AllocationUIStore>((set) => ({
  search: "",
  typeFilter: "ALL",
  setSearch: (search) => set({ search }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
}))
