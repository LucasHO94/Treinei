import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createMeal } from '@/features/diet/lib/actions'
import { useCurrentUserId } from '@/lib/auth/current-user'

interface CreateMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMealDialog({ open, onOpenChange }: CreateMealDialogProps) {
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [time, setTime] = useState('12:00')
  const [saving, setSaving] = useState(false)

  const canSave = name.trim().length > 1 && time && !saving

  async function handleCreate() {
    if (!canSave) return
    setSaving(true)
    try {
      const meal = await createMeal(userId, name.trim(), `${time}:00`)
      setName('')
      setTime('12:00')
      onOpenChange(false)
      navigate(`/dieta/refeicao/${meal.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova refeição</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Nome</label>
            <Input
              autoFocus
              placeholder="Ex.: Café da Manhã"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Horário</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <Button variant="accent" onClick={handleCreate} disabled={!canSave}>
            {saving ? 'Criando...' : 'Criar refeição'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
