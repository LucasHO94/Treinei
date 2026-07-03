// Resolução de mídia do catálogo de exercícios.
//
// Os paths em exercise.images / muscle_group.image_url são relativos (ex.:
// "Dumbbell_Bench_Press/0.jpg"). Hoje resolvem para o CDN do free-exercise-db
// (domínio público); quando o Supabase Storage existir, basta trocar esta base
// para o bucket público `exercise-media` — nenhum dado precisa ser migrado.
const EXERCISE_IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

export function exerciseImageUrl(relativePath: string | null | undefined): string | null {
  if (!relativePath) return null
  return EXERCISE_IMAGE_BASE + relativePath
}
