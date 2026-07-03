import { Dumbbell } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ExerciseMedia } from '@/components/exercise-media'
import type { Exercise } from '@/types/domain'

interface ExerciseSubstituteSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: Exercise
  substitutes: Exercise[]
  onSelect: (replacement: Exercise) => void
}

/** Mesma ideia do substituto de alimentos (V2): trocar um exercício sugerido por outro do mesmo grupo/nível/equipamento. */
export function ExerciseSubstituteSheet({
  open,
  onOpenChange,
  exercise,
  substitutes,
  onSelect,
}: ExerciseSubstituteSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[85svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Substituir {exercise.name}</SheetTitle>
          <SheetDescription>Mesmo grupo muscular, compatível com seu nível e equipamento.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-1">
          {substitutes.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface"
            >
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface text-muted">
                <ExerciseMedia exercise={candidate} animate={false} className="size-10" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{candidate.name}</p>
                <p className="truncate text-xs capitalize text-muted">
                  {candidate.equipment ?? 'Peso do corpo'} {candidate.level ? `· ${candidate.level}` : ''}
                </p>
              </div>
            </button>
          ))}

          {substitutes.length === 0 && (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
              <Dumbbell className="size-4 shrink-0" /> Sem substitutos compatíveis para este exercício.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
