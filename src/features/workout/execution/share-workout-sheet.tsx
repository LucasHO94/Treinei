import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Download, Share2, Copy, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { drawShareCard } from './share-card'

interface ShareWorkoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workoutName: string
  durationMin: number
  volumeKg: number
  setsCompleted: number
}

const CAPTIONS = [
  (w: string) => `Mais um treino de ${w} concluído! \u{1F4AA}\u{1F525} Bora treinar comigo? #Treinei #FocoNoTreino #VidaFit`,
  (w: string) => `Treino ${w} feito! Suor de hoje, resultado de amanhã \u{1F4A6}\u{1F3CB} #Treinei #NoPainNoGain #Academia`,
  (w: string) => `Encerrando o treino de ${w} com a sensação de dever cumprido ✅\u{1F49A} #Treinei #Disciplina #Foco`,
]

/**
 * Card compartilhável pós-treino (V3): gera uma imagem em Canvas (branding + stats +
 * foto opcional do usuário) e usa a Web Share API para abrir o share sheet nativo
 * (Instagram/WhatsApp/Facebook escolhem a partir daí) — não existe API direta de
 * publicação para apps web pessoais, esse é o caminho padrão da indústria (Strava, etc).
 * Sem suporte a `share` com arquivos (ex.: desktop), cai no fallback de baixar + copiar texto.
 */
export function ShareWorkoutSheet({
  open,
  onOpenChange,
  workoutName,
  durationMin,
  volumeKg,
  setsCompleted,
}: ShareWorkoutSheetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string>()
  const [caption] = useState(() => CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)](workoutName))
  const [copied, setCopied] = useState(false)

  const dateLabel = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Callback ref (não useEffect): desenha assim que o <canvas> existe no DOM — o Radix
  // Dialog só monta o conteúdo do Sheet quando `open` vira true, então um efeito
  // dependente de `open` corre risco de rodar antes do node estar realmente commitado.
  // React chama este callback de novo sempre que a identidade muda (ex.: foto trocada).
  const canvasCallback = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      canvasRef.current = canvas
      if (!canvas) return
      const data = { workoutName, durationMin, volumeKg, setsCompleted, dateLabel }
      if (photoUrl) {
        const img = new Image()
        img.onload = () => drawShareCard(canvas, { ...data, photo: img })
        img.src = photoUrl
      } else {
        drawShareCard(canvas, data)
      }
    },
    [photoUrl, workoutName, durationMin, volumeKg, setsCompleted, dateLabel],
  )

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUrl(URL.createObjectURL(file))
  }

  function canvasToBlob(): Promise<Blob | null> {
    const canvas = canvasRef.current
    if (!canvas) return Promise.resolve(null)
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
  }

  async function handleDownload(existing?: Blob | null) {
    const blob = existing ?? (await canvasToBlob())
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'treinei.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const blob = await canvasToBlob()
    if (!blob) return
    const file = new File([blob], 'treinei.png', { type: 'image/png' })
    const shareData = { files: [file], text: caption, title: 'Treinei' }
    if (navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Usuário cancelou o share sheet ou o browser recusou — cai no fallback.
      }
    }
    void handleDownload(blob)
  }

  async function handleCopyCaption() {
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[92svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Compartilhar treino</SheetTitle>
          <SheetDescription>Poste no Instagram, Facebook ou WhatsApp direto pelo app.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <canvas ref={canvasCallback} className="aspect-[4/5] w-full" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Camera className="size-4" /> {photoUrl ? 'Trocar foto' : 'Adicionar foto (câmera ou galeria)'}
          </Button>

          <div className="rounded-md bg-surface p-3 text-sm text-muted">{caption}</div>
          <Button variant="ghost" size="sm" className="self-start" onClick={() => void handleCopyCaption()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copiado!' : 'Copiar texto'}
          </Button>

          <Button size="lg" variant="accent" onClick={() => void handleShare()}>
            <Share2 className="size-4" /> Compartilhar
          </Button>
          <Button variant="outline" onClick={() => void handleDownload()}>
            <Download className="size-4" /> Baixar imagem
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
