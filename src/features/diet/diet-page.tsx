import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function DietPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dieta</h1>
        <Button size="sm" variant="accent">
          <Plus /> Nova refeição
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Nenhuma refeição programada</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Cadastre suas refeições diárias (Café da Manhã, Almoço, Lanche, Jantar) com os alimentos e macros.
        </CardContent>
      </Card>
    </div>
  )
}
