// Card compartilhável pós-treino (V3): desenhado em Canvas 2D, sem dependências externas
// nem assets remotos — funciona 100% offline. Proporção 4:5 (feed) que também funciona
// bem cortado em 9:16 (story) na maioria dos apps de rede social.

export interface ShareCardData {
  workoutName: string
  durationMin: number
  volumeKg: number
  setsCompleted: number
  dateLabel: string
  photo?: HTMLImageElement
}

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy)
      line = word
      cy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
  return cy + lineHeight
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const imgRatio = img.width / img.height
  const targetRatio = w / h
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height
  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / targetRatio
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)
}

export function drawShareCard(canvas: HTMLCanvasElement, data: ShareCardData) {
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  if (data.photo) {
    drawCoverImage(ctx, data.photo, CARD_WIDTH, CARD_HEIGHT)
    const scrim = ctx.createLinearGradient(0, CARD_HEIGHT * 0.3, 0, CARD_HEIGHT)
    scrim.addColorStop(0, 'rgba(14,17,22,0)')
    scrim.addColorStop(1, 'rgba(14,17,22,0.95)')
    ctx.fillStyle = scrim
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
    ctx.fillStyle = 'rgba(14,17,22,0.2)'
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  } else {
    const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    bg.addColorStop(0, '#0E1116')
    bg.addColorStop(1, '#161d14')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    ctx.beginPath()
    ctx.arc(CARD_WIDTH * 0.85, CARD_HEIGHT * 0.16, 260, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(163, 230, 53, 0.12)'
    ctx.fill()
  }

  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = '#A3E635'
  ctx.font = '700 52px system-ui, -apple-system, sans-serif'
  ctx.fillText('Treinei \u{1F4AA}', 64, 120)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 64px system-ui, -apple-system, sans-serif'
  const afterTitleY = wrapText(ctx, data.workoutName, 64, 250, CARD_WIDTH - 128, 72)

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '500 32px system-ui, -apple-system, sans-serif'
  ctx.fillText(data.dateLabel, 64, Math.max(afterTitleY, 320))

  const stats: { value: string; label: string }[] = [
    { value: String(data.durationMin), label: 'minutos' },
    { value: String(data.setsCompleted), label: 'séries' },
    { value: String(Math.round(data.volumeKg)), label: 'kg volume' },
  ]
  const statsY = CARD_HEIGHT - 220
  const colWidth = (CARD_WIDTH - 128) / 3
  stats.forEach((s, i) => {
    const x = 64 + i * colWidth
    ctx.fillStyle = '#A3E635'
    ctx.font = '700 72px system-ui, -apple-system, sans-serif'
    ctx.fillText(s.value, x, statsY)
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.font = '500 28px system-ui, -apple-system, sans-serif'
    ctx.fillText(s.label, x, statsY + 40)
  })

  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.font = '500 28px system-ui, -apple-system, sans-serif'
  ctx.fillText('Feito com o app Treinei', 64, CARD_HEIGHT - 64)
}
