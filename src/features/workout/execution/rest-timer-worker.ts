// Countdown do descanso roda fora da main thread — nunca confia em tempo decorrido,
// sempre recalcula (targetTimestamp - now), então sobrevive a throttling de timers
// quando a aba perde foco (RF14).

type InMessage = { type: 'start'; targetTimestamp: number } | { type: 'stop' }
type OutMessage = { type: 'tick'; remainingMs: number } | { type: 'done' }

let intervalId: ReturnType<typeof setInterval> | undefined
let targetTimestamp = 0

onmessage = (event: MessageEvent) => {
  const msg = event.data as InMessage
  if (msg.type === 'start') {
    targetTimestamp = msg.targetTimestamp
    clearInterval(intervalId)
    tick()
    intervalId = setInterval(tick, 250)
  } else {
    clearInterval(intervalId)
    intervalId = undefined
  }
}

function tick() {
  const remainingMs = targetTimestamp - Date.now()
  const message: OutMessage = remainingMs <= 0 ? { type: 'done' } : { type: 'tick', remainingMs }
  postMessage(message)
  if (remainingMs <= 0) {
    clearInterval(intervalId)
    intervalId = undefined
  }
}
