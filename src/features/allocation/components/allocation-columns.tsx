import type { ColumnDef } from "@tanstack/react-table"
import { formatDate, formatNumber } from "@/lib/format"
import type { Order } from "../types"
import { AllocatedCell } from "./allocated-cell"
import { OrderTypeBadge } from "./order-type-badge"
import {
  PoolCell,
  StatusCell,
  TotalCell,
  UnitPriceCell,
} from "./computed-cells"

/**
 * Columns are built once via `useMemo` in the parent.
 * Cells that depend on allocation state read from Zustand directly,
 * so column defs do not need to be rebuilt on edit.
 */
export function buildAllocationColumns(): ColumnDef<Order>[] {
  return [
    { accessorKey: "subOrderId", header: "Sub Order", size: 230 },
    { accessorKey: "customerId", header: "Customer", size: 100 },
    { accessorKey: "itemId", header: "Item", size: 90 },
    {
      accessorKey: "type",
      header: "Type",
      size: 120,
      cell: ({ row }) => <OrderTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "createDate",
      header: "Created",
      size: 110,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatDate(row.original.createDate)}</span>
      ),
    },
    { accessorKey: "warehouseId", header: "Req WH", size: 90 },
    { accessorKey: "supplierId", header: "Req SP", size: 90 },
    {
      accessorKey: "request",
      header: "Request",
      size: 90,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNumber(row.original.request)}</span>
      ),
    },
    {
      id: "allocated",
      header: "Allocated",
      size: 130,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => <AllocatedCell order={row.original} />,
    },
    {
      id: "pool",
      header: "From",
      size: 140,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => <PoolCell subOrderId={row.original.subOrderId} />,
    },
    {
      id: "unitPrice",
      header: "Unit Price",
      size: 110,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => <UnitPriceCell subOrderId={row.original.subOrderId} />,
    },
    {
      id: "total",
      header: "Total",
      size: 120,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => <TotalCell subOrderId={row.original.subOrderId} />,
    },
    {
      id: "status",
      header: "Status",
      size: 110,
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => <StatusCell order={row.original} />,
    },
  ]
}
