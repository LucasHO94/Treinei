import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function WorkoutPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treino</h1>
        <Button size="sm" variant="outline">
          <Plus /> Nova rotina
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nenhuma rotina cadastrada</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Crie sua primeira rotina e divida em treinos (A, B, C...) para começar a treinar.
        </CardContent>
      </Card>
    </div>
  )
}
