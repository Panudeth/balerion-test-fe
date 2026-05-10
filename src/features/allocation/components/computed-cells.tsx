import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import { useAllocationStore } from "../hooks/use-allocation-store"
import type { Order } from "../types"

const placeholder = <span className="text-muted-foreground">—</span>

function PoolCellImpl({ subOrderId }: { subOrderId: string }) {
  const pool = useAllocationStore((s) => s.allocations.get(subOrderId)?.pool)
  if (!pool) return placeholder
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {pool.warehouseId} / {pool.supplierId}
    </span>
  )
}
export const PoolCell = memo(PoolCellImpl)

function UnitPriceCellImpl({ subOrderId }: { subOrderId: string }) {
  const price = useAllocationStore(
    (s) => s.allocations.get(subOrderId)?.unitPrice
  )
  return price ? (
    <span className="tabular-nums">{formatCurrency(price)}</span>
  ) : (
    placeholder
  )
}
export const UnitPriceCell = memo(UnitPriceCellImpl)

function TotalCellImpl({ subOrderId }: { subOrderId: string }) {
  const total = useAllocationStore((s) => s.allocations.get(subOrderId)?.total)
  return total ? (
    <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
  ) : (
    placeholder
  )
}
export const TotalCell = memo(TotalCellImpl)

function StatusCellImpl({ order }: { order: Order }) {
  const qty = useAllocationStore(
    (s) => s.allocations.get(order.subOrderId)?.qty ?? 0
  )
  if (qty === 0) {
    return (
      <Badge
        variant="secondary"
        className="bg-red-500/15 text-red-700 dark:text-red-400"
      >
        Unfilled
      </Badge>
    )
  }
  if (qty < order.request) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-700 dark:text-amber-400"
      >
        Partial
      </Badge>
    )
  }
  return (
    <Badge
      variant="secondary"
      className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    >
      Filled
    </Badge>
  )
}
export const StatusCell = memo(StatusCellImpl)
