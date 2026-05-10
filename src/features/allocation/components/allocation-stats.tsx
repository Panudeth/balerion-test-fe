import { Activity, CircleCheck, DollarSign, Package } from "lucide-react"
import { StatCard } from "@/components/common/stat-card"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { useAllocationTotals } from "../hooks/use-allocation-store"

export function AllocationStats() {
  const { qty, value, fulfilled, total } = useAllocationTotals()
  const fulfillmentRate = total > 0 ? fulfilled / total : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Sub-Orders"
        value={formatNumber(total)}
        icon={Package}
        hint={`${formatNumber(fulfilled)} fulfilled`}
      />
      <StatCard
        title="Allocated Qty"
        value={formatNumber(qty)}
        icon={Activity}
      />
      <StatCard
        title="Allocated Value"
        value={formatCurrency(value)}
        icon={DollarSign}
      />
      <StatCard
        title="Fulfillment Rate"
        value={formatPercent(fulfillmentRate, 1)}
        icon={CircleCheck}
      />
    </div>
  )
}
