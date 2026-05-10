import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"
import { AllocationPage } from "@/features/allocation"

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<AllocationPage />} />
        <Route
          path="*"
          element={
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">Page not found</p>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
