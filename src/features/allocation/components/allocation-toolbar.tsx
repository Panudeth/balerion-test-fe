import { RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAllocationUI } from "../hooks/use-allocation-ui"
import type { OrderType } from "../types"

interface Props {
  onReallocate: () => void
  isAllocating: boolean
}

export function AllocationToolbar({ onReallocate, isAllocating }: Props) {
  const search = useAllocationUI((s) => s.search)
  const setSearch = useAllocationUI((s) => s.setSearch)
  const typeFilter = useAllocationUI((s) => s.typeFilter)
  const setTypeFilter = useAllocationUI((s) => s.setTypeFilter)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search order, customer, item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select
        value={typeFilter}
        onValueChange={(v) => setTypeFilter(v as OrderType | "ALL")}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All types</SelectItem>
          <SelectItem value="EMERGENCY">Emergency</SelectItem>
          <SelectItem value="OVER_DUE">Overdue</SelectItem>
          <SelectItem value="DAILY">Daily</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={onReallocate}
        disabled={isAllocating}
      >
        <RotateCcw className="mr-2 size-4" />
        Re-run auto-allocate
      </Button>
    </div>
  )
}
