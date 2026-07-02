import { Outlet } from 'react-router-dom'
import { BottomNav } from './bottom-nav'

export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-1 flex-col bg-background">
      <main className="flex-1 overflow-y-auto pb-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
