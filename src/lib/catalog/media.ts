// Resolução de mídia do catálogo de exercícios.
//
// Os paths em exercise.images / muscle_group.image_url são relativos (ex.:
// "Dumbbell_Bench_Press/0.jpg"). Resolvem via jsDelivr (CDN de borda, com cache
// e sem rate-limit) apontando pro free-exercise-db, fixado num commit específico
// — raw.githubusercontent.com não tem cache de borda e ficava lento/instável em
// rede móvel. Quando o Supabase Storage existir, basta trocar esta base para o
// bucket público `exercise-media` — nenhum dado precisa ser migrado.
const EXERCISE_IMAGE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@b0eed061e1c832b3ed815fbaa4b45b3cdc14df49/exercises/'

export function exerciseImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null
  return EXERCISE_IMAGE_BASE + relativePath
}
