import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/common/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { AllocationStats } from "./components/allocation-stats"
import { AllocationToolbar } from "./components/allocation-toolbar"
import { AllocationTable } from "./components/allocation-table"
import { useAllocationData } from "./hooks/use-allocation-data"
import { useAllocationStore } from "./hooks/use-allocation-store"
import { autoAllocate } from "./lib/auto-allocate"

export function AllocationPage() {
  const data = useAllocationData()
  const hydrated = useAllocationStore((s) => s.hydrated)
  const hydrate = useAllocationStore((s) => s.hydrate)
  const reset = useAllocationStore((s) => s.reset)
  const [isAllocating, setIsAllocating] = useState(false)

  useEffect(() => {
    if (!data.isReady || hydrated) return
    runAutoAllocate(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.isReady, hydrated])

  function runAutoAllocate(notifyOnComplete: boolean) {
    if (
      !data.orders ||
      !data.customers ||
      !data.prices ||
      !data.tiers ||
      !data.stock
    ) {
      return
    }
    setIsAllocating(true)

    // Defer one tick so the UI can paint the loading state before the
    // synchronous allocation pass runs.
    setTimeout(() => {
      const start = performance.now()
      const result = autoAllocate({
        orders: data.orders!,
        customers: data.customers!,
        prices: data.prices!,
        tiers: data.tiers!,
        stock: data.stock!,
      })
      const ms = performance.now() - start
      hydrate(result)
      setIsAllocating(false)
      if (notifyOnComplete) {
        toast.success(
          `Allocated ${result.allocations.size.toLocaleString()} sub-orders in ${ms.toFixed(0)}ms`
        )
      }
    }, 0)
  }

  function handleReallocate() {
    reset()
    runAutoAllocate(true)
  }

  if (data.isLoading || !data.orders) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Allocation" description="Loading data..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-10" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Allocation"
        description={`${data.orders.length.toLocaleString()} sub-orders — auto-allocated by Emergency → Overdue → Daily, FIFO`}
      />
      <AllocationStats />
      <AllocationToolbar
        onReallocate={handleReallocate}
        isAllocating={isAllocating}
      />
      <AllocationTable orders={data.orders} />
    </div>
  )
}
