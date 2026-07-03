// Gera ícones placeholder do manifest PWA (fundo dark + halter estilizado em verde-lima).
// Substituir por artes finais de design antes do lançamento.
import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

const BG = [14, 17, 22, 255] // #0E1116
const FG = [163, 230, 53, 255] // #A3E635 (lime-400)

function setPixel(png, x, y, color) {
  // Coordenadas chegam fracionárias (círculos/retângulos calculados por escala) — sem
  // arredondar antes do índice, a parte fracionária de "y" vaza pro "<< 2" e embaralha
  // a posição real do pixel no buffer (bug que distorcia os ícones gerados).
  const px = Math.round(x)
  const py = Math.round(y)
  if (px < 0 || py < 0 || px >= png.width || py >= png.height) return
  const idx = (png.width * py + px) << 2
  png.data[idx] = color[0]
  png.data[idx + 1] = color[1]
  png.data[idx + 2] = color[2]
  png.data[idx + 3] = color[3]
}

function fillRect(png, x0, y0, x1, y1, color) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setPixel(png, x, y, color)
}

function fillCircle(png, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(png, cx + x, cy + y, color)
    }
  }
}

/** Desenha um halter estilizado centralizado, escalado para o tamanho do canvas. */
function drawDumbbell(png, size, scale) {
  const s = size * scale
  const barH = s * 0.12
  const barY0 = (size - barH) / 2
  const barY1 = barY0 + barH
  const barX0 = size * (0.5 - scale / 2) + s * 0.18
  const barX1 = size * (0.5 + scale / 2) - s * 0.18
  fillRect(png, barX0, barY0, barX1, barY1, FG)

  const plateR = s * 0.22
  const cy = size / 2
  fillCircle(png, barX0, cy, plateR, FG)
  fillCircle(png, barX1, cy, plateR, FG)
}

function generate(size, { maskable = false } = {}) {
  const png = new PNG({ width: size, height: size })
  fillRect(png, 0, 0, size, size, BG)
  // Ícone "any": halter ocupa quase toda a área.
  // Ícone "maskable": precisa caber na safe zone circular (raio de 40% do centro até
  // a borda, padrão adotado por Android adaptive icons/iOS/etc.) — escala 0.36 deixa
  // a ponta dos discos do halter a ~19,4% do centro, com folga dentro do limite de 40%.
  drawDumbbell(png, size, maskable ? 0.36 : 0.7)
  return PNG.sync.write(png)
}

writeFileSync(path.join(outDir, 'icon-192.png'), generate(192))
writeFileSync(path.join(outDir, 'icon-512.png'), generate(512))
writeFileSync(path.join(outDir, 'icon-maskable-512.png'), generate(512, { maskable: true }))

console.log('Icones gerados em', outDir)
