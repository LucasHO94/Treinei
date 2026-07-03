import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CatalogPage } from './catalog-page'
import type { Exercise } from '@/types/domain'

interface ExercisePickerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Recebe todos os exercícios selecionados de uma vez (seleção múltipla V2). */
  onAdd: (exercises: Exercise[]) => void
}

/** Catálogo em modo seleção múltipla — o builder adiciona vários exercícios de uma vez. */
export function ExercisePickerSheet({ open, onOpenChange, onAdd }: ExercisePickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[90svh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar exercícios</SheetTitle>
        </SheetHeader>
        <CatalogPage
          embedded
          onAddMany={(exercises) => {
            onAdd(exercises)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
