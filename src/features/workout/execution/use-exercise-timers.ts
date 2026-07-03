import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'treinei:exercise-timers'

export interface ExerciseTimerState {
  remainingMs: number
  totalMs: number
  exerciseName: string
  /** Texto curto da próxima série (ex.: "Série 2/4") — usado no chip e na notificação. */
  label: string
}

interface PersistedTimer {
  target: number
  totalMs: number
  exerciseName: string
  label: string
}

function loadPersisted(): Record<string, PersistedTimer> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, PersistedTimer>
  } catch {
    return {}
  }
}

function savePersisted(map: Record<string, PersistedTimer>) {
  if (Object.keys(map).length === 0) localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

let audioCtx: AudioContext | undefined

function playBeep() {
  try {
    audioCtx ??= new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = 880
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4)
    osc.stop(audioCtx.currentTime + 0.4)
  } catch {
    // WebAudio indisponível (raro) — vibração/notificação já cobrem o alerta.
  }
}

async function notifyTimerDone(exerciseName: string, label: string) {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  playBeep()

  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.getRegistration()
  await registration?.showNotification(`Hora de ${exerciseName} 💪`, {
    body: `Descanso acabou — ${label}.`,
    tag: `rest-timer-${exerciseName}`,
    icon: '/icons/icon-192.png',
  })
}

/**
 * Timers de descanso simultâneos por exercício (V3): cada `workout_exercise_id` tem seu
 * próprio countdown independente, todos rodando no mesmo Web Worker (RF14 original —
 * countdown por timestamp-alvo, não setInterval na main thread). Permite avançar para o
 * próximo exercício com o descanso do anterior ainda contando, replicando o fluxo real de
 * treino em academia. Wake Lock fica ativo enquanto QUALQUER timer estiver rodando.
 */
export function useExerciseTimers() {
  const workerRef = useRef<Worker | undefined>(undefined)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const persistedRef = useRef<Record<string, PersistedTimer>>({})
  const [timers, setTimers] = useState<Map<string, ExerciseTimerState>>(new Map())

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release()
    } catch {
      // no-op — já pode ter sido liberado pelo browser (troca de aba).
    }
    wakeLockRef.current = null
  }, [])

  const requestWakeLock = useCallback(async () => {
    if (wakeLockRef.current) return
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Negado/indisponível — os timers continuam funcionando via worker mesmo assim.
    }
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('./rest-timer-worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data as
        | { type: 'tick'; timers: { key: string; remainingMs: number }[] }
        | { type: 'done'; key: string }

      if (msg.type === 'tick') {
        setTimers((prev) => {
          const next = new Map(prev)
          for (const t of msg.timers) {
            const meta = persistedRef.current[t.key]
            if (!meta) continue
            next.set(t.key, {
              remainingMs: t.remainingMs,
              totalMs: meta.totalMs,
              exerciseName: meta.exerciseName,
              label: meta.label,
            })
          }
          return next
        })
      } else {
        const meta = persistedRef.current[msg.key]
        delete persistedRef.current[msg.key]
        savePersisted(persistedRef.current)
        setTimers((prev) => {
          const next = new Map(prev)
          next.delete(msg.key)
          return next
        })
        if (meta) void notifyTimerDone(meta.exerciseName, meta.label)
        if (Object.keys(persistedRef.current).length === 0) void releaseWakeLock()
      }
    }
    workerRef.current = worker

    // Retoma timers persistidos ainda válidos — sobrevive a reload no meio do descanso.
    const persisted = loadPersisted()
    const now = Date.now()
    const restored = new Map<string, ExerciseTimerState>()
    const stillValid: Record<string, PersistedTimer> = {}
    for (const [key, meta] of Object.entries(persisted)) {
      if (meta.target > now) {
        worker.postMessage({ type: 'start', key, targetTimestamp: meta.target })
        restored.set(key, { remainingMs: meta.target - now, totalMs: meta.totalMs, exerciseName: meta.exerciseName, label: meta.label })
        stillValid[key] = meta
      }
    }
    persistedRef.current = stillValid
    savePersisted(stillValid)
    if (restored.size > 0) {
      setTimers(restored)
      void requestWakeLock()
    }

    return () => {
      worker.terminate()
      void releaseWakeLock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(
    (key: string, seconds: number, exerciseName: string, label: string) => {
      if (Notification.permission === 'default') void Notification.requestPermission()
      const target = Date.now() + seconds * 1000
      persistedRef.current[key] = { target, totalMs: seconds * 1000, exerciseName, label }
      savePersisted(persistedRef.current)
      workerRef.current?.postMessage({ type: 'start', key, targetTimestamp: target })
      setTimers((prev) => {
        const next = new Map(prev)
        next.set(key, { remainingMs: seconds * 1000, totalMs: seconds * 1000, exerciseName, label })
        return next
      })
      void requestWakeLock()
    },
    [requestWakeLock],
  )

  const stop = useCallback(
    (key: string) => {
      workerRef.current?.postMessage({ type: 'stop', key })
      delete persistedRef.current[key]
      savePersisted(persistedRef.current)
      setTimers((prev) => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
      if (Object.keys(persistedRef.current).length === 0) void releaseWakeLock()
    },
    [releaseWakeLock],
  )

  return { timers, start, stop }
}
