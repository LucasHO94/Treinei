import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { ExerciseMedia } from '@/components/exercise-media'
import type { Exercise } from '@/types/domain'

interface ExerciseDetailOverlayProps {
  exercise: Exercise | null
  onClose: () => void
}

/**
 * Overlay fullscreen de execução (paridade com o app de referência): mídia em
 * loop + metadados + instruções passo a passo. Aberto ao tocar no nome do
 * exercício em qualquer lista.
 */
export function ExerciseDetailOverlay({ exercise, onClose }: ExerciseDetailOverlayProps) {
  const group = useLiveQuery(
    async () => (exercise ? db.muscle_groups.get(exercise.muscle_group_id) : undefined),
    [exercise?.muscle_group_id],
  )

  return (
    <DialogPrimitive.Root open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] focus:outline-none"
          aria-describedby={undefined}
        >
          {exercise && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <DialogPrimitive.Title className="text-lg font-bold">{exercise.name}</DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Fechar"
                  className="flex size-9 items-center justify-center rounded-full bg-surface text-muted hover:text-foreground"
                >
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </div>

              <ExerciseMedia
                exercise={exercise}
                fit="contain"
                className="aspect-[4/3] w-full rounded-lg"
              />

              <div className="mt-3 flex flex-wrap gap-1.5">
                {group && <Badge>{group.name}</Badge>}
                {exercise.equipment && <Badge>{exercise.equipment}</Badge>}
                {exercise.level && <Badge>{exercise.level}</Badge>}
                {exercise.mechanics && <Badge>{exercise.mechanics}</Badge>}
                {exercise.force && <Badge>{exercise.force}</Badge>}
              </div>

              {(exercise.instructions?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-semibold text-muted">Como executar</h3>
                  <ol className="flex flex-col gap-2.5">
                    {exercise.instructions!.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {exercise.is_custom && (
                <p className="mt-4 text-sm text-muted">
                  Exercício personalizado — sem mídia de execução do catálogo.
                </p>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium capitalize text-muted">{children}</span>
  )
}
