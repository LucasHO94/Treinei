import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'

export function useUserProfile(userId: string | undefined) {
  return useLiveQuery(async () => (userId ? db.user_profiles.get(userId) : undefined), [userId])
}

export function useBodyMetrics(userId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      const list = await db.body_metrics.where('user_id').equals(userId).toArray()
      return list.sort((a, b) => b.measured_on.localeCompare(a.measured_on))
    },
    [userId],
    [],
  )
}

/** Registro de peso mais recente (usado no cabeçalho do perfil). */
export function useLatestBodyMetric(userId: string | undefined) {
  const metrics = useBodyMetrics(userId)
  return metrics?.[0]
}

export function useBodyPhotos(userId: string | undefined) {
  return useLiveQuery(
    async () => {
      if (!userId) return []
      const list = await db.body_photos.where('user_id').equals(userId).toArray()
      return list.sort((a, b) => b.taken_on.localeCompare(a.taken_on))
    },
    [userId],
    [],
  )
}
