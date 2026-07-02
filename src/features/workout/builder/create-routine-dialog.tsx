import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createRoutine } from '@/features/workout/lib/actions'
import { useCurrentUserId } from '@/lib/auth/current-user'

interface CreateRoutineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoutineDialog({ open, onOpenChange }: CreateRoutineDialogProps) {
  const userId = useCurrentUserId()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (name.trim().length < 2) return
    setSaving(true)
    try {
      const routine = await createRoutine(userId, name.trim())
      setName('')
      onOpenChange(false)
      navigate(`/treino/rotina/${routine.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova rotina</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Ex.: Hipertrofia 5x semana"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate()
            }}
          />
          <Button onClick={handleCreate} disabled={name.trim().length < 2 || saving}>
            {saving ? 'Criando...' : 'Criar rotina'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
