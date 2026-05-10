import { Boxes } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { title: "Allocation", url: "/", icon: Boxes },
]
