import { useState } from 'react'
import { Trash2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBodyMetrics } from './lib/queries'
import { addBodyMetric, deleteBodyMetric, todayDate } from './lib/actions'
import type { BodyMetric } from '@/types/domain'

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

export function BodyMetricsCard({ userId }: { userId: string }) {
  const metrics = useBodyMetrics(userId)
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(todayDate())
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (weight === '') return
    setSaving(true)
    try {
      await addBodyMetric(userId, { weight_kg: Number(weight), measured_on: date })
      setWeight('')
      setDate(todayDate())
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(metric: BodyMetric) {
    await deleteBodyMetric(metric)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" /> Peso
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Peso (kg)</span>
            <Input
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="80,5"
              className="w-full min-w-0"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Data</span>
            <Input
              type="date"
              value={date}
              max={todayDate()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0"
            />
          </label>
          <Button size="default" variant="accent" onClick={handleAdd} disabled={saving || weight === ''}>
            {saving ? '...' : 'Registrar'}
          </Button>
        </div>

        {metrics && metrics.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border">
            {metrics.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium">{m.weight_kg} kg</span>
                <span className="text-xs text-muted">{formatDate(m.measured_on)}</span>
                <button
                  type="button"
                  onClick={() => void handleDelete(m)}
                  aria-label="Excluir registro"
                  className="text-muted hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Registre seu peso para acompanhar a evolução.</p>
        )}
      </CardContent>
    </Card>
  )
}
