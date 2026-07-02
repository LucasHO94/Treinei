import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, UtensilsCrossed } from 'lucide-react'

export function TodayPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <p className="text-sm text-muted">Hoje</p>
        <h1 className="text-2xl font-bold">Bora treinar 💪</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5 text-primary" />
            Treino de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Nenhuma rotina ativa</p>
            <p className="text-sm text-muted">Crie uma rotina para começar</p>
          </div>
          <Button size="sm">Criar rotina</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-5 text-accent" />
            Próxima refeição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">Configure suas refeições na aba Dieta</p>
        </CardContent>
      </Card>
    </div>
  )
}
