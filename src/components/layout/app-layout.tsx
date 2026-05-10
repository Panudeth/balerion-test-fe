import { Outlet, useLocation } from "react-router-dom"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { AppHeader } from "./app-header"
import { navItems } from "./nav-config"

export function AppLayout() {
  const location = useLocation()
  const current = navItems.find((i) =>
    i.url === "/" ? location.pathname === "/" : location.pathname.startsWith(i.url)
  )
  const title = current?.title ?? "Admin"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader title={title} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
