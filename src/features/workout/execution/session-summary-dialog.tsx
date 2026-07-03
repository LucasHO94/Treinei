import { useNavigate } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import { motion } from 'motion/react'
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
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
          >
            <PartyPopper className="mb-2 size-10 text-primary" />
          </motion.div>
          <DialogTitle className="text-lg">Treino concluído!</DialogTitle>
        </DialogHeader>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[
            { value: durationMin, label: 'minutos' },
            { value: setsCompleted, label: 'séries' },
            { value: Math.round(volumeKg), label: 'kg volume' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="rounded-md bg-surface p-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
            >
              <p className="font-display text-xl font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <Button onClick={() => navigate('/treino')}>Voltar para Treino</Button>
      </DialogContent>
    </Dialog>
  )
}
