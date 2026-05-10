import type {
  Customer,
  Order,
  OrderType,
  PriceRow,
  PriceTier,
  StockRow,
} from "../types"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const ITEMS = ["Item-1", "Item-2", "Item-3", "Item-4", "Item-5"]
const WAREHOUSES = ["WH-001", "WH-002", "WH-003"]
const SUPPLIERS = ["SP-001", "SP-002", "SP-003"]

// Deterministic PRNG so allocation results are reproducible across reloads.
function createRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}
const rng = createRng(42)
const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)]

function pickType(): OrderType {
  const r = rng()
  if (r < 0.15) return "EMERGENCY"
  if (r < 0.4) return "OVER_DUE"
  return "DAILY"
}

const NUM_CUSTOMERS = 500
const NUM_SUB_ORDERS = 5_200

let _orders: Order[] | null = null

function generateOrders(): Order[] {
  if (_orders) return _orders
  const out: Order[] = []
  for (let i = 1; i <= NUM_SUB_ORDERS; i++) {
    const customerNum = ((i - 1) % NUM_CUSTOMERS) + 1
    const orderNum = Math.ceil(i / 2)
    const subOrderSuffix = String(i).padStart(5, "0")
    const useAnyWh = rng() < 0.15
    const useAnySp = rng() < 0.1
    const day = Math.floor(rng() * 90)
    const date = new Date(2025, 0, 1 + day)

    out.push({
      orderId: `ORDER-${String(orderNum).padStart(5, "0")}`,
      subOrderId: `ORDER-${String(orderNum).padStart(5, "0")}-${subOrderSuffix}`,
      itemId: pick(ITEMS),
      warehouseId: useAnyWh ? "WH-000" : pick(WAREHOUSES),
      supplierId: useAnySp ? "SP-000" : pick(SUPPLIERS),
      request: Math.floor(rng() * 200) + 5,
      type: pickType(),
      createDate: date.toISOString(),
      customerId: `CT-${String(customerNum).padStart(4, "0")}`,
      remark: rng() < 0.05 ? "Special for VIP" : undefined,
    })
  }
  _orders = out
  return out
}

export async function fetchOrders(): Promise<Order[]> {
  await sleep(300)
  return generateOrders()
}

export async function fetchCustomers(): Promise<Customer[]> {
  await sleep(150)
  const out: Customer[] = []
  for (let i = 1; i <= NUM_CUSTOMERS; i++) {
    out.push({
      customerId: `CT-${String(i).padStart(4, "0")}`,
      creditLimit: Math.floor(rng() * 200_000) + 30_000,
    })
  }
  return out
}

export async function fetchPrices(): Promise<PriceRow[]> {
  await sleep(120)
  const basePrices: Record<string, number> = {
    "Item-1": 99.75,
    "Item-2": 145.5,
    "Item-3": 220,
    "Item-4": 75.25,
    "Item-5": 310.8,
  }
  const out: PriceRow[] = []
  for (const item of ITEMS) {
    for (const sp of SUPPLIERS) {
      const variation = (rng() - 0.5) * 20
      out.push({
        itemId: item,
        supplierId: sp,
        basePrice: Math.max(1, basePrices[item] + variation),
      })
    }
  }
  return out
}

export async function fetchPriceTiers(): Promise<PriceTier[]> {
  await sleep(80)
  return [
    { type: "EMERGENCY", multiplier: 1.25 },
    { type: "OVER_DUE", multiplier: 1.0 },
    { type: "DAILY", multiplier: 0.9 },
  ]
}

export async function fetchStock(): Promise<StockRow[]> {
  await sleep(180)
  const out: StockRow[] = []
  for (const wh of WAREHOUSES) {
    for (const sp of SUPPLIERS) {
      for (const item of ITEMS) {
        if (rng() < 0.75) {
          out.push({
            warehouseId: wh,
            supplierId: sp,
            itemId: item,
            available: Math.floor(rng() * 8000) + 1000,
          })
        }
      }
    }
  }
  return out
}
