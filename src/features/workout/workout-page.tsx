import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Dumbbell, History, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useRoutines } from './lib/queries'
import { RoutineCard } from './builder/routine-card'
import { CreateRoutineDialog } from './builder/create-routine-dialog'

export function WorkoutPage() {
  const userId = useCurrentUserId()
  const routines = useRoutines(userId)
  const [createOpen, setCreateOpen] = useState(false)

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
