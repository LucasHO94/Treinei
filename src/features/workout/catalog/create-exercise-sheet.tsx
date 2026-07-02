import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMuscleGroups } from '@/features/workout/lib/queries'
import { createCustomExercise } from '@/features/workout/lib/actions'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/domain'

interface CreateExerciseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMuscleGroupId?: number
  initialName?: string
  onCreated?: (exercise: Exercise) => void
}

export function CreateExerciseSheet({
  open,
  onOpenChange,
  defaultMuscleGroupId,
  initialName,
  onCreated,
}: CreateExerciseSheetProps) {
  const muscleGroups = useMuscleGroups()
  const userId = useCurrentUserId()
  const [name, setName] = useState(initialName ?? '')
  const [muscleGroupId, setMuscleGroupId] = useState<number | undefined>(defaultMuscleGroupId)
  const [saving, setSaving] = useState(false)

  // O Sheet fica montado entre aberturas (Radix), então o estado do form só deve
  // resetar quando `open` transiciona para true — reagir a `onOpenChange` não cobre
  // o caso em que o pai controla `open` diretamente (ex.: botão "criar" da busca vazia).
  useEffect(() => {
    if (open) {
      setName(initialName ?? '')
      setMuscleGroupId(defaultMuscleGroupId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSave = name.trim().length > 1 && muscleGroupId != null && !saving

  async function handleSave() {
    if (!canSave || muscleGroupId == null) return
    setSaving(true)
    try {
      const exercise = await createCustomExercise(muscleGroupId, name.trim(), userId)
      onCreated?.(exercise)
      setName('')
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Criar exercício personalizado</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Nome do exercício</label>
            <Input
              autoFocus
              placeholder="Ex.: Supino inclinado com halteres"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Grupo muscular</label>
            <div className="flex flex-wrap gap-2">
              {(muscleGroups ?? []).map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setMuscleGroupId(group.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    muscleGroupId === group.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-foreground hover:bg-card',
                  )}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={!canSave}>
            {saving ? 'Salvando...' : 'Salvar exercício'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
