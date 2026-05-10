import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import type { AllocationEntry, Order } from "../types"
import { bankersRound } from "../lib/banker-round"
import { poolKey } from "../lib/keys"

interface HydratePayload {
  allocations: Map<string, AllocationEntry>
  remainingStock: Map<string, number>
  remainingCredit: Map<string, number>
}

interface SetAllocationArgs {
  order: Order
  newQty: number
  onClamped?: (clampedTo: number, reason: string) => void
}

interface AllocationStore {
  allocations: Map<string, AllocationEntry>
  remainingStock: Map<string, number>
  remainingCredit: Map<string, number>
  hydrated: boolean

  hydrate(p: HydratePayload): void
  setAllocation(args: SetAllocationArgs): void
  reset(): void
}

/**
 * The store is the single source of truth for runtime allocation state.
 * Cells subscribe via `s.allocations.get(subOrderId)` so unchanged rows
 * skip re-render even when the Map reference changes (Object.is on entry).
 */
export const useAllocationStore = create<AllocationStore>((set, get) => ({
  allocations: new Map(),
  remainingStock: new Map(),
  remainingCredit: new Map(),
  hydrated: false,

  hydrate({ allocations, remainingStock, remainingCredit }) {
    set({
      allocations: new Map(allocations),
      remainingStock: new Map(remainingStock),
      remainingCredit: new Map(remainingCredit),
      hydrated: true,
    })
  },

  setAllocation({ order, newQty, onClamped }) {
    const state = get()
    const current = state.allocations.get(order.subOrderId)
    if (!current) return

    const { unitPrice, qty: currentQty, total: currentTotal, pool } = current
    const stockK = poolKey(pool.warehouseId, pool.supplierId, order.itemId)

    // Budgets after reverting *this* row's previous claim.
    const stockBudget = bankersRound(
      (state.remainingStock.get(stockK) ?? 0) + currentQty,
      2
    )
    const creditBudget = bankersRound(
      (state.remainingCredit.get(order.customerId) ?? 0) + currentTotal,
      2
    )
    const maxByCredit =
      unitPrice > 0 ? creditBudget / unitPrice : Number.POSITIVE_INFINITY

    const requested = Math.max(0, newQty)
    const limit = Math.min(order.request, stockBudget, maxByCredit)
    const clamped = bankersRound(Math.min(requested, limit), 2)

    if (clamped === currentQty && requested === currentQty) return

    if (clamped < requested - 1e-6 && onClamped) {
      const reason =
        limit === order.request
          ? `Cannot exceed requested ${order.request}`
          : limit === stockBudget
            ? `Stock pool only has ${stockBudget}`
            : `Credit allows max ${bankersRound(maxByCredit, 2)}`
      onClamped(clamped, reason)
    }

    const newTotal = bankersRound(clamped * unitPrice, 2)

    const allocations = new Map(state.allocations)
    allocations.set(order.subOrderId, { ...current, qty: clamped, total: newTotal })

    const remainingStock = new Map(state.remainingStock)
    remainingStock.set(stockK, bankersRound(stockBudget - clamped, 2))

    const remainingCredit = new Map(state.remainingCredit)
    remainingCredit.set(
      order.customerId,
      bankersRound(creditBudget - newTotal, 2)
    )

    set({ allocations, remainingStock, remainingCredit })
  },

  reset() {
    set({
      allocations: new Map(),
      remainingStock: new Map(),
      remainingCredit: new Map(),
      hydrated: false,
    })
  },
}))

// ---- Stable selectors ----

/** Aggregate totals — re-runs on every edit, but consumed only by the stats card. */
export function useAllocationTotals() {
  return useAllocationStore(
    useShallow((s) => {
      let qty = 0
      let value = 0
      let fulfilled = 0
      const total = s.allocations.size
      for (const e of s.allocations.values()) {
        qty += e.qty
        value += e.total
        if (e.qty > 0) fulfilled += 1
      }
      return { qty, value, fulfilled, total }
    })
  )
}
