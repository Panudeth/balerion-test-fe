export type OrderType = "EMERGENCY" | "OVER_DUE" | "DAILY"

export interface Order {
  orderId: string
  subOrderId: string
  itemId: string
  warehouseId: string
  supplierId: string
  request: number
  type: OrderType
  createDate: string
  customerId: string
  remark?: string
}

export interface Customer {
  customerId: string
  creditLimit: number
}

export interface PriceRow {
  itemId: string
  supplierId: string
  basePrice: number
}

export interface PriceTier {
  type: OrderType
  multiplier: number
}

export interface StockRow {
  warehouseId: string
  supplierId: string
  itemId: string
  available: number
}

export interface Pool {
  warehouseId: string
  supplierId: string
}

export interface AllocationEntry {
  qty: number
  pool: Pool
  unitPrice: number
  total: number
}

export const PRIORITY_RANK: Record<OrderType, number> = {
  EMERGENCY: 0,
  OVER_DUE: 1,
  DAILY: 2,
}

export const ANY_WAREHOUSE = "WH-000"
export const ANY_SUPPLIER = "SP-000"
