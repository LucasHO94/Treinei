import { Link } from 'react-router-dom'
import { Trash2, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWorkouts } from '@/features/workout/lib/queries'
import { deleteRoutine } from '@/features/workout/lib/actions'
import type { Routine } from '@/types/domain'

export function RoutineCard({ routine }: { routine: Routine }) {
  const workouts = useWorkouts(routine.id)

  async function handleDelete() {
    if (!window.confirm(`Excluir a rotina "${routine.name}"? Isso remove todas as divisões e exercícios dela.`)) return
    await deleteRoutine(routine.id)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <Link to={`/treino/rotina/${routine.id}`} className="flex-1">
          <CardTitle>{routine.name}</CardTitle>
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Excluir rotina"
          className="text-muted hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {(workouts ?? []).length === 0 ? (
          <Link to={`/treino/rotina/${routine.id}`} className="text-sm text-muted">
            Adicionar divisões (A, B, C...)
          </Link>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(workouts ?? []).map((workout) => (
              <Button key={workout.id} size="sm" variant="outline" asChild>
                <Link to={`/treino/executar/${workout.id}`}>
                  <Play className="size-3.5" /> {workout.label}
                </Link>
              </Button>
            ))}
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/treino/rotina/${routine.id}`}>Editar</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
