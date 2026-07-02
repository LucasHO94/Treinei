import { useEffect } from 'react'
import { AppProviders } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { initSyncEngine, pullCatalog } from '@/lib/sync/engine'
import { ensureLocalSeed } from '@/lib/db/ensure-seed'

function App() {
  useEffect(() => {
    initSyncEngine()
    void ensureLocalSeed().then(() => pullCatalog())
  }, [])

  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App
