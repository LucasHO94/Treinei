import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas — ' +
      'copie .env.example para .env.local e preencha com os dados do seu projeto Supabase. ' +
      'O app continua funcionando offline (Dexie); a sincronização fica desativada até configurar.',
  )
}

// createClient lança exceção síncrona se a URL for inválida/vazia — o que derrubaria
// a árvore React inteira antes mesmo do primeiro render. Usamos um placeholder válido
// como fallback para que o app offline-first continue funcionando sem Supabase configurado.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
