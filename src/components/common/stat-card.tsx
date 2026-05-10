import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  /** percent change as decimal (0.12 = +12%) */
  change?: number
  hint?: string
}

export function StatCard({ title, value, icon: Icon, change, hint }: StatCardProps) {
  const positive = (change ?? 0) >= 0
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(change !== undefined || hint) && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {change !== undefined && (
              <span
                className={cn(
                  "flex items-center gap-0.5 font-medium",
                  positive ? "text-emerald-600" : "text-red-600"
                )}
              >
                {positive ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {Math.abs(change * 100).toFixed(1)}%
              </span>
            )}
            {hint && <span>{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
