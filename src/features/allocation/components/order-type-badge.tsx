import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import type { OrderType } from "../types"

const styles: Record<OrderType, { label: string; className: string }> = {
  EMERGENCY: {
    label: "Emergency",
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  OVER_DUE: {
    label: "Overdue",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  DAILY: {
    label: "Daily",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
}

function OrderTypeBadgeImpl({ type }: { type: OrderType }) {
  const s = styles[type]
  return (
    <Badge variant="secondary" className={s.className}>
      {s.label}
    </Badge>
  )
}

export const OrderTypeBadge = memo(OrderTypeBadgeImpl)
