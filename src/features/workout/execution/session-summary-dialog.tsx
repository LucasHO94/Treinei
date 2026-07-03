import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartyPopper, Share2 } from 'lucide-react'
import { motion } from 'motion/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShareWorkoutSheet } from './share-workout-sheet'

interface SessionSummaryDialogProps {
  open: boolean
  workoutName: string
  volumeKg: number
  durationMin: number
  setsCompleted: number
}

export function SessionSummaryDialog({
  open,
  workoutName,
  volumeKg,
  durationMin,
  setsCompleted,
}: SessionSummaryDialogProps) {
  const navigate = useNavigate()
  const [shareOpen, setShareOpen] = useState(false)

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

        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" /> Compartilhar treino
          </Button>
          <Button onClick={() => navigate('/treino')}>Voltar para Treino</Button>
        </div>
      </DialogContent>

      <ShareWorkoutSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        workoutName={workoutName}
        durationMin={durationMin}
        volumeKg={volumeKg}
        setsCompleted={setsCompleted}
      />
    </Dialog>
  )
}
