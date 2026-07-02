import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProfilePage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Metas de macros</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">Defina suas metas diárias de proteína, carboidrato, gordura e calorias.</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Ative lembretes de refeição e de treino.
        </CardContent>
      </Card>
    </div>
  )
}
