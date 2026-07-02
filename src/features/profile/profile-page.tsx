import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrentUserId } from '@/lib/auth/current-user'
import { useNutritionGoals } from '@/features/diet/lib/queries'
import { setNutritionGoals } from '@/features/diet/lib/actions'
import { PushPermissionCard } from '@/features/notifications/push-permission-card'
import { WorkoutReminderCard } from '@/features/notifications/workout-reminder-card'
import { IosInstallCard } from '@/features/notifications/onboarding/ios-install-card'

const EMPTY_FORM = { protein: '', carbs: '', fat: '', kcal: '' }

export function ProfilePage() {
  const userId = useCurrentUserId()
  const goals = useNutritionGoals(userId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Semeia o form uma única vez quando os dados chegam do Dexie — depois disso o form
  // é a fonte da verdade até o usuário salvar (evita sobrescrever o que está digitando).
  useEffect(() => {
    if (goals && !loaded) {
      setForm({
        protein: goals.protein_g != null ? String(goals.protein_g) : '',
        carbs: goals.carbs_g != null ? String(goals.carbs_g) : '',
        fat: goals.fat_g != null ? String(goals.fat_g) : '',
        kcal: goals.kcal != null ? String(goals.kcal) : '',
      })
      setLoaded(true)
    }
  }, [goals, loaded])

  async function handleSave() {
    setSaving(true)
    try {
      await setNutritionGoals(userId, {
        protein_g: form.protein === '' ? null : Number(form.protein),
        carbs_g: form.carbs === '' ? null : Number(form.carbs),
        fat_g: form.fat === '' ? null : Number(form.fat),
        kcal: form.kcal === '' ? null : Number(form.kcal),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Metas de macros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Defina suas metas diárias de proteína, carboidrato, gordura e calorias.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Calorias (kcal)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.kcal}
                onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Proteína (g)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.protein}
                onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Carboidrato (g)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.carbs}
                onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Gordura (g)</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.fat}
                onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
              />
            </div>
          </div>
          <Button size="sm" variant="accent" onClick={handleSave} disabled={saving} className="self-start">
            {saving ? 'Salvando...' : 'Salvar metas'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PushPermissionCard userId={userId} />
          <div className="h-px bg-border" />
          <WorkoutReminderCard userId={userId} />
          <p className="text-xs text-muted">
            Lembretes de refeição seguem o horário e o interruptor "Notificar" de cada refeição, em Dieta.
          </p>
        </CardContent>
      </Card>

      <IosInstallCard />
    </div>
  )
}
