import { useState } from 'react'
import { Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { INTENSITY_ORDER, INTENSITY_LABEL } from '@/features/workout/lib/intensity'
import { cn } from '@/lib/utils'
import type { Intensity, PlannedSet, SessionSet } from '@/types/domain'

interface ExecutionSetRowProps {
  plannedSet: PlannedSet
  existing: SessionSet | undefined
  placeholderReps: number | undefined
  placeholderWeight: number | undefined
  onComplete: (values: { reps: number | null; weight_kg: number | null; intensity: Intensity }) => void
}

export function ExecutionSetRow({
  plannedSet,
  existing,
  placeholderReps,
  placeholderWeight,
  onComplete,
}: ExecutionSetRowProps) {
  const [reps, setReps] = useState(existing?.reps != null ? String(existing.reps) : '')
  const [weight, setWeight] = useState(existing?.weight_kg != null ? String(existing.weight_kg) : '')
  const [intensity, setIntensity] = useState<Intensity>(existing?.intensity ?? plannedSet.intensity)
  const done = !!existing

  const repsPlaceholder = placeholderReps ?? plannedSet.target_reps
  const weightPlaceholder = placeholderWeight ?? plannedSet.target_weight_kg

  return (
    <div
      className={cn(
        'grid grid-cols-[1.5rem_1fr_1fr_1fr_2.5rem] items-center gap-2',
        done && 'opacity-70',
      )}
    >
      <span className="text-sm tabular-nums text-muted">{plannedSet.set_number}</span>
      <Input
        inputMode="numeric"
        placeholder={repsPlaceholder != null ? String(repsPlaceholder) : '—'}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
      />
      <Input
        inputMode="decimal"
        placeholder={weightPlaceholder != null ? String(weightPlaceholder) : '—'}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <select
        value={intensity}
        onChange={(e) => setIntensity(e.target.value as Intensity)}
        className="h-11 rounded-md border border-border bg-surface px-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {INTENSITY_ORDER.map((i) => (
          <option key={i} value={i}>
            {INTENSITY_LABEL[i]}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label="Concluir série"
        onClick={() =>
          onComplete({
            reps: reps === '' ? null : Number(reps),
            weight_kg: weight === '' ? null : Number(weight),
            intensity,
          })
        }
        className={cn(
          'flex size-9 items-center justify-center rounded-full border transition-colors',
          done
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border text-muted hover:border-primary hover:text-primary',
        )}
      >
        <Check className="size-4" />
      </button>
    </div>
  )
}
