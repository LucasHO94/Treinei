import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Dumbbell, History, Sparkles, Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useRoutines, useExerciseMap } from './lib/queries'
import { buildCuratedAbcdPlan, CURATED_ABCD_NAME } from './generator/engine'
import { createGeneratedRoutine } from './lib/actions'
import { RoutineCard } from './builder/routine-card'
import { CreateRoutineDialog } from './builder/create-routine-dialog'

export function WorkoutPage() {
  const userId = useCurrentUserId()
  const routines = useRoutines(userId)
  const exerciseMap = useExerciseMap()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [building, setBuilding] = useState(false)

  async function handleBuildAbcd() {
    const exercises = [...exerciseMap.values()]
    if (exercises.length === 0 || building) return
    setBuilding(true)
    try {
      const plan = buildCuratedAbcdPlan(exercises)
      const routine = await createGeneratedRoutine(userId, CURATED_ABCD_NAME, plan)
      navigate(`/treino/rotina/${routine.id}`)
    } finally {
      setBuilding(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treino</h1>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus /> Nova rotina
        </Button>
      </header>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" asChild className="flex-1">
          <Link to="/treino/catalogo">
            <Dumbbell className="size-4" /> Catálogo
          </Link>
        </Button>
        <Button size="sm" variant="ghost" asChild className="flex-1">
          <Link to="/treino/historico">
            <History className="size-4" /> Histórico
          </Link>
        </Button>
      </div>

      <Link
        to="/treino/gerar"
        className="flex items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4 transition-colors hover:bg-accent/15"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Treino sugerido</p>
          <p className="text-xs text-muted">Monte uma rotina pronta de acordo com seu objetivo</p>
        </div>
      </Link>

      {/* Programa curado (planilha do usuário), separado dos treinos sugeridos por objetivo. */}
      <button
        type="button"
        onClick={() => void handleBuildAbcd()}
        disabled={building || exerciseMap.size === 0}
        className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15 disabled:opacity-60"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
          <Flame className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{CURATED_ABCD_NAME}</p>
          <p className="text-xs text-muted">
            {building
              ? 'Montando programa ABCD...'
              : 'Divisão A · B · C · D de alta performance e hipertrofia'}
          </p>
        </div>
      </button>

      {routines != null && routines.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma rotina cadastrada</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">
            Crie sua primeira rotina e divida em treinos (A, B, C...) para começar a treinar.
          </CardContent>
        </Card>
      )}

      {(routines ?? []).map((routine) => (
        <RoutineCard key={routine.id} routine={routine} />
      ))}

      <CreateRoutineDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
