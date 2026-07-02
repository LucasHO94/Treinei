import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// injectManifest + registerType 'prompt': o app decide quando aplicar a atualização
// (evita perder o registro de uma série no meio do treino ao recarregar sozinho).
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
