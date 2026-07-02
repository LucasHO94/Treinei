import { useNavigate } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SessionSummaryDialogProps {
  open: boolean
  volumeKg: number
  durationMin: number
  setsCompleted: number
}

export function SessionSummaryDialog({ open, volumeKg, durationMin, setsCompleted }: SessionSummaryDialogProps) {
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && navigate('/treino')}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <PartyPopper className="mb-2 size-8 text-primary" />
          <DialogTitle>Treino concluído!</DialogTitle>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-surface p-3">
            <p className="text-lg font-bold tabular-nums">{durationMin}</p>
            <p className="text-xs text-muted">minutos</p>
          </div>
          <div className="rounded-md bg-surface p-3">
            <p className="text-lg font-bold tabular-nums">{setsCompleted}</p>
            <p className="text-xs text-muted">séries</p>
          </div>
          <div className="rounded-md bg-surface p-3">
            <p className="text-lg font-bold tabular-nums">{Math.round(volumeKg)}</p>
            <p className="text-xs text-muted">kg volume</p>
          </div>
        </div>

        <Button onClick={() => navigate('/treino')}>Voltar para Treino</Button>
      </DialogContent>
    </Dialog>
  )
}
