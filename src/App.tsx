import { useEffect } from 'react'
import { AppProviders } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { initSyncEngine, pullCatalog } from '@/lib/sync/engine'

function App() {
  useEffect(() => {
    initSyncEngine()
    void pullCatalog()
  }, [])

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App
