import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCustomFood } from '@/features/diet/lib/actions'
import { useCurrentUserId } from '@/lib/auth/current-user'
import type { Food } from '@/types/domain'

interface CreateFoodSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onCreated?: (food: Food) => void
}

const EMPTY_FORM = { portionDesc: '100g', protein: '', carbs: '', fat: '', kcal: '' }

export function CreateFoodSheet({ open, onOpenChange, initialName, onCreated }: CreateFoodSheetProps) {
  const userId = useCurrentUserId()
  const [name, setName] = useState(initialName ?? '')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Mesmo cuidado do create-exercise-sheet: o Sheet fica montado entre aberturas,
  // então o reset precisa reagir à transição de `open` (controlado pelo pai), não a onOpenChange.
  useEffect(() => {
    if (open) {
      setName(initialName ?? '')
      setForm(EMPTY_FORM)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSave = name.trim().length > 1 && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      const food = await createCustomFood(userId, {
        name: name.trim(),
        portion_desc: form.portionDesc.trim() || '100g',
        portion_grams: null,
        protein_g: Number(form.protein) || 0,
        carbs_g: Number(form.carbs) || 0,
        fat_g: Number(form.fat) || 0,
        kcal: Number(form.kcal) || 0,
      })
      onCreated?.(food)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Criar alimento personalizado</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Nome do alimento</label>
            <Input
              autoFocus
              placeholder="Ex.: Frango grelhado"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Porção</label>
            <Input
              placeholder="Ex.: 100g, 1 unidade, 1 colher"
              value={form.portionDesc}
              onChange={(e) => setForm((f) => ({ ...f, portionDesc: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">Kcal</label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.kcal}
                onChange={(e) => setForm((f) => ({ ...f, kcal: e.target.value }))}
              />
            </div>
          </div>

          <Button variant="accent" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Salvando...' : 'Salvar alimento'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
