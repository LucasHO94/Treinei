import { db } from '@/lib/db'
import { SYNCED_TABLES } from '@/lib/db/schema'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

let draining = false
let scheduled = false

/** Pede um dreno da outbox "em breve" — coalesce múltiplas chamadas em um único drain. */
export function requestSync() {
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    void drainOutbox()
  })
}

/**
 * Drena a fila de mutações pendentes (outbox) para o Supabase, em ordem (FIFO).
 * Conflitos são resolvidos last-write-wins (adequado para app single-user).
 * Retry exponencial simples via contagem de tentativas; entradas com erro voltam
 * para o fim da fila implicitamente (não são removidas até sucesso).
 */
export async function drainOutbox() {
  if (draining) return
  if (!navigator.onLine || !isSupabaseConfigured) return
  draining = true

  try {
    const entries = await db.outbox.orderBy('created_at').toArray()

    for (const entry of entries) {
      try {
        if (entry.op === 'delete') {
          const { error } = await supabase.from(entry.table).delete().eq('id', entry.recordId)
          if (error) throw error
        } else {
          const { error } = await supabase.from(entry.table).upsert(entry.payload as never)
          if (error) throw error
        }
        await db.outbox.delete(entry.id!)
      } catch (err) {
        await db.outbox.update(entry.id!, { attempts: entry.attempts + 1 })
        // eslint-disable-next-line no-console
        console.warn(`[sync] falha ao sincronizar ${entry.table}/${entry.recordId}`, err)
        // Para no primeiro erro persistente: preserva ordem FIFO, evita martelar a API.
        break
      }
    }
  } finally {
    draining = false
  }
}

/**
 * Baixa o catálogo global (grupos musculares) — tabela somente-leitura, sem outbox.
 * Chamar uma vez no primeiro load e periodicamente (o catálogo muda raramente).
 */
export async function pullCatalog() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('muscle_groups').select('*')
  if (error || !data) return
  await db.muscle_groups.bulkPut(data)
}

/** Baixa o estado atual do Supabase para o Dexie — usado no login e reconexão. */
export async function pullAll(userId: string) {
  if (!isSupabaseConfigured) return
  for (const table of SYNCED_TABLES) {
    const query =
      table === 'nutrition_goals'
        ? supabase.from(table).select('*').eq('user_id', userId)
        : supabase.from(table).select('*')

    const { data, error } = await query
    if (error || !data) continue
    await db.table(table).bulkPut(data)
  }
}

export function initSyncEngine() {
  window.addEventListener('online', () => requestSync())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestSync()
  })
  requestSync()
}
