export function poolKey(
  warehouseId: string,
  supplierId: string,
  itemId: string
): string {
  return `${warehouseId}|${supplierId}|${itemId}`
}

export function priceKey(itemId: string, supplierId: string): string {
  return `${itemId}|${supplierId}`
}
