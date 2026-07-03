import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/** Visível só para quem tem role='admin' — a autorização de verdade fica no Postgres. */
export function AdminEntryCard() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestor</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="accent" size="sm" onClick={() => navigate('/admin')}>
          <ShieldCheck className="size-4" /> Abrir painel de gestor
        </Button>
      </CardContent>
    </Card>
  )
}
