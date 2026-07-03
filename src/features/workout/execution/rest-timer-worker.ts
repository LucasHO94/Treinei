// Countdown do descanso roda fora da main thread — nunca confia em tempo decorrido,
// sempre recalcula (targetTimestamp - now), então sobrevive a throttling de timers
// quando a aba perde foco (RF14). Suporta múltiplos timers simultâneos (um por
// exercício) chaveados por `key` (workout_exercise_id), para o cenário de avançar
// para o próximo exercício com o descanso do anterior ainda rodando.

type InMessage = { type: 'start'; key: string; targetTimestamp: number } | { type: 'stop'; key: string }
type OutMessage =
  | { type: 'tick'; timers: { key: string; remainingMs: number }[] }
  | { type: 'done'; key: string }

const targets = new Map<string, number>()
let intervalId: ReturnType<typeof setInterval> | undefined

onmessage = (event: MessageEvent) => {
  const msg = event.data as InMessage
  if (msg.type === 'start') {
    targets.set(msg.key, msg.targetTimestamp)
    ensureLoop()
  } else {
    targets.delete(msg.key)
  }
}

function ensureLoop() {
  if (intervalId) return
  tick()
  intervalId = setInterval(tick, 250)
}

function tick() {
  if (targets.size === 0) {
    clearInterval(intervalId)
    intervalId = undefined
    return
  }
  const now = Date.now()
  const ticks: { key: string; remainingMs: number }[] = []
  for (const [key, target] of [...targets.entries()]) {
    const remainingMs = target - now
    if (remainingMs <= 0) {
      targets.delete(key)
      postMessage({ type: 'done', key } satisfies OutMessage)
    } else {
      ticks.push({ key, remainingMs })
    }
  }
  if (ticks.length > 0) postMessage({ type: 'tick', timers: ticks } satisfies OutMessage)
}
