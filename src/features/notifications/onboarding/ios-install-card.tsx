import { Share, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isRunningStandalone } from '@/lib/push/subscribe'

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isSafari = /^((?!CriOS|FxiOS|OPiOS|mercury).)*safari/i.test(ua)
  return isIos && isSafari
}

/**
 * Push no iOS só funciona com o app instalado na Tela de Início (Safari 16.4+, RF17/18).
 * Mostra o tutorial só quando detecta iOS Safari rodando no navegador (não instalado).
 */
export function IosInstallCard() {
  if (isRunningStandalone() || !isIosSafari()) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instale o Treinei no seu iPhone</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm text-muted">
        <p>No iPhone, os lembretes só chegam com o app instalado na Tela de Início.</p>
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface">
            <Share className="size-3.5" />
          </span>
          Toque em <strong className="text-foreground">Compartilhar</strong> na barra do Safari.
        </div>
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-surface">
            <Plus className="size-3.5" />
          </span>
          Escolha <strong className="text-foreground">Adicionar à Tela de Início</strong>.
        </div>
      </CardContent>
    </Card>
  )
}
