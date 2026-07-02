import { useCallback, useEffect, useRef, useState } from 'react'

const REST_TIMER_TARGET_KEY = 'treinei:rest-timer-target'

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

async function notifyTimerDone() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200])
  playBeep()

  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.getRegistration()
  await registration?.showNotification('Descanso acabou! 💪', {
    body: 'Hora da próxima série.',
    tag: 'rest-timer',
    icon: '/icons/icon-192.png',
  })
}

/**
 * Timer de descanso local (RF14): countdown roda em Web Worker por timestamp-alvo
 * (não setInterval na main thread), com Wake Lock enquanto ativo e alerta por
 * vibração + som + notificação local ao zerar. Persiste o alvo no localStorage
 * para retomar corretamente se a página recarregar no meio do descanso.
 */
export function useRestTimer() {
  const workerRef = useRef<Worker | undefined>(undefined)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [totalMs, setTotalMs] = useState(0)
  const [running, setRunning] = useState(false)

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release()
    } catch {
      // no-op — já pode ter sido liberado pelo browser (troca de aba).
    }
    wakeLockRef.current = null
  }, [])

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch {
      // Negado/indisponível — o timer continua funcionando via worker mesmo assim.
    }
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL('./rest-timer-worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data as { type: 'tick' | 'done'; remainingMs?: number }
      if (msg.type === 'tick') {
        setRemainingMs(msg.remainingMs ?? 0)
      } else {
        setRemainingMs(0)
        setRunning(false)
        localStorage.removeItem(REST_TIMER_TARGET_KEY)
        void notifyTimerDone()
        void releaseWakeLock()
      }
    }
    workerRef.current = worker

    const savedTarget = Number(localStorage.getItem(REST_TIMER_TARGET_KEY) ?? 0)
    if (savedTarget > Date.now()) {
      worker.postMessage({ type: 'start', targetTimestamp: savedTarget })
      setRunning(true)
      setRemainingMs(savedTarget - Date.now())
      setTotalMs(savedTarget - Date.now())
      void requestWakeLock()
    } else if (savedTarget) {
      localStorage.removeItem(REST_TIMER_TARGET_KEY)
    }

    return () => {
      worker.terminate()
      void releaseWakeLock()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = useCallback(
    (seconds: number) => {
      if (Notification.permission === 'default') void Notification.requestPermission()
      const target = Date.now() + seconds * 1000
      localStorage.setItem(REST_TIMER_TARGET_KEY, String(target))
      workerRef.current?.postMessage({ type: 'start', targetTimestamp: target })
      setRemainingMs(seconds * 1000)
      setTotalMs(seconds * 1000)
      setRunning(true)
      void requestWakeLock()
    },
    [requestWakeLock],
  )

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' })
    localStorage.removeItem(REST_TIMER_TARGET_KEY)
    setRunning(false)
    setRemainingMs(null)
    void releaseWakeLock()
  }, [releaseWakeLock])

  return { remainingMs, totalMs, running, start, stop }
}
