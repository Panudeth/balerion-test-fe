import { memo, useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAllocationStore } from "../hooks/use-allocation-store"
import type { Order } from "../types"

interface Props {
  order: Order
}

/**
 * Editable allocation input.
 *
 * Re-render rules:
 *   - Subscribes to ONE entry: `s.allocations.get(order.subOrderId)`.
 *     Other rows' edits cause Object.is to return the same entry ref → no re-render here.
 *   - Local input state means keystrokes don't touch the store; commit on blur/Enter.
 */
function AllocatedCellImpl({ order }: Props) {
  const entry = useAllocationStore((s) => s.allocations.get(order.subOrderId))
  const setAllocation = useAllocationStore((s) => s.setAllocation)

  const qty = entry?.qty ?? 0
  const [local, setLocal] = useState(() => String(qty))

  // Resync local when the canonical value changes from outside (re-allocate, etc.)
  useEffect(() => {
    setLocal(String(qty))
  }, [qty])

  const commit = useCallback(() => {
    const parsed = Number(local)
    if (!Number.isFinite(parsed)) {
      setLocal(String(qty))
      return
    }
    if (parsed === qty) return

    setAllocation({
      order,
      newQty: parsed,
      onClamped: (to, reason) =>
        toast.warning(`Clamped to ${to}`, { description: reason }),
    })
  }, [local, qty, order, setAllocation])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") e.currentTarget.blur()
      else if (e.key === "Escape") {
        setLocal(String(qty))
        e.currentTarget.blur()
      }
    },
    [qty]
  )

  const isPartial = entry && entry.qty > 0 && entry.qty < order.request
  const isUnfilled = entry?.qty === 0

  return (
    <Input
      type="number"
      min={0}
      step={0.01}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-8 w-24 text-right tabular-nums",
        isPartial && "border-amber-500 focus-visible:ring-amber-500/40",
        isUnfilled && "border-red-500 focus-visible:ring-red-500/40"
      )}
    />
  )
}

export const AllocatedCell = memo(AllocatedCellImpl)
