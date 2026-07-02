import { db } from './index'
import type { SyncedTable, OutboxOp } from './schema'
import { requestSync } from '@/lib/sync/engine'

/**
 * Grava uma mutação localmente (Dexie) e enfileira na outbox para sincronizar com o Supabase.
 * Usar para TODA escrita de tabelas sincronizáveis — nunca escrever direto no Supabase client
 * a partir da UI (isso quebraria o funcionamento offline).
 */
export async function mutate<T extends { id: string }>(
  table: SyncedTable,
  op: OutboxOp,
  record: T,
): Promise<void> {
  await db.transaction('rw', db.table(table), db.outbox, async () => {
    if (op === 'delete') {
      await db.table(table).delete(record.id)
    } else {
      await db.table(table).put(record)
    }
    await db.outbox.add({
      table,
      op,
      recordId: record.id,
      payload: op === 'delete' ? { id: record.id } : record,
      created_at: new Date().toISOString(),
      attempts: 0,
    })
  })

  requestSync()
}
