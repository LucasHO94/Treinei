// Uso único: extrai os exercícios do seed V1 (local-seed.ts) para legacy-exercises.json,
// consumido pelo import-exercises.mjs para preservar IDs/nomes legados.
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync('src/lib/db/local-seed.ts', 'utf8')
const re = /\{ id: '([0-9a-f-]{36})', muscle_group_id: (\d+), name: '([^']+)'[^}]*created_at: '([^']+)'/g
const rows = [...src.matchAll(re)].map((m) => ({
  id: m[1],
  muscle_group_id: Number(m[2]),
  name: m[3],
  created_at: m[4],
}))
writeFileSync('scripts/legacy-exercises.json', JSON.stringify(rows, null, 2))
console.log('extraídos:', rows.length)
