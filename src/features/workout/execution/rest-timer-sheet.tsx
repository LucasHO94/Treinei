import { SkipForward } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

interface RestTimerSheetProps {
  open: boolean
  remainingMs: number | null
  totalMs: number
  onSkip: () => void
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function RestTimerSheet({ open, remainingMs, totalMs, onSkip }: RestTimerSheetProps) {
  const remainingSeconds = Math.max(0, Math.ceil((remainingMs ?? 0) / 1000))
  const remainingFraction = totalMs > 0 ? Math.max(0, Math.min(1, (remainingMs ?? 0) / totalMs)) : 0

  return (
    <Sheet open={open}>
      <SheetContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <p className="mb-4 text-center text-sm font-medium text-muted">Descanso</p>
        <div className="relative mx-auto flex size-32 items-center justify-center">
          <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r={RADIUS} className="stroke-border" strokeWidth="8" fill="none" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              className="stroke-primary transition-[stroke-dashoffset] duration-200 ease-linear"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - remainingFraction)}
            />
          </svg>
          <span className="text-3xl font-bold tabular-nums">{remainingSeconds}s</span>
        </div>
        <Button variant="outline" className="mx-auto mt-6 w-full max-w-xs" onClick={onSkip}>
          <SkipForward className="size-4" /> Pular descanso
        </Button>
      </SheetContent>
    </Sheet>
  )
}
