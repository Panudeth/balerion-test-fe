import { Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <div className="p-6 text-muted-foreground">setting up...</div>
          }
        />
      </Route>
    </Routes>
  )
}
