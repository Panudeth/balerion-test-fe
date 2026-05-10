import { useQuery } from "@tanstack/react-query"
import {
  fetchCustomers,
  fetchOrders,
  fetchPriceTiers,
  fetchPrices,
  fetchStock,
} from "../api/allocation-api"

const KEYS = {
  all: ["allocation"] as const,
  orders: () => [...KEYS.all, "orders"] as const,
  customers: () => [...KEYS.all, "customers"] as const,
  prices: () => [...KEYS.all, "prices"] as const,
  tiers: () => [...KEYS.all, "tiers"] as const,
  stock: () => [...KEYS.all, "stock"] as const,
}

export function useAllocationData() {
  const orders = useQuery({ queryKey: KEYS.orders(), queryFn: fetchOrders })
  const customers = useQuery({
    queryKey: KEYS.customers(),
    queryFn: fetchCustomers,
  })
  const prices = useQuery({ queryKey: KEYS.prices(), queryFn: fetchPrices })
  const tiers = useQuery({
    queryKey: KEYS.tiers(),
    queryFn: fetchPriceTiers,
  })
  const stock = useQuery({ queryKey: KEYS.stock(), queryFn: fetchStock })

  const isLoading =
    orders.isLoading ||
    customers.isLoading ||
    prices.isLoading ||
    tiers.isLoading ||
    stock.isLoading

  const isReady =
    !!orders.data &&
    !!customers.data &&
    !!prices.data &&
    !!tiers.data &&
    !!stock.data

  return {
    orders: orders.data,
    customers: customers.data,
    prices: prices.data,
    tiers: tiers.data,
    stock: stock.data,
    isLoading,
    isReady,
  }
}
