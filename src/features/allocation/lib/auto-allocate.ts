import { bankersRound } from "./banker-round"
import { poolKey, priceKey } from "./keys"
import {
  ANY_SUPPLIER,
  ANY_WAREHOUSE,
  PRIORITY_RANK,
  type AllocationEntry,
  type Customer,
  type Order,
  type PriceRow,
  type PriceTier,
  type StockRow,
} from "../types"

interface AutoAllocateInput {
  orders: Order[]
  customers: Customer[]
  prices: PriceRow[]
  tiers: PriceTier[]
  stock: StockRow[]
}

export interface AutoAllocateOutput {
  allocations: Map<string, AllocationEntry>
  remainingStock: Map<string, number>
  remainingCredit: Map<string, number>
}

/**
 * Greedy allocator:
 *   1. sort orders by priority (Emergency → Overdue → Daily) then FIFO
 *   2. resolve WH-000 / SP-000 to the (warehouse, supplier) pool with highest remaining stock
 *   3. unitPrice = base * tier multiplier (banker-rounded to 2dp)
 *   4. qty = min(request, stock, credit / unitPrice), clamped ≥ 0 and banker-rounded
 *   5. decrement remaining stock + customer credit
 */
export function autoAllocate(input: AutoAllocateInput): AutoAllocateOutput {
  const tierMap = new Map(input.tiers.map((t) => [t.type, t.multiplier]))
  const basePriceMap = new Map(
    input.prices.map((p) => [priceKey(p.itemId, p.supplierId), p.basePrice])
  )

  const remainingStock = new Map<string, number>()
  for (const s of input.stock) {
    remainingStock.set(
      poolKey(s.warehouseId, s.supplierId, s.itemId),
      s.available
    )
  }
  const remainingCredit = new Map<string, number>()
  for (const c of input.customers) {
    remainingCredit.set(c.customerId, c.creditLimit)
  }

  // Discover dimensions once.
  const warehouses = Array.from(new Set(input.stock.map((s) => s.warehouseId)))
  const suppliers = Array.from(new Set(input.stock.map((s) => s.supplierId)))

  const sortedOrders = [...input.orders].sort((a, b) => {
    const dp = PRIORITY_RANK[a.type] - PRIORITY_RANK[b.type]
    if (dp !== 0) return dp
    return (
      new Date(a.createDate).getTime() - new Date(b.createDate).getTime()
    )
  })

  const allocations = new Map<string, AllocationEntry>()

  for (const order of sortedOrders) {
    const tier = tierMap.get(order.type) ?? 1

    const whCandidates =
      order.warehouseId === ANY_WAREHOUSE ? warehouses : [order.warehouseId]
    const spCandidates =
      order.supplierId === ANY_SUPPLIER ? suppliers : [order.supplierId]

    let best: { wh: string; sp: string; key: string; stock: number } | null =
      null
    for (const wh of whCandidates) {
      for (const sp of spCandidates) {
        const key = poolKey(wh, sp, order.itemId)
        const stockQty = remainingStock.get(key) ?? 0
        if (stockQty > 0 && (!best || stockQty > best.stock)) {
          best = { wh, sp, key, stock: stockQty }
        }
      }
    }

    if (!best) {
      allocations.set(order.subOrderId, {
        qty: 0,
        pool: { warehouseId: order.warehouseId, supplierId: order.supplierId },
        unitPrice: 0,
        total: 0,
      })
      continue
    }

    const basePrice =
      basePriceMap.get(priceKey(order.itemId, best.sp)) ?? 0
    const unitPrice = bankersRound(basePrice * tier, 2)

    const creditAvail = remainingCredit.get(order.customerId) ?? 0
    const maxByCredit =
      unitPrice > 0 ? creditAvail / unitPrice : Number.POSITIVE_INFINITY

    let qty = Math.min(order.request, best.stock, maxByCredit)
    qty = Math.max(0, bankersRound(qty, 2))
    const total = bankersRound(qty * unitPrice, 2)

    if (qty > 0) {
      remainingStock.set(best.key, bankersRound(best.stock - qty, 2))
      remainingCredit.set(
        order.customerId,
        bankersRound(creditAvail - total, 2)
      )
    }

    allocations.set(order.subOrderId, {
      qty,
      pool: { warehouseId: best.wh, supplierId: best.sp },
      unitPrice,
      total,
    })
  }

  return { allocations, remainingStock, remainingCredit }
}
