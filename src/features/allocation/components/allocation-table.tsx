import { useMemo } from "react"
import { DataTable } from "@/components/common/data-table"
import { useAllocationUI } from "../hooks/use-allocation-ui"
import type { Order } from "../types"
import { buildAllocationColumns } from "./allocation-columns"

interface Props {
  orders: Order[]
}

export function AllocationTable({ orders }: Props) {
  const search = useAllocationUI((s) => s.search)
  const setSearch = useAllocationUI((s) => s.setSearch)
  const typeFilter = useAllocationUI((s) => s.typeFilter)

  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return orders
    return orders.filter((o) => o.type === typeFilter)
  }, [orders, typeFilter])

  // Columns are stable for the lifetime of the page — cells read from Zustand,
  // so column defs never need to be rebuilt on edit.
  const columns = useMemo(() => buildAllocationColumns(), [])

  return (
    <DataTable
      columns={columns}
      data={filtered}
      globalFilter={search}
      onGlobalFilterChange={setSearch}
      height="calc(100vh - 340px)"
      estimateSize={52}
    />
  )
}
